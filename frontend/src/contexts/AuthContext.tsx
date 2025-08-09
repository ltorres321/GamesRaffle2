'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  role: string
  emailVerified: boolean
  phoneVerified: boolean
  isVerified: boolean
  isActive: boolean
  requiresVerification?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.authenticated) {
          setUser(data.data.user)
        } else {
          // Token is invalid, clear storage
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('sessionId')
        }
      } else if (response.status === 401) {
        // Try to refresh token
        await tryRefreshToken()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Clear potentially invalid tokens
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('sessionId')
    } finally {
      setIsLoading(false)
    }
  }

  const tryRefreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) return false

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('accessToken', data.data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken)
        
        // Re-check auth status with new token
        await checkAuthStatus()
        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
    }
    
    return false
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('accessToken', data.data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken)
        localStorage.setItem('sessionId', data.data.tokens.sessionId)
        
        setUser(data.data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const sessionId = localStorage.getItem('sessionId')
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    }

    // Clear local storage regardless of API call success
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('sessionId')
    
    setUser(null)
    router.push('/')
  }

  const refreshAuth = async () => {
    await checkAuthStatus()
  }

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    requireVerification?: boolean
    redirectTo?: string
    allowUnverified?: boolean
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.push(options.redirectTo || '/auth/login')
          return
        }

        if (options.requireVerification && !options.allowUnverified && !user?.isVerified) {
          router.push('/auth/verify')
          return
        }
      }
    }, [isLoading, isAuthenticated, user, router])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-green-900 to-gray-900">
          <div className="text-white text-lg">Loading...</div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null // Router will redirect
    }

    if (options.requireVerification && !options.allowUnverified && !user?.isVerified) {
      return null // Router will redirect
    }

    return <WrappedComponent {...props} />
  }
}

// Hook for route protection
export function useRequireAuth(options: {
  requireVerification?: boolean
  redirectTo?: string
  allowUnverified?: boolean
} = {}) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(options.redirectTo || '/auth/login')
        return
      }

      if (options.requireVerification && !options.allowUnverified && !user?.isVerified) {
        router.push('/auth/verify')
        return
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  return {
    user,
    isLoading,
    isAuthenticated,
    isVerified: user?.isVerified || false,
    canMakePicks: isAuthenticated && user?.isVerified,
    canDeposit: isAuthenticated && user?.isVerified,
    canViewMyContests: isAuthenticated
  }
}