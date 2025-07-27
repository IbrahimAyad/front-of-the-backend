'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { RoleBadge } from '../auth/RoleBasedNav'

interface User {
  id: string
  name?: string
  email: string
  role: 'ADMIN' | 'CUSTOMER' | 'STAFF'
  createdAt: string
}

interface RoleChangeRequest {
  userId: string
  currentRole: string
  requestedRole: string
  reason: string
  timestamp: string
  status: 'pending' | 'approved' | 'rejected'
}

const roleDescriptions = {
  ADMIN: {
    title: 'Administrator',
    description: 'Full system access including user management, system settings, and all data',
    permissions: [
      'User management',
      'System settings',
      'All data access',
      'Security controls',
      'Audit logs'
    ],
    color: 'red'
  },
  STAFF: {
    title: 'Staff Member',
    description: 'Access to customer management, orders, and daily operations',
    permissions: [
      'Customer management',
      'Order processing',
      'Inventory management',
      'Basic reporting',
      'Customer support'
    ],
    color: 'blue'
  },
  CUSTOMER: {
    title: 'Customer',
    description: 'Standard customer access for orders and account management',
    permissions: [
      'Personal orders',
      'Account settings',
      'Order history',
      'Basic profile',
      'Customer support tickets'
    ],
    color: 'green'
  }
}

export function RoleAssignment() {
  const { token } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [pendingRequests, setPendingRequests] = useState<RoleChangeRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [roleChangeData, setRoleChangeData] = useState({
    newRole: '',
    reason: ''
  })

  useEffect(() => {
    loadUsers()
    loadPendingRequests()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to load users')

      const data = await response.json()
      setUsers(data.users)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPendingRequests = async () => {
    try {
      const response = await fetch('/api/admin/role-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setPendingRequests(data.requests || [])
      }
    } catch (err) {
      console.error('Failed to load pending requests:', err)
    }
  }

  const handleRoleChange = async () => {
    if (!selectedUser || !roleChangeData.newRole) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: roleChangeData.newRole,
          reason: roleChangeData.reason
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update role')
      }

      // Refresh data
      loadUsers()
      loadPendingRequests()
      
      // Reset state
      setSelectedUser(null)
      setShowConfirmDialog(false)
      setRoleChangeData({ newRole: '', reason: '' })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestApproval = async (requestId: string, approved: boolean) => {
    try {
      const response = await fetch(`/api/admin/role-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approved })
      })

      if (!response.ok) throw new Error('Failed to process request')

      loadPendingRequests()
    } catch (err) {
      setError('Failed to process role request')
    }
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending Role Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pending Role Requests</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingRequests.map((request) => (
              <div key={`${request.userId}-${request.timestamp}`} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Role change request from {users.find(u => u.id === request.userId)?.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      {request.currentRole} → {request.requestedRole}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Reason: {request.reason}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(request.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRequestApproval(request.userId, true)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRequestApproval(request.userId, false)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Assignment Interface */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Role Assignment</h3>
          <p className="text-sm text-gray-600 mt-1">
            Assign or modify user roles and permissions
          </p>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="p-6">
          {/* User Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const user = users.find(u => u.id === e.target.value)
                setSelectedUser(user || null)
                setRoleChangeData({ newRole: '', reason: '' })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} ({user.role})
                </option>
              ))}
            </select>
          </div>

          {/* Selected User Info */}
          {selectedUser && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Current User</h4>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-medium text-blue-600">
                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : selectedUser.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedUser.name || 'No name'}
                  </p>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  <RoleBadge role={selectedUser.role} className="mt-1" />
                </div>
              </div>
            </div>
          )}

          {/* Role Selection */}
          {selectedUser && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(roleDescriptions).map(([role, info]) => (
                    <div
                      key={role}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        roleChangeData.newRole === role
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${selectedUser.role === role ? 'opacity-50' : ''}`}
                      onClick={() => {
                        if (selectedUser.role !== role) {
                          setRoleChangeData(prev => ({ ...prev, newRole: role }))
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{info.title}</h5>
                        <RoleBadge role={role as any} />
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500">Permissions:</p>
                        {info.permissions.slice(0, 3).map((permission, index) => (
                          <p key={index} className="text-xs text-gray-500">• {permission}</p>
                        ))}
                        {info.permissions.length > 3 && (
                          <p className="text-xs text-gray-400">+ {info.permissions.length - 3} more</p>
                        )}
                      </div>
                      {selectedUser.role === role && (
                        <div className="mt-2 text-xs text-blue-600 font-medium">Current Role</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason Input */}
              {roleChangeData.newRole && roleChangeData.newRole !== selectedUser.role && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Role Change
                  </label>
                  <textarea
                    value={roleChangeData.reason}
                    onChange={(e) => setRoleChangeData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why this role change is necessary..."
                  />
                </div>
              )}

              {/* Action Buttons */}
              {roleChangeData.newRole && roleChangeData.newRole !== selectedUser.role && (
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedUser(null)
                      setRoleChangeData({ newRole: '', reason: '' })
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={!roleChangeData.reason.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Role
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Confirm Role Change</h3>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                You are about to change <strong>{selectedUser.email}</strong>'s role from{' '}
                <RoleBadge role={selectedUser.role} className="mx-1" /> to{' '}
                <RoleBadge role={roleChangeData.newRole as any} className="mx-1" />
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <div className="flex">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Important:</p>
                    <p className="text-sm text-yellow-700">
                      This action will immediately change the user's permissions and access level.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Reason:</p>
                <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                  {roleChangeData.reason}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}