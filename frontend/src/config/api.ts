// Auto-detect the correct backend URL based on environment
function getBackendURL(): string {
  // For production (deployed to Netlify with Render backend)
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://gamesraffle2.onrender.com';
  }

  // For GitHub Codespaces - Auto-detect the URL
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Check if we're in a GitHub Codespace (hostname contains app.github.dev)
    if (hostname.includes('app.github.dev')) {
      // Extract the codespace name from the current URL
      // Format: https://codespace-name-port.app.github.dev
      const parts = hostname.split('-');
      if (parts.length >= 3) {
        // Remove the last part (port number) and reconstruct for port 8000
        const codespaceName = parts.slice(0, -1).join('-');
        return `https://${codespaceName}-8000.app.github.dev`;
      }
    }
    
    // Check if we're accessing via a forwarded port URL
    if (hostname.includes('github.dev')) {
      // Try to construct the backend URL by replacing the port
      const currentUrl = window.location.origin;
      // If current is on port 3000, backend should be on 8000
      if (currentUrl.includes('-3000.')) {
        return currentUrl.replace('-3000.', '-8000.');
      }
    }
  }

  // For server-side rendering or initial load, check environment variables
  if (process.env.CODESPACE_NAME) {
    return `https://${process.env.CODESPACE_NAME}-8000.app.github.dev`;
  }

  // Fallback to localhost for local development
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

// API Configuration
const API_CONFIG = {
  // Backend API URL - Auto-detects based on environment
  BASE_URL: getBackendURL(),
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      ME: '/api/auth/me',
      VERIFY: '/api/auth/verify',
      VERIFY_EMAIL: '/api/auth/verify-email',
      VERIFY_PHONE: '/api/auth/verify-phone',
      RESEND_EMAIL: '/api/auth/resend-email-verification',
      RESEND_SMS: '/api/auth/resend-sms-verification',
      CHANGE_PASSWORD: '/api/auth/password'
    },
    USERS: {
      PROFILE: '/api/users/profile',
      UPDATE_PROFILE: '/api/users/profile'
    },
    GAMES: {
      LIST: '/api/games',
      DETAIL: '/api/games/:id',
      JOIN: '/api/games/:id/join'
    },
    PICKS: {
      SUBMIT: '/api/picks',
      HISTORY: '/api/picks/history'
    }
  }
}

// Debug logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    BASE_URL: API_CONFIG.BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    CODESPACE_NAME: process.env.CODESPACE_NAME,
    currentHostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side'
  });
}

export default API_CONFIG