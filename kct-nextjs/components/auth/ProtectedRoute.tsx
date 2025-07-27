'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?: 'ADMIN' | 'CUSTOMER' | 'STAFF'
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requireRole, 
  fallback,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, isLoading, isInitialized, isAuthenticated, error } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (requireRole && user?.role !== requireRole) {
        router.push('/unauthorized')
        return
      }
    }
  }, [isInitialized, isAuthenticated, user, requireRole, router, redirectTo])

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error state if there's an auth error
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Authentication Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Show fallback or redirect if not authenticated
  if (!isAuthenticated) {
    return fallback || null
  }

  // Show access denied if role requirement not met
  if (requireRole && user?.role !== requireRole) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <span className="text-6xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You need {requireRole} privileges to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Your current role: <span className="font-semibold">{user?.role}</span>
          </p>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Admin-only route wrapper
export function AdminRoute({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requireRole="ADMIN" fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

// Staff-only route wrapper (includes admin)
export function StaffRoute({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const { user } = useAuth()
  
  if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
    return <>{children}</>
  }
  
  return (
    <ProtectedRoute requireRole="STAFF" fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

// Customer route wrapper
export function CustomerRoute({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requireRole="CUSTOMER" fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

// General authenticated route wrapper
export function AuthenticatedRoute({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}