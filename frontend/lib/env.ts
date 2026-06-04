// Environment variable validation and configuration

interface EnvConfig {
  apiUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

function validateEnv(): EnvConfig {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.error(
        `[SEO Scanner Configuration Error] NEXT_PUBLIC_API_URL is not set in this deployment! ` +
        `The app is defaulting to "http://localhost:3001", which will fail on client actions like OAuth login. ` +
        `Please ensure you set NEXT_PUBLIC_API_URL to your backend API URL in your hosting provider's build/environment settings (e.g. Vercel/Render).`
      );
    } else {
      console.warn('NEXT_PUBLIC_API_URL not set, using default localhost:3001');
    }
  }

  return {
    apiUrl: apiUrl || 'http://localhost:3001',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

export const env = validateEnv();
