# Frontend Auth Components for Terminal 2

## Overview

Complete set of authentication components for the Next.js frontend, designed for Terminal 2's e-commerce features integration.

## Components Structure

### Auth Forms (`components/auth/`)

#### Login & Registration
- **`LoginForm`** - Enhanced login with loading states, error handling, remember me
- **`RegisterForm`** - Registration with validation, terms acceptance, phone input
- **`ForgotPasswordForm`** - Password reset request with email verification
- **`ResetPasswordForm`** - Password reset with token validation

#### Account Management
- **`AccountSettings`** - Tabbed interface for profile, security, preferences

### Navigation & Role-based UI (`components/auth/`)

#### Navigation Components
- **`RoleBasedNav`** - Dynamic navigation based on user role
- **`QuickActions`** - Role-specific quick action buttons
- **`RoleBadge`** - Visual role indicators
- **`RoleGuard`** - Conditional rendering based on role

#### Route Protection
- **`ProtectedRoute`** - Generic route protection with role requirements
- **`AdminRoute`** - Admin-only route wrapper
- **`StaffRoute`** - Staff + Admin route wrapper
- **`CustomerRoute`** - Customer-only route wrapper
- **`AuthenticatedRoute`** - Any authenticated user route wrapper

#### Status Indicators
- **`AuthStatus`** - User status display (compact, full, dropdown variants)
- **`OnlineStatus`** - Online/offline indicator
- **`SessionWarning`** - Session expiry warnings

### Admin Components (`components/admin/`)

#### User Management
- **`UserManagement`** - Complete user CRUD with bulk actions
- **`RoleAssignment`** - Visual role assignment with approval workflow
- **`UserActivityLogs`** - Activity monitoring with filtering and export

## Enhanced AuthContext Features

### New Properties
- `isInitialized` - Auth state initialization complete
- `error` - Current auth error state
- `clearError()` - Clear error messages
- `updateProfile()` - Update user profile

### Improved Loading States
- Token validation on app load
- Graceful error handling
- Auto-retry on network errors

## Usage Examples

### Basic Setup

```tsx
// app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### Protected Pages

```tsx
// pages/admin/dashboard.tsx
import { AdminRoute } from '@/components/auth'
import { UserManagement } from '@/components/admin'

export default function AdminDashboard() {
  return (
    <AdminRoute>
      <div className="admin-layout">
        <UserManagement />
      </div>
    </AdminRoute>
  )
}
```

### Navigation Integration

```tsx
// components/layout/Sidebar.tsx
import { RoleBasedNav, AuthStatus } from '@/components/auth'

export function Sidebar() {
  return (
    <aside className="sidebar">
      <AuthStatus variant="full" />
      <RoleBasedNav variant="sidebar" />
    </aside>
  )
}
```

### Conditional Content

```tsx
// components/Dashboard.tsx
import { RoleGuard, QuickActions } from '@/components/auth'

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <RoleGuard roles={['ADMIN', 'STAFF']}>
        <QuickActions />
      </RoleGuard>
      
      <RoleGuard 
        roles={['CUSTOMER']} 
        fallback={<p>Staff portal</p>}
      >
        <CustomerPortal />
      </RoleGuard>
    </div>
  )
}
```

## Component Props & APIs

### AuthStatus Props
```tsx
interface AuthStatusProps {
  variant?: 'compact' | 'full' | 'dropdown'
  showAvatar?: boolean
  className?: string
}
```

### ProtectedRoute Props
```tsx
interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?: 'ADMIN' | 'CUSTOMER' | 'STAFF'
  fallback?: React.ReactNode
  redirectTo?: string
}
```

### RoleBasedNav Props
```tsx
interface RoleBasedNavProps {
  className?: string
  variant?: 'sidebar' | 'horizontal' | 'mobile'
  onNavigate?: () => void
}
```

## Styling & Theming

All components use Tailwind CSS classes and are designed to be:
- **Responsive** - Mobile-first design
- **Accessible** - ARIA labels, keyboard navigation
- **Customizable** - Easy to override styles
- **Consistent** - Shared design system

## Integration with Terminal 2

### E-commerce Features
- Customer role management for purchase permissions
- Staff tools for order management
- Admin controls for product catalog
- Activity tracking for compliance

### API Compatibility
- Works with existing JWT tokens
- Backward compatible with Fastify endpoints
- Seamless transition during migration

### Performance Optimized
- Lazy loading for admin components
- Efficient re-renders with React.memo
- Minimal bundle impact for customer-facing features

## Error Handling

### Network Errors
- Automatic retry for transient failures
- Graceful degradation when offline
- Clear error messages for users

### Auth Errors
- Session expiry warnings
- Invalid token handling
- Automatic logout on security issues

### User Feedback
- Loading states for all async operations
- Success/error toast notifications
- Progress indicators for long operations

## Security Features

### Token Management
- Automatic token refresh
- Secure storage practices
- XSS protection

### Route Protection
- Server-side validation backup
- Role-based access control
- Audit trail for sensitive actions

### Admin Security
- Activity logging for all admin actions
- Role change approval workflow
- IP address tracking
- User agent logging

This comprehensive auth system provides Terminal 2 with all necessary components for user management, role-based access, and secure operations while maintaining the flexibility needed for e-commerce integration.