'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { JWTPayload } from '@/lib/services/auth.service'

interface User {
  id: string
  email: string
  name?: string
  role: 'ADMIN' | 'CUSTOMER' | 'STAFF'
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  hasRole: (role: string) => boolean
  isAuthenticated: boolean
  clearError: () => void
  updateProfile: (profileData: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Load auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken')
        const storedUser = localStorage.getItem('authUser')

        if (storedToken && storedUser) {
          // Verify token is still valid
          const response = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          })

          if (response.ok) {
            const data = await response.json()
            setToken(storedToken)
            setUser(data.user)
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('authToken')
            localStorage.removeItem('authUser')
          }
        }
      } catch (err) {
        // Network error or other issues
        console.error('Auth initialization error:', err)
        setError('Failed to initialize authentication')
      } finally {
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()
      
      // Store auth data
      setUser(data.user)
      setToken(data.token)
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('authUser', JSON.stringify(data.user))
      
      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    router.push('/login')
  }, [router])

  const refreshToken = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      
      setToken(data.token)
      localStorage.setItem('authToken', data.token)
    } catch (error) {
      console.error('Token refresh error:', error)
      setError('Session expired. Please log in again.')
      logout()
    }
  }, [token, logout])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    if (!token) throw new Error('Not authenticated')

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      const data = await response.json()
      setUser(data.user)
      localStorage.setItem('authUser', JSON.stringify(data.user))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const hasRole = useCallback((role: string) => {
    return user?.role === role
  }, [user])

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!token) return

    // Refresh token 5 minutes before expiry
    const refreshInterval = setInterval(() => {
      refreshToken()
    }, 6.5 * 24 * 60 * 60 * 1000) // 6.5 days

    return () => clearInterval(refreshInterval)
  }, [token, refreshToken])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isInitialized,
    error,
    login,
    logout,
    refreshToken,
    hasRole,
    isAuthenticated: !!user && !!token,
    clearError,
    updateProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { requireRole?: string }
) {
  return function ProtectedComponent(props: P) {
    const { user, isLoading, isInitialized, isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (isInitialized && !isAuthenticated) {
        router.push('/login')
      }

      if (options?.requireRole && user && user.role !== options.requireRole) {
        router.push('/unauthorized')
      }
    }, [isInitialized, isAuthenticated, user, router])

    if (!isInitialized || isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    if (options?.requireRole && user?.role !== options.requireRole) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}