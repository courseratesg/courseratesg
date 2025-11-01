CourseRate SG Frontend

## Quick Start

**Default (Mock Mode)**: The app runs in mock mode by default. No setup required! Just run:
```bash
npm install
npm run dev
```

Use test credentials:
- Username: `testuser` / Password: `Test123!`
- Username: `student` / Password: `Student123!`

**Real Mode**: See "Mock vs Real Mode Configuration" section below for AWS Cognito and API setup.

## AWS Cognito Authentication Setup (Real Mode Only)

This section is only needed if you're using real AWS Cognito authentication (when `VITE_USE_MOCK_API=false`). Follow these steps to configure it:

### 1. Create a Cognito User Pool

1. Go to AWS Console → Amazon Cognito → User Pools
2. Create a new User Pool with the following settings:
   - **Sign-in options**: Choose Email and/or Username
   - **Password policy**: Set your requirements
   - **MFA**: Optional (currently not fully supported in UI)
   - **Email verification**: Required (recommended)

### 2. Configure the User Pool App Client

1. In your User Pool, go to "App integration" → "App clients"
2. Create a new app client (or use existing)
3. Note the **Client ID**

### 3. Set Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_AWS_USER_POOL_CLIENT_ID=your_client_id_here
VITE_AWS_IDENTITY_POOL_ID=us-east-1:your_identity_pool_id  # Optional
```

**Where to find these values:**
- `VITE_AWS_REGION`: The AWS region where your User Pool is located
- `VITE_AWS_USER_POOL_ID`: Found in User Pool → General settings → User pool overview
- `VITE_AWS_USER_POOL_CLIENT_ID`: Found in User Pool → App integration → App clients
- `VITE_AWS_IDENTITY_POOL_ID`: Only needed if using other AWS services (S3, DynamoDB, etc.)

### 4. Configure User Attributes

Make sure your Cognito User Pool has the following attributes configured:
- `email` (required)
- `name` (custom attribute - add if not present)

### 5. Run the Application

```bash
npm install
npm run dev
```

In real mode, the application will use AWS Cognito for authentication. Users can sign up and sign in through the login page.

### Notes

- Email verification is required after sign up (check your email for verification code)
- The app handles MFA if enabled, but a confirmation UI is not yet implemented
- Identity Pool ID is optional and only needed for AWS service integration

## Mock vs Real Mode Configuration

The application supports both **mock mode** (for development) and **real mode** (for production) for both authentication and API calls. This is controlled by a single environment variable.

### Mock Mode (Default)

By default, the application uses mock authentication and mock API data. No backend server or AWS Cognito setup is required for development.

**Features:**
- Mock authentication with predefined test users
- Mock API data stored locally
- No external dependencies

**Test Credentials (Mock Mode):**
- Username: `testuser` / Password: `Test123!`
- Username: `student` / Password: `Student123!`

**Or create your own account** - new sign-ups are saved in localStorage.

### Real Mode

To use real AWS Cognito authentication and your backend API:

```env
# Disable mock mode
VITE_USE_MOCK_API=false

# AWS Cognito Configuration (required for real auth)
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_AWS_USER_POOL_CLIENT_ID=your_client_id_here

# API Configuration (required for real API)
VITE_API_BASE_URL=https://api.example.com/api/v1
```

**Important:** When `VITE_USE_MOCK_API=false`, you must:
1. Set up AWS Cognito User Pool and provide credentials
2. Have a backend API server running at `VITE_API_BASE_URL`

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_USE_MOCK_API` | `true` | Set to `false` to use real Cognito auth and real API |
| `VITE_API_BASE_URL` | `/api/v1` | Backend API base URL (only used in real mode) |
| `VITE_AWS_REGION` | `us-east-1` | AWS region for Cognito (only used in real mode) |
| `VITE_AWS_USER_POOL_ID` | - | Cognito User Pool ID (only used in real mode) |
| `VITE_AWS_USER_POOL_CLIENT_ID` | - | Cognito App Client ID (only used in real mode) |
| `VITE_AWS_IDENTITY_POOL_ID` | - | Cognito Identity Pool ID (optional, only used in real mode) |

### Example `.env` Files

**Mock Mode (Default - no `.env` needed):**
```env
# Or explicitly set:
VITE_USE_MOCK_API=true
```

**Real Mode:**
```env
# Disable mock mode
VITE_USE_MOCK_API=false

# AWS Cognito (required)
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_AWS_USER_POOL_CLIENT_ID=your_client_id_here

# API Configuration (required)
VITE_API_BASE_URL=https://api.example.com/api/v1
```

**Note:** When using real mode (`VITE_USE_MOCK_API=false`), ensure your backend:
- Accepts requests at the configured `VITE_API_BASE_URL`
- Validates Cognito JWT tokens in the `Authorization: Bearer <token>` header
- Implements the API endpoints as documented in `src/services/api.ts`