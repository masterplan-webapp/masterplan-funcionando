// Configuration file for environment-specific settings

// Get the current environment URL
export const getBaseUrl = (): string => {
  // In browser environment
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // In server environment or build time
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NODE_ENV === 'production') {
    // Fallback for production - you should set this in your environment variables
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://masterplan-5a5pjyhtn-fabio-zacaris-projects-2521886a.vercel.app';
  }
  
  // Default to localhost for development
  return 'http://localhost:5173';
};

// Auth redirect URL
export const getAuthRedirectUrl = (): string => {
  return getBaseUrl();
};

// Site configuration
export const siteConfig = {
  name: 'MasterPlan AI',
  description: 'AI-powered media planning tool',
  url: getBaseUrl(),
  authRedirectUrl: getAuthRedirectUrl(),
};