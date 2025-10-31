// Mock AWS Amplify Auth Service
// This service simulates AWS Cognito authentication using mock data

import type { User } from '../App';
import { mockUsers } from '../amplify-config';

export interface AuthError {
  message: string;
  code: string;
}

export interface SignInResult {
  isSignedIn: boolean;
  user?: User;
  error?: AuthError;
}

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
  private saveRegisteredUser(username: string, password: string, email: string, name: string, sub: string) {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const storedUsers = stored ? JSON.parse(stored) : [];
    storedUsers.push({
      username,
      password,
      attributes: {
        sub,
        email,
        name,
      },
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedUsers));
  }

  // Mock sign in
  async signIn(username: string, password: string): Promise<SignInResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Find matching user from all registered users
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

    // Create user object
    const user: User = {
      id: userRecord.attributes.sub,
      name: userRecord.attributes.name,
      email: userRecord.attributes.email,
    };

    this.currentUser = user;
    
    // Store in localStorage for persistence
    localStorage.setItem('amplifyUser', JSON.stringify(user));
    localStorage.setItem('amplifySession', 'mock-session-token');

    return {
      isSignedIn: true,
      user,
    };
  }

  // Mock sign up
  async signUp(
    username: string,
    password: string,
    email: string,
    name: string
  ): Promise<{ success: boolean; error?: AuthError }> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const allUsers = this.getRegisteredUsers();

    // Check if username already exists
    if (allUsers.find((u) => u.username === username)) {
      return {
        success: false,
        error: {
          message: 'Username already exists',
          code: 'UsernameExistsException',
        },
      };
    }

    // Generate a unique user ID
    const sub = `mock-user-${Date.now()}`;

    // Save new user to localStorage
    this.saveRegisteredUser(username, password, email, name, sub);

    return { success: true };
  }

  // Mock sign out
  async signOut(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.currentUser = null;
    localStorage.removeItem('amplifyUser');
    localStorage.removeItem('amplifySession');
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    // Check localStorage first
    const savedUser = localStorage.getItem('amplifyUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      return this.currentUser;
    }
    return null;
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}

// Export singleton instance
export const authService = new MockAuthService();

