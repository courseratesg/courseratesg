import { useState } from 'react';
import { GraduationCap, AlertCircle, ArrowLeft, MailCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import type { User } from '../App';
import { authService } from '../services/auth-service';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onNavigateHome?: () => void;
}

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one symbol.';
  }
  return null;
}

export function LoginPage({ onLogin, onNavigateHome }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpNickname, setSignUpNickname] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const result = await authService.signIn(username, password);
      
      if (result.isSignedIn && result.user) {
        onLogin(result.user);
      } else {
        setError(result.error?.message || 'Failed to sign in');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setStatusMessage(null);

    const passwordError = validatePassword(signUpPassword);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.signUp(
        signUpUsername,
        signUpPassword,
        signUpNickname
      );

      if (result.success) {
        if (result.confirmationRequired) {
          setStatusMessage(
            `We just sent a verification email to ${signUpUsername}. Click the confirmation link in that message to finish setting up your account.`
          );
        } else {
          // Auto-confirmed, sign in automatically
          const signInResult = await authService.signIn(signUpUsername, signUpPassword);
          if (signInResult.isSignedIn && signInResult.user) {
            onLogin(signInResult.user);
          } else {
            setError('Account created but sign in failed. Please try signing in manually.');
          }
        }
      } else {
        setError(result.error?.message || 'Failed to sign up');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {onNavigateHome && (
            <div className="flex justify-start mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateHome}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          )}
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to CourseRate SG</CardTitle>
          <CardDescription>
            {showSignUp
              ? 'Create an account to submit and manage course reviews'
              : 'Sign in to submit and manage course reviews'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {statusMessage && (
            <Alert className="mb-4">
              <MailCheck className="h-4 w-4" />
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          {!showSignUp ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSignUp(true);
                    setError(null);
                    setStatusMessage(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Don't have an account? Sign up
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username">Email</Label>
                <Input
                  id="signup-username"
                  type="text"
                  value={signUpUsername}
                  onChange={(e) => setSignUpUsername(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-nickname">Nickname</Label>
                <Input
                  id="signup-nickname"
                  type="text"
                  value={signUpNickname}
                  onChange={(e) => setSignUpNickname(e.target.value)}
                  placeholder="Enter your nickname"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="Choose a password"
                  required
                  disabled={isLoading}
                />
                <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                  <li>At least 8 characters</li>
                  <li>Contains lowercase and uppercase letters</li>
                  <li>Contains a number</li>
                  <li>Contains a symbol</li>
                </ul>
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Signing up...' : 'Sign Up'}
              </Button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSignUp(false);
                    setError(null);
                    setStatusMessage(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              By signing in, you agree to submit anonymous reviews only.
              No personal information will be displayed with your reviews.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}