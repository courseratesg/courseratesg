import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import { amplifyConfig } from './amplify-config'
import "./index.css"
import App from './App.tsx'

// Only configure AWS Amplify if not using mock mode
const USE_MOCK_AUTH = (import.meta.env.VITE_USE_MOCK_API ?? 'true') !== 'false';
if (!USE_MOCK_AUTH) {
  // Configure AWS Amplify with Cognito only when using real auth
  Amplify.configure(amplifyConfig);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
