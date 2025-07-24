# 🎯 Wedding API Integration Guide

## Overview
This document outlines the integration requirements between the KCT Menswear frontend and the dedicated wedding system backend.

## 🔑 Environment Variables Required

### Frontend (Vercel)
```bash
# Wedding API Integration
VITE_WEDDING_API_URL=https://your-wedding-backend.com/api

# Existing KCT APIs (already configured)
VITE_BACKEND_URL=https://front-of-the-backend-production.up.railway.app
VITE_SUITS_API_URL=https://kct-suits-services-production.up.railway.app
VITE_TIES_API_URL=https://kct-ties-services-production.up.railway.app
VITE_VENDOR_API_URL=https://kct-vendor-sync-production.up.railway.app
VITE_IMAGES_BASE_URL=https://kct-product-images.s3.us-east-2.amazonaws.com
```

## 📋 API Requirements for Backend Team

### 1. **Authentication**
Your wedding backend must support JWT Bearer token authentication:
```
Authorization: Bearer <token>
Content-Type: application/json
```

### 2. **CORS Configuration**
Allow requests from:
- `https://your-frontend-domain.vercel.app`
- `http://localhost:3001` (development)

### 3. **Core Endpoints Required**

#### Wedding Management
```
GET    /api/weddings                    # List weddings (paginated)
GET    /api/weddings/:id                # Get specific wedding
POST   /api/weddings                    # Create new wedding
PUT    /api/weddings/:id                # Update wedding
DELETE /api/weddings/:id                # Cancel wedding
```

#### Party Management
```
GET    /api/weddings/:id/party          # Get party members
POST   /api/weddings/:id/party/invite   # Invite member
PUT    /api/weddings/:id/party/:memberId # Update member
DELETE /api/weddings/:id/party/:memberId # Remove member
```

#### Measurements
```
GET    /api/weddings/:id/measurements   # Get all measurements
POST   /api/weddings/:id/measurements   # Submit measurements
```

#### Timeline
```
GET    /api/weddings/:id/timeline       # Get timeline events
POST   /api/weddings/:id/timeline       # Add timeline event
PUT    /api/weddings/:id/timeline/:eventId # Update event
```

#### Communications
```
GET    /api/weddings/:id/communications # Get messages
POST   /api/weddings/:id/message        # Send message
```

#### Bulk Operations
```
POST   /api/weddings/:id/bulk-order     # Create group order
POST   /api/weddings/:id/reminder       # Send reminders
GET    /api/weddings/:id/bulk-status    # Get status summary
```

#### Analytics
```
GET    /api/analytics/weddings/summary  # Wedding analytics
GET    /api/analytics/weddings/trends   # Trend data
GET    /api/analytics/popular-themes    # Popular themes
```

#### Customer Portal
```
POST   /api/customer/join-wedding       # Join wedding party
GET    /api/customer/my-weddings        # Customer's weddings
GET    /api/customer/wedding-orders     # Customer's orders
```

### 4. **Data Structures**

#### Wedding Object
```typescript
interface Wedding {
  id: string;
  weddingCode: string; // For customer portal access
  weddingDate: Date;
  groomInfo: {
    name: string;
    email: string;
    phone: string;
    customerId?: string;
  };
  brideInfo: {
    name: string;
    email: string;
    phone: string;
  };
  stylePreferences: {
    suitColor: 'black' | 'navy' | 'light_grey' | 'dark_grey' | 'tan' | 'hunter_green' | 'midnight_blue' | 'burgundy' | 'medium_grey';
    userRole: 'bride' | 'groom' | 'groomsman' | 'guest';
  };
  attireType: {
    type: 'tuxedo' | 'suit' | 'modern_fit' | 'slim_fit';
    description: string;
  };
  accessories: string[];
  specialRequests?: string;
  members: WeddingMember[];
  status: 'planning' | 'measurements' | 'fittings' | 'completed';
  estimatedPartySize: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Wedding Member Object
```typescript
interface WeddingMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'groom' | 'groomsman' | 'best_man' | 'father_groom' | 'father_bride' | 'guest';
  measurementStatus: 'pending' | 'submitted' | 'completed';
  measurements?: WeddingMeasurements;
  suitMeasurements?: SuitMeasurements;
  shippingAddress?: ShippingAddress;
  specialNotes?: string;
  customerId?: string;
  addedAt: Date;
  needsShipping?: boolean;
  orderStatus?: 'pending' | 'ordered' | 'in_production' | 'ready' | 'shipped' | 'delivered';
}
```

#### Timeline Event Object
```typescript
interface WeddingTimelineEvent {
  id: string;
  weddingId: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  type: 'milestone' | 'appointment' | 'deadline' | 'reminder' | 'custom';
  status: 'upcoming' | 'completed' | 'overdue' | 'cancelled';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Message Object
```typescript
interface WeddingMessage {
  id: string;
  weddingId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'staff' | 'groom' | 'member';
  content: string;
  type: 'announcement' | 'reminder' | 'update' | 'general';
  recipients: string[]; // member IDs, empty = all
  readBy: Array<{
    memberId: string;
    readAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5. **Error Handling**
Standard HTTP status codes with JSON error responses:
```json
{
  "success": false,
  "error": {
    "code": "WEDDING_NOT_FOUND",
    "message": "Wedding with ID wed_123 not found",
    "field": "weddingId",
    "timestamp": "2024-01-08T10:30:00Z"
  }
}
```

### 6. **Pagination**
List endpoints should support pagination:
```
GET /api/weddings?page=1&limit=20&status=active
```

Response format:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### 7. **Search & Filtering**
Support query parameters:
```
GET /api/weddings?search=smith&status=planning&dateFrom=2024-01-01&dateTo=2024-12-31
```

### 8. **WebSocket Events (Optional)**
If real-time updates are supported:
```javascript
// Events we can subscribe to:
- wedding.created
- wedding.updated
- wedding.cancelled
- party.member.added
- party.member.removed
- measurements.submitted
- timeline.updated
- message.sent
```

## 🔗 Product Integration

### Linking to KCT Product System
When creating orders, use these product identifiers:
- Suits: From `https://kct-suits-services-production.up.railway.app/api/suits`
- Ties: From `https://kct-ties-services-production.up.railway.app/api/ties`
- Images: From `https://kct-product-images.s3.us-east-2.amazonaws.com`

### Order Creation Format
```json
{
  "weddingId": "wed_123",
  "items": [
    {
      "memberId": "member_456",
      "productId": "suit_789",
      "productType": "suit",
      "quantity": 1,
      "customizations": {
        "color": "navy",
        "size": "42R",
        "alterations": ["hem_pants", "sleeve_length"]
      }
    }
  ],
  "discountCode": "WEDDING20",
  "totalAmount": 1200.00
}
```

## 🧪 Testing Requirements

### Test Data Needed
1. Sample wedding with 5-6 members
2. Various wedding statuses (planning, measurements, completed)
3. Different member roles (groom, best man, groomsmen)
4. Timeline events with different types
5. Message history examples

### Health Check
```
GET /api/health
Response: { "status": "ok", "timestamp": "2024-01-08T10:30:00Z" }
```

## 🚀 Integration Steps

1. **Setup**: Backend team provides API URL and test credentials
2. **Authentication**: Test JWT token flow
3. **Basic CRUD**: Test wedding creation, reading, updating
4. **Party Management**: Test member invitation and management
5. **Measurements**: Test measurement submission flow
6. **Timeline**: Test event creation and updates
7. **Communications**: Test messaging system
8. **Analytics**: Test reporting endpoints
9. **Customer Portal**: Test customer-facing features
10. **Production**: Deploy and configure environment variables

## 📞 Support

Frontend integration is ready. Contact development team when:
- API endpoints are available
- Test environment is set up
- Authentication credentials are provided
- Sample data is available

The frontend will automatically detect the wedding API and enable wedding features when `VITE_WEDDING_API_URL` is configured. 