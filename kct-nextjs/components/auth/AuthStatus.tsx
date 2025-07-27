'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { RoleBadge } from './RoleBasedNav'

interface AuthStatusProps {
  variant?: 'compact' | 'full' | 'dropdown'
  showAvatar?: boolean
  className?: string
}

export function AuthStatus({ variant = 'compact', showAvatar = true, className = '' }: AuthStatusProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm text-gray-600">Not signed in</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showAvatar && (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">
            {user.name || user.email}
          </span>
          <RoleBadge role={user.role} className="text-xs" />
        </div>
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          {showAvatar && (
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-blue-600">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              {user.name || 'User'}
            </h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <div className="mt-2">
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex space-x-2">
          <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
            Profile
          </button>
          <button 
            onClick={logout}
            className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          {showAvatar && (
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-medium">{user.name || user.email}</span>
          <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <div className="mt-2">
                <RoleBadge role={user.role} />
              </div>
            </div>
            
            <div className="py-2">
              <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Profile Settings
              </a>
              <a href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Account Settings
              </a>
              {user.role === 'ADMIN' && (
                <a href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Admin Panel
                </a>
              )}
              <div className="border-t border-gray-200 mt-2 pt-2">
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
        
        {isDropdownOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </div>
    )
  }

  return null
}

// Online status indicator
export function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-xs text-gray-600">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  )
}

// Session expiry warning
export function SessionWarning() {
  const { refreshToken, error, clearError } = useAuth()
  const [showWarning, setShowWarning] = useState(false)

  React.useEffect(() => {
    if (error?.includes('expired')) {
      setShowWarning(true)
    }
  }, [error])

  if (!showWarning) return null

  return (
    <div className="fixed top-4 right-4 max-w-sm bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-yellow-600">⚠️</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Session Expiring</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Your session is about to expire. Would you like to extend it?
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => {
                refreshToken()
                setShowWarning(false)
                clearError()
              }}
              className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
            >
              Extend Session
            </button>
            <button
              onClick={() => {
                setShowWarning(false)
                clearError()
              }}
              className="text-xs text-yellow-600 hover:text-yellow-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}