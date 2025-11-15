# CourseRate SG Frontend

This is the frontend application for CourseRate SG, a platform for students to search, view, and submit course and professor reviews. The application is built with React, TypeScript, and Vite.

## Architecture

The frontend follows a component-based architecture using React with TypeScript. The application structure is organized as follows:

### Technology Stack

- React 19.1.0 - UI library
- TypeScript 5.8.3 - Type safety
- Vite 7.0.5 - Build tool and development server
- AWS Amplify - Authentication service (Cognito)
- Tailwind CSS 4.1.11 - Styling framework
- shadcn/ui - UI component library
- React Router (implicit via state management) - Navigation

### Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components (shadcn/ui)
│   │   └── *.tsx           # Page-level components
│   ├── services/           # API and authentication services
│   │   ├── api.ts          # Backend API client
│   │   └── auth-service.ts # Authentication service
│   ├── types/              # TypeScript type definitions
│   │   └── api.d.ts        # API schema types
│   ├── styles/             # Global styles
│   ├── assets/             # Static assets
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── amplify-config.ts   # AWS Amplify configuration
├── public/                 # Public static files
├── build/                  # Production build output
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

### Application Flow

The application uses a single-page architecture with client-side routing managed through React state. The main App component manages:

- User authentication state
- Current page/view state
- Navigation between different pages
- Selected professor and course data for detail views

Authentication is handled through AWS Amplify Cognito, with a mock authentication mode available for development. The API service supports both mock data and real backend API calls, configurable via environment variables.

### Key Features

- Mock and production modes for both authentication and API calls
- Responsive design with mobile and desktop layouts
- Search functionality for professors and courses
- Review submission and management
- Professor and course profile pages with statistics
- User authentication with AWS Cognito

## Components

### Page Components

#### App.tsx
The root component that manages application state and routing. It handles:
- User authentication state
- Page navigation
- Header with navigation menu
- Conditional rendering of page components based on current route

#### HomePage.tsx
The main landing page featuring:
- Search functionality for professors and courses
- Search results display with statistics
- Navigation to professor and course detail pages
- Responsive grid layout for search results

#### LoginPage.tsx
Authentication page providing:
- User sign-in form
- User registration form
- Email verification support
- Integration with AWS Cognito or mock authentication

#### SubmitReviewPage.tsx
Form for submitting new course reviews with:
- Course code selection with autocomplete
- Professor name selection with autocomplete
- Add professor request functionality
- University selection
- Academic year and semester selection
- Rating inputs for overall, difficulty, and workload
- Grade received and expected fields
- Review text input
- Form validation and submission

#### ManageReviewsPage.tsx
Page for users to manage their submitted reviews:
- List of all user's reviews
- Edit review functionality
- Delete review with confirmation dialog
- Review display with ratings and metadata
- Navigation to related course or professor pages

#### ProfessorProfilePage.tsx
Detail page for a specific professor showing:
- Professor name and basic information
- Average ratings (overall, difficulty, workload)
- Total review count
- List of all reviews for the professor
- Course associations

#### CourseProfilePage.tsx
Detail page for a specific course showing:
- Course code and university
- Average ratings (overall, difficulty, workload)
- Total review count
- List of all reviews for the course
- Professor associations

#### EditReviewDialog.tsx
Modal dialog component for editing existing reviews:
- Pre-populated form with existing review data
- Same validation as submit review form
- Update and cancel actions

### UI Components

The application uses shadcn/ui components located in `src/components/ui/`. These are reusable, accessible components built on Radix UI primitives:

- Button, Input, Textarea - Form controls
- Card, Badge - Content display
- Dialog, AlertDialog, Popover - Overlays and modals
- Select, Command - Selection components
- Tabs, Accordion - Content organization
- Toast notifications (via Sonner)
- And many more utility components

### Service Components

#### api.ts
Centralized API service that:
- Handles all backend API communication
- Supports both mock data and real API calls
- Manages authentication tokens
- Provides type-safe API methods
- Includes helper functions for data transformation
- Exports functions for:
  - Review CRUD operations
  - Professor search and statistics
  - Course search and statistics
  - University listing

#### auth-service.ts
Authentication service providing:
- Sign in functionality
- Sign up functionality
- Sign out functionality
- Current user retrieval
- Authentication token management
- Support for both AWS Cognito and mock authentication modes
- Error handling and user feedback

### Configuration

#### amplify-config.ts
AWS Amplify configuration for Cognito authentication. Requires environment variables:
- VITE_AWS_REGION
- VITE_AWS_USER_POOL_ID
- VITE_AWS_USER_POOL_CLIENT_ID
- VITE_AWS_IDENTITY_POOL_ID (optional)

#### vite.config.ts
Vite build configuration including:
- React plugin
- Tailwind CSS plugin
- Custom plugins for Figma asset resolution
- Version specifier removal plugin
- Single-file build option

## Deployment Steps

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn package manager
- AWS account with Cognito User Pool configured (for production)
- Backend API endpoint (for production)

### Development Setup

1. Install dependencies:
```
npm install
```

2. Create environment file (optional, for development with mock mode):
Create a `.env` file in the frontend directory with:
```
VITE_USE_MOCK_API=true
```

3. Start development server:
```
npm run dev
```

The application will be available at http://localhost:5173 (or the port Vite assigns).

### Production Build

1. Configure environment variables:
Create a `.env.production` file or set environment variables:
```
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=https://api.courseratesg.xyz/api/v1
VITE_AWS_REGION=your-aws-region
VITE_AWS_USER_POOL_ID=your-user-pool-id
VITE_AWS_USER_POOL_CLIENT_ID=your-client-id
VITE_AWS_IDENTITY_POOL_ID=your-identity-pool-id (optional)
```

2. Build the application:
```
npm run build
```

This creates an optimized production build in the `build/` directory.

3. Preview the production build locally (optional):
```
npm run preview
```

### Deployment

#### Static Hosting on AWS Amplify

1. Connect repository to Amplify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Configure environment variables in Amplify dashboard

### Environment Variables

Required for production:
- VITE_USE_MOCK_API: Set to "false" to use real API and authentication
- VITE_API_BASE_URL: Backend API base URL
- VITE_AWS_REGION: AWS region for Cognito
- VITE_AWS_USER_POOL_ID: Cognito User Pool ID
- VITE_AWS_USER_POOL_CLIENT_ID: Cognito User Pool Client ID
- VITE_AWS_IDENTITY_POOL_ID: Optional Cognito Identity Pool ID

### Post-Deployment Checklist

1. Verify environment variables are set correctly
2. Test authentication flow (sign up, sign in, sign out)
3. Test API connectivity
4. Verify CORS settings on backend allow your frontend domain
5. Check browser console for errors
6. Test responsive design on mobile devices
7. Verify all navigation flows work correctly
8. Test review submission and management features

### Development Scripts

- `npm run dev`: Start development server
- `npm run build`: Create production build
- `npm run build:single`: Create single-file production build
- `npm run preview`: Preview production build locally
- `npm run lint`: Run ESLint
