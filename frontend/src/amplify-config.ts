// AWS Amplify Configuration with Mock Data
// This configuration uses mock credentials for development
// Replace with real AWS credentials when deploying

export const amplifyConfig = {
  Auth: {
    Cognito: {
      // Mock Cognito configuration
      userPoolId: 'us-east-1_MOCKPOOL',
      userPoolClientId: 'mock-client-id',
      identityPoolId: 'us-east-1:mock-identity-pool',
      region: 'us-east-1',
      // For mock mode, we'll bypass actual AWS calls
      mockMode: true,
    },
  },
};

// Mock users for testing
export const mockUsers = [
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

