'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  label: string
  href: string
  roles: string[]
  icon?: string
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['ADMIN', 'CUSTOMER', 'STAFF'],
    icon: '📊'
  },
  {
    label: 'Products',
    href: '/products',
    roles: ['ADMIN', 'CUSTOMER', 'STAFF'],
    icon: '👔'
  },
  {
    label: 'Orders',
    href: '/orders',
    roles: ['ADMIN', 'CUSTOMER', 'STAFF'],
    icon: '📦'
  },
  {
    label: 'Customers',
    href: '/customers',
    roles: ['ADMIN', 'STAFF'],
    icon: '👥',
    children: [
      { label: 'All Customers', href: '/customers', roles: ['ADMIN', 'STAFF'] },
      { label: 'Customer Analytics', href: '/customers/analytics', roles: ['ADMIN'] },
      { label: 'Customer Groups', href: '/customers/groups', roles: ['ADMIN'] }
    ]
  },
  {
    label: 'Admin',
    href: '/admin',
    roles: ['ADMIN'],
    icon: '⚙️',
    children: [
      { label: 'User Management', href: '/admin/users', roles: ['ADMIN'] },
      { label: 'Product Management', href: '/admin/products', roles: ['ADMIN'] },
      { label: 'System Settings', href: '/admin/settings', roles: ['ADMIN'] },
      { label: 'Analytics', href: '/admin/analytics', roles: ['ADMIN'] }
    ]
  },
  {
    label: 'Reports',
    href: '/reports',
    roles: ['ADMIN', 'STAFF'],
    icon: '📈',
    children: [
      { label: 'Sales Reports', href: '/reports/sales', roles: ['ADMIN', 'STAFF'] },
      { label: 'Inventory Reports', href: '/reports/inventory', roles: ['ADMIN', 'STAFF'] },
      { label: 'Customer Reports', href: '/reports/customers', roles: ['ADMIN'] }
    ]
  }
]

interface RoleBasedNavProps {
  className?: string
  variant?: 'sidebar' | 'horizontal' | 'mobile'
  onNavigate?: () => void
}

export function RoleBasedNav({ className = '', variant = 'sidebar', onNavigate }: RoleBasedNavProps) {
  const { user, hasRole } = useAuth()

  if (!user) return null

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      const hasAccess = item.roles.some(role => hasRole(role))
      if (!hasAccess) return false

      if (item.children) {
        item.children = filterNavItems(item.children)
      }
      
      return true
    })
  }

  const filteredItems = filterNavItems(navigationItems)

  const baseClasses = {
    sidebar: 'flex flex-col space-y-1',
    horizontal: 'flex flex-row space-x-4',
    mobile: 'flex flex-col space-y-2'
  }

  const linkClasses = {
    sidebar: 'flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 hover:text-gray-900',
    horizontal: 'flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100',
    mobile: 'flex items-center px-4 py-3 text-base font-medium border-b border-gray-200 hover:bg-gray-50'
  }

  return (
    <nav className={`${baseClasses[variant]} ${className}`}>
      {filteredItems.map((item) => (
        <div key={item.href}>
          <Link
            href={item.href}
            onClick={onNavigate}
            className={`${linkClasses[variant]} text-gray-700`}
          >
            {item.icon && <span className="mr-3">{item.icon}</span>}
            {item.label}
          </Link>
          
          {item.children && item.children.length > 0 && (
            <div className={variant === 'sidebar' ? 'ml-6 mt-1 space-y-1' : 'ml-4'}>
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={`${linkClasses[variant]} text-gray-600 text-xs`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}

// Quick access component for common actions
export function QuickActions() {
  const { hasRole } = useAuth()

  const quickActions = [
    { label: 'New Order', href: '/orders/new', roles: ['ADMIN', 'STAFF'], icon: '➕' },
    { label: 'Add Customer', href: '/customers/new', roles: ['ADMIN', 'STAFF'], icon: '👤' },
    { label: 'Add Product', href: '/admin/products/new', roles: ['ADMIN'], icon: '📦' },
    { label: 'View Reports', href: '/reports', roles: ['ADMIN', 'STAFF'], icon: '📊' }
  ]

  const availableActions = quickActions.filter(action => 
    action.roles.some(role => hasRole(role))
  )

  if (availableActions.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {availableActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          >
            <span className="mr-2">{action.icon}</span>
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

// Role badge component
export function RoleBadge({ role, className = '' }: { role: string, className?: string }) {
  const roleColors = {
    ADMIN: 'bg-red-100 text-red-800',
    STAFF: 'bg-blue-100 text-blue-800',
    CUSTOMER: 'bg-green-100 text-green-800'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'} ${className}`}>
      {role}
    </span>
  )
}

// Conditional render component based on role
interface RoleGuardProps {
  roles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { hasRole } = useAuth()
  
  const hasAccess = roles.some(role => hasRole(role))
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}