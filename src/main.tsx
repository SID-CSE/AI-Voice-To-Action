import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { useLayoutEffect } from 'react';
import App from './App.tsx';
import { setApiTokenProvider } from './services/api';
import './index.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
function ClerkApplication() {
  const { isLoaded, userId, getToken } = useAuth();
  useLayoutEffect(() => setApiTokenProvider(getToken), [getToken]);
  if (!isLoaded) return <div className="min-h-screen bg-slate-950" />;
  return <App key={userId || 'guest'} />;
}

const app = publishableKey ? (
  <ClerkProvider publishableKey={publishableKey}>
    <StrictMode><ClerkApplication /></StrictMode>
  </ClerkProvider>
) : (
  <StrictMode><App key="guest" /></StrictMode>
);

createRoot(document.getElementById('root')!).render(app);
