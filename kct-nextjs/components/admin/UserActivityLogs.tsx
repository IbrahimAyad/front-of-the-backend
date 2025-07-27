'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { RoleBadge } from '../auth/RoleBasedNav'

interface ActivityLog {
  id: string
  userId: string
  userEmail: string
  userName?: string
  userRole: string
  action: string
  details: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface ActivityFilters {
  userId: string
  action: string
  severity: string
  dateRange: string
  search: string
}

const activityTypes = [
  'login',
  'logout',
  'password_change',
  'profile_update',
  'role_change',
  'order_create',
  'order_update',
  'customer_create',
  'customer_update',
  'product_create',
  'product_update',
  'settings_change',
  'export_data',
  'delete_user',
  'system_access'
]

const severityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const actionIcons = {
  login: '🔑',
  logout: '🚪',
  password_change: '🔐',
  profile_update: '👤',
  role_change: '⚡',
  order_create: '📦',
  order_update: '📝',
  customer_create: '👥',
  customer_update: '✏️',
  product_create: '🛍️',
  product_update: '🔧',
  settings_change: '⚙️',
  export_data: '📊',
  delete_user: '🗑️',
  system_access: '🖥️'
}

export function UserActivityLogs() {
  const { token } = useAuth()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<ActivityFilters>({
    userId: '',
    action: '',
    severity: '',
    dateRange: '7d',
    search: ''
  })

  useEffect(() => {
    loadLogs()
    loadUsers()
  }, [currentPage, filters])

  useEffect(() => {
    filterLogs()
  }, [logs, filters])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      })

      const response = await fetch(`/api/admin/activity-logs?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to load activity logs')

      const data = await response.json()
      setLogs(data.logs || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError('Failed to load activity logs')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  const filterLogs = () => {
    let filtered = [...logs]

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(log => 
        log.userEmail.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.details.toLowerCase().includes(search)
      )
    }

    setFilteredLogs(filtered)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date)
    }
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const exportLogs = async () => {
    try {
      const queryParams = new URLSearchParams({
        format: 'csv',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      })

      const response = await fetch(`/api/admin/activity-logs/export?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to export logs')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export logs')
    }
  }

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Activity Logs</h2>
            <p className="text-sm text-gray-600 mt-1">Monitor user actions and system access</p>
          </div>
          <button
            onClick={exportLogs}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <select
              value={filters.userId}
              onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Actions</option>
              {activityTypes.map((action) => (
                <option key={action} value={action}>
                  {action.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          <div>
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No activity logs found matching your criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => {
              const timestamp = formatTimestamp(log.timestamp)
              const icon = actionIcons[log.action as keyof typeof actionIcons] || '📋'
              
              return (
                <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">{icon}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {log.userName || log.userEmail}
                          </p>
                          <RoleBadge role={log.userRole} className="text-xs" />
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[log.severity]}`}>
                            {log.severity}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{timestamp.relative}</p>
                          <p className="text-xs text-gray-400">{timestamp.date} {timestamp.time}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium capitalize">
                          {log.action.replace('_', ' ')}:
                        </span>{' '}
                        {log.details}
                      </p>
                      
                      {(log.ipAddress || log.userAgent) && (
                        <div className="text-xs text-gray-500 space-y-1">
                          {log.ipAddress && (
                            <p>IP: {log.ipAddress}</p>
                          )}
                          {log.userAgent && (
                            <p className="truncate max-w-md">
                              User Agent: {log.userAgent}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}