import API_CONFIG from '@/config/api'

// Types
interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  sessionId: string
}

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  dateOfBirth: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  country: string
  role: string
  emailVerified: boolean
  phoneVerified: boolean
  isVerified: boolean
  isActive: boolean
  requiresVerification?: boolean
  taxVerificationStatus?: string
}

interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  dateOfBirth: string
  phoneNumber: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface LoginData {
  email: string
  password: string
}

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL
  }

  // Generic HTTP request method
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    // Get auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }
      
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Authentication methods
  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async login(credentials: LoginData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async logout(sessionId?: string): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    })
  }

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.ME)
  }

  async verifyEmail(token: string): Promise<ApiResponse<{ isVerified: boolean; canAccessSite: boolean }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  }

  async verifyPhone(code: string): Promise<ApiResponse<{ isVerified: boolean; canAccessSite: boolean; fullyVerified: boolean }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.VERIFY_PHONE, {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  }

  async resendEmailVerification(): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.RESEND_EMAIL, {
      method: 'POST',
    })
  }

  async resendSmsVerification(): Promise<ApiResponse> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.RESEND_SMS, {
      method: 'POST',
    })
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ tokens: AuthTokens }>> {
    return this.request(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  }
}

export default new ApiService()
export type { User, RegisterData, LoginData, AuthTokens, ApiResponse }