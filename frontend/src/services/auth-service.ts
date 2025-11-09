// Auth Service - Supports both AWS Cognito and Mock mode
import { signIn, signUp, signOut, getCurrentUser as getCognitoUser, fetchAuthSession } from 'aws-amplify/auth';
import type { User } from '../App';

export interface AuthError {
  message: string;
  code: string;
}

export interface SignInResult {
  isSignedIn: boolean;
  user?: User;
  error?: AuthError;
}

// Configuration: Use mock auth by default, set VITE_USE_MOCK_API=false to use real Cognito
const USE_MOCK_AUTH = (import.meta.env.VITE_USE_MOCK_API ?? 'true') !== 'false'; // Defaults to true

// Mock users for development
const mockUsers = [
  {
    username: 'testuser',
    password: 'Test123!',
    attributes: {
      sub: 'mock-user-1',
      email: 'test@student.edu',
      name: 'Test User',
    },
  },
  {
    username: 'student',
    password: 'Student123!',
    attributes: {
      sub: 'mock-user-2',
      email: 'student@university.edu',
      name: 'Jane Student',
    },
  },
];

class MockAuthService {
  private currentUser: User | null = null;
  private readonly STORAGE_KEY = 'amplifyMockUsers';

  // Get all registered users (mock users + localStorage users)
  private getRegisteredUsers() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const storedUsers = stored ? JSON.parse(stored) : [];
    return [...mockUsers, ...storedUsers];
  }

  // Save a new user to localStorage
  private saveRegisteredUser(username: string, password: string, nickname: string, sub: string) {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const storedUsers = stored ? JSON.parse(stored) : [];
    storedUsers.push({
      username,
      password,
      attributes: {
        sub,
        email: username,
        name: nickname,
      },
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedUsers));
  }

  async signIn(username: string, password: string): Promise<SignInResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const allUsers = this.getRegisteredUsers();
    const userRecord = allUsers.find(
      (u) => u.username === username && u.password === password
    );

    if (!userRecord) {
      return {
        isSignedIn: false,
        error: {
          message: 'Incorrect username or password',
          code: 'NotAuthorizedException',
        },
      };
    }

    const user: User = {
      id: userRecord.attributes.sub,
      name: userRecord.attributes.name,
      email: userRecord.attributes.email,
    };

    this.currentUser = user;
    localStorage.setItem('amplifyUser', JSON.stringify(user));
    localStorage.setItem('amplifySession', 'mock-session-token');

    return {
      isSignedIn: true,
      user,
    };
  }

  async signUp(
    username: string,
    password: string,
    nickname: string
  ): Promise<{ success: boolean; error?: AuthError; confirmationRequired?: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const allUsers = this.getRegisteredUsers();

    if (allUsers.find((u) => u.username === username)) {
      return {
        success: false,
        error: {
          message: 'Username already exists',
          code: 'UsernameExistsException',
        },
      };
    }

    const sub = `mock-user-${Date.now()}`;
    this.saveRegisteredUser(username, password, nickname, sub);

    return { success: true };
  }

  async signOut(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.currentUser = null;
    localStorage.removeItem('amplifyUser');
    localStorage.removeItem('amplifySession');
  }

  async getCurrentUser(): Promise<User | null> {
    const savedUser = localStorage.getItem('amplifyUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      return this.currentUser;
    }
    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async getAuthToken(): Promise<string | null> {
    // Return mock token for API calls in mock mode
    return localStorage.getItem('amplifySession') || 'mock-token';
  }
}

class CognitoAuthService {
  // Sign in with username/email and password
  async signIn(username: string, password: string): Promise<SignInResult> {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username,
        password,
      });

      if (isSignedIn) {
        const user = await this.getCurrentUser();
        if (user) {
          return {
            isSignedIn: true,
            user,
          };
        }
      }

      // Handle MFA or other next steps
      if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_SMS_CODE') {
        return {
          isSignedIn: false,
          error: {
            message: 'SMS MFA is required. Please check your phone for the verification code.',
            code: 'MFA_REQUIRED',
          },
        };
      }

      if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        return {
          isSignedIn: false,
          error: {
            message: 'Please verify your email address before signing in.',
            code: 'CONFIRMATION_REQUIRED',
          },
        };
      }

      return {
        isSignedIn: false,
        error: {
          message: 'Sign in failed. Please check your credentials.',
          code: 'SIGN_IN_FAILED',
        },
      };
    } catch (error: any) {
      return {
        isSignedIn: false,
        error: {
          message: error.message || 'An error occurred during sign in',
          code: error.name || 'UnknownError',
        },
      };
    }
  }

  // Sign up a new user
  async signUp(
    username: string,
    password: string,
    nickname: string
  ): Promise<{ success: boolean; error?: AuthError; confirmationRequired?: boolean }> {
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email: username,
            nickname,
          },
          autoSignIn: {
            enabled: false, // We'll sign in manually after confirmation
          },
        },
      });

      if (isSignUpComplete) {
        // User was auto-confirmed, sign them in
        const signInResult = await this.signIn(username, password);
        if (signInResult.isSignedIn) {
          return { success: true };
        }
        return {
          success: false,
          error: signInResult.error,
        };
      }

      // Email verification required
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        return {
          success: true,
          confirmationRequired: true,
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'An error occurred during sign up',
          code: error.name || 'UnknownError',
        },
      };
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<User | null> {
    try {
      const cognitoUser = await getCognitoUser();
      
      // Get user attributes from the session
      const session = await fetchAuthSession();
      
      // Extract user information from tokens or attributes
      // Cognito user object structure may vary, so we'll get email and name from attributes
      const user: User = {
        id: cognitoUser.userId,
        name: cognitoUser.username, // Fallback to username if name not available
        email: cognitoUser.username, // Fallback to username if email not available
      };

      // Try to get attributes from session tokens
      if (session.tokens?.idToken) {
        const payload = session.tokens.idToken.payload as any;
        if (payload.email) {
          user.email = payload.email;
        }
        if (payload.name) {
          user.name = payload.name;
        } else if (payload.given_name || payload.family_name) {
          user.name = [payload.given_name, payload.family_name].filter(Boolean).join(' ');
        }
      }

      return user;
    } catch (error) {
      // User is not authenticated
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      await getCognitoUser();
      return true;
    } catch {
      return false;
    }
  }

  // Get authentication token for API calls
  async getAuthToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      // Return the JWT token string - prefer idToken, fallback to accessToken
      const idToken = session.tokens?.idToken;
      const accessToken = session.tokens?.accessToken;
      
      if (idToken) {
        // In AWS Amplify v6, tokens can be JWT objects or strings
        // JWT objects have a toString() method, strings can be returned directly
        if (typeof idToken === 'string') {
          return idToken;
        }
        // Try toString() method for JWT objects
        if (typeof (idToken as any).toString === 'function') {
          return (idToken as any).toString();
        }
        // If it's an object with a token property
        if ((idToken as any).token) {
          return (idToken as any).token;
        }
      }
      
      if (accessToken) {
        if (typeof accessToken === 'string') {
          return accessToken;
        }
        if (typeof (accessToken as any).toString === 'function') {
          return (accessToken as any).toString();
        }
        if ((accessToken as any).token) {
          return (accessToken as any).token;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }
}

// Export appropriate service instance based on configuration
export const authService = USE_MOCK_AUTH ? new MockAuthService() : new CognitoAuthService();

