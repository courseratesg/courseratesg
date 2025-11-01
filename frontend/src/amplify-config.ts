// AWS Amplify Configuration for Cognito
// Set environment variables for your Cognito User Pool:
// VITE_AWS_REGION
// VITE_AWS_USER_POOL_ID
// VITE_AWS_USER_POOL_CLIENT_ID
// VITE_AWS_IDENTITY_POOL_ID (optional)

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_AWS_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_AWS_USER_POOL_CLIENT_ID || '',
      ...(import.meta.env.VITE_AWS_IDENTITY_POOL_ID && {
        identityPoolId: import.meta.env.VITE_AWS_IDENTITY_POOL_ID,
      }),
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      loginWith: {
        email: true,
        username: true,
      },
      signUpVerificationMethod: 'code' as const,
    },
  },
};

