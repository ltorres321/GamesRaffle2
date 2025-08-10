// API Configuration
const API_CONFIG = {
  // Backend API URL - GitHub Codespaces URL
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://jubilant-capybara-97954qwv6p9hwgj.github.dev:8000',
  
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

export default API_CONFIG