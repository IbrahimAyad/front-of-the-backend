# 🚀 KCT Menswear Frontend Deployment Guide

## 📋 Complete API Keys & Integration Reference

This document contains all the API keys, environment variables, and integration requirements needed to deploy the KCT Menswear frontend application.

---

## 🔑 Required API Keys

### 1. **OpenAI API Key** (Required for AI Features)
- **Purpose**: AI-powered product recommendations, decision engine
- **Environment Variable**: `VITE_OPENAI_API_KEY`
- **Format**: `sk-...` (starts with "sk-")
- **Get from**: [OpenAI API Keys](https://platform.openai.com/api-keys)
- **Usage**: AI product assistant, smart recommendations

### 2. **Database Connection** (Required)
- **Purpose**: PostgreSQL database connection
- **Environment Variable**: `DATABASE_URL`
- **Format**: `postgresql://username:password@host:port/database`
- **Production**: Railway PostgreSQL (auto-generated as `${{Postgres.DATABASE_URL}}`)

### 3. **JWT Authentication Secrets** (Required)
- **Purpose**: User authentication and session management
- **Environment Variables**: 
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
- **Generate**: Use `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- **Minimum Length**: 64 characters each

### 4. **SendGrid API Key** (Optional - Email Notifications)
- **Purpose**: Email notifications and transactional emails
- **Environment Variable**: `SENDGRID_API_KEY`
- **Get from**: [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
- **Usage**: Order confirmations, appointment reminders

---

## 🌐 External API Services

### 1. **KCT Main Backend** (Core Business Logic)
- **URL**: `https://front-of-the-backend-production.up.railway.app/api`
- **Purpose**: Authentication, customers, orders, measurements, analytics
- **Authentication**: JWT Bearer tokens
- **Status**: ✅ Active and deployed

### 2. **Wedding System Backend** (When Ready)
- **URL**: To be provided by backend team
- **Purpose**: Wedding party management, group coordination, timeline management
- **Authentication**: JWT Bearer tokens
- **Status**: 🔄 Pending integration

### 3. **WebSocket Service** (Real-time Updates)
- **URL**: `wss://front-of-the-backend-production.up.railway.app/ws`
- **Purpose**: Real-time notifications, live updates
- **Authentication**: JWT Bearer tokens
- **Status**: ✅ Active and deployed

---

## 📝 Environment Variables Configuration

### **Frontend Deployment (Vercel)**

```bash
# Core Backend Integration
VITE_FRONTEND_URL=https://your-domain.vercel.app
VITE_BACKEND_URL=https://front-of-the-backend-production.up.railway.app
VITE_API_BASE_URL=https://front-of-the-backend-production.up.railway.app/api
VITE_WS_BASE_URL=wss://front-of-the-backend-production.up.railway.app/ws

# Wedding System Integration (when ready)
VITE_WEDDING_API_URL=https://your-wedding-backend.com/api

# AI Features (Optional)
VITE_OPENAI_API_KEY=sk-your-openai-key-here

# Admin Credentials
VITE_ADMIN_EMAIL=admin@kctmenswear.com
VITE_ADMIN_PASSWORD=admin123

# Environment Configuration
VITE_NODE_ENV=production
VITE_USE_MOCK_DATA=false
```

### **Backend Deployment (Railway)**

```bash
# Core Configuration
NODE_ENV=production
PORT=8000
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://your-domain.vercel.app

# Authentication Secrets
JWT_SECRET=your-64-character-secret-here
JWT_REFRESH_SECRET=your-64-character-refresh-secret-here

# AI Features
OPENAI_API_KEY=sk-your-openai-key-here

# Email Service (Optional)
SENDGRID_API_KEY=your-sendgrid-key-here
FROM_EMAIL=noreply@kctmenswear.com

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
USE_MOCK_DATA=false

# Admin Configuration
ADMIN_EMAIL=admin@kctmenswear.com
ADMIN_PASSWORD=admin123
```

---

## 🎯 Wedding System Integration Requirements

### **API Endpoints Required from Backend Team**

#### Core Wedding Management
```
GET    /api/weddings                    # List all weddings (paginated)
GET    /api/weddings/:id                # Get specific wedding details
POST   /api/weddings                    # Create new wedding
PUT    /api/weddings/:id                # Update wedding details
DELETE /api/weddings/:id                # Cancel wedding
```

#### Wedding Party Management
```
GET    /api/weddings/:id/party          # Get wedding party members
POST   /api/weddings/:id/party/invite   # Invite groomsmen
PUT    /api/weddings/:id/party/:memberId # Update member details
DELETE /api/weddings/:id/party/:memberId # Remove member
```

#### Measurements & Coordination
```
GET    /api/weddings/:id/measurements   # Get all measurements status
POST   /api/weddings/:id/measurements   # Submit measurements
GET    /api/weddings/:id/timeline       # Get wedding timeline
POST   /api/weddings/:id/timeline       # Add timeline event
GET    /api/weddings/:id/communications # Get message history
POST   /api/weddings/:id/message        # Send group message
```

#### Bulk Operations
```
POST   /api/weddings/:id/bulk-order     # Create order for entire party
POST   /api/weddings/:id/bulk-message   # Message all party members
GET    /api/weddings/:id/bulk-status    # Get status of all members
POST   /api/weddings/:id/reminder       # Send reminders to pending members
```

#### Analytics & Reporting
```
GET    /api/analytics/weddings/summary  # Wedding analytics
GET    /api/analytics/weddings/trends   # Wedding trends
GET    /api/analytics/popular-themes    # Popular themes
```

#### Customer Portal
```
POST   /api/customer/join-wedding       # Join wedding party
GET    /api/customer/my-weddings        # Get weddings I'm part of
POST   /api/customer/measurements       # Submit my measurements
GET    /api/customer/wedding-orders     # Get my wedding-related orders
```

### **Authentication Requirements**
- **Method**: JWT Bearer tokens
- **Header Format**: `Authorization: Bearer <token>`
- **Content Type**: `application/json`
- **CORS**: Must allow requests from frontend domain

### **Data Structures Expected**

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

---

## 🔧 Deployment Steps

### **1. Frontend Deployment (Vercel)**

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select "Vite" as framework

2. **Configure Build Settings**
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all `VITE_*` variables from the configuration above

4. **Deploy**
   - Vercel will automatically build and deploy
   - Note the deployment URL for backend CORS configuration

### **2. Backend Deployment (Railway)**

1. **Database Setup**
   - Railway automatically provides PostgreSQL
   - Use `${{Postgres.DATABASE_URL}}` as DATABASE_URL

2. **Environment Variables**
   - Set all backend environment variables in Railway dashboard
   - Generate secure JWT secrets using crypto.randomBytes()

3. **CORS Configuration**
   - Update `FRONTEND_URL` with your Vercel deployment URL
   - Backend already configured to accept requests from Vercel domains

### **3. Wedding System Integration**

1. **When Backend Team is Ready**
   - Get API URL from backend team
   - Add `VITE_WEDDING_API_URL` to Vercel environment variables
   - Test authentication flow
   - Verify all endpoints are working

2. **Frontend Will Automatically**
   - Detect wedding API when environment variable is set
   - Enable wedding features in the UI
   - Switch from mock data to real API calls

---

## 🧪 Testing Checklist

### **Core Features**
- [ ] User authentication (login/logout)
- [ ] Dashboard loads with analytics
- [ ] Customer management (create/view/edit)
- [ ] Order management
- [ ] Measurement system
- [ ] Appointment scheduling
- [ ] Real-time notifications (WebSocket)

### **Wedding Features (When Integrated)**
- [ ] Wedding creation and management
- [ ] Party member invitation
- [ ] Measurement collection
- [ ] Timeline management
- [ ] Group communication
- [ ] Bulk operations
- [ ] Customer portal access

### **API Health Checks**
- [ ] Main backend: `https://front-of-the-backend-production.up.railway.app/health`
- [ ] Wedding backend: `https://your-wedding-backend.com/api/health`
- [ ] WebSocket connection
- [ ] Database connectivity

---

## 🚨 Security Notes

### **API Key Security**
- ✅ Never commit API keys to version control
- ✅ Use environment variables only
- ✅ Rotate keys every 90 days
- ✅ Monitor usage for unusual activity

### **CORS Configuration**
- ✅ Backend allows specific domains only
- ✅ No wildcard (*) origins in production
- ✅ Credentials enabled for authenticated requests

### **Authentication**
- ✅ JWT tokens expire appropriately
- ✅ Refresh token rotation implemented
- ✅ Secure token storage (httpOnly cookies preferred)

---

## 📞 Support & Troubleshooting

### **Common Issues**

1. **CORS Errors**
   - Verify `FRONTEND_URL` is set correctly in backend
   - Check that frontend domain is whitelisted

2. **Authentication Failures**
   - Verify JWT secrets match between frontend and backend
   - Check token expiration times

3. **API Connection Issues**
   - Verify all environment variables are set
   - Check API health endpoints
   - Verify network connectivity

### **Monitoring**

- **Backend Health**: `https://front-of-the-backend-production.up.railway.app/health`
- **Database Health**: `https://front-of-the-backend-production.up.railway.app/health/database`
- **Frontend Status**: Vercel deployment dashboard
- **Error Tracking**: Check browser console and network tab

---

## 🎉 Production Readiness

### **Current Status**
✅ **Ready for Production**
- Core business logic API deployed
- Authentication system working
- Customer/order management functional
- Real-time features operational
- Frontend optimized and built

🔄 **Pending Wedding Integration**
- Wedding backend API development
- Integration testing
- Customer portal features
- Group coordination tools

### **Go-Live Checklist**
- [ ] All environment variables configured
- [ ] SSL certificates active
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Monitoring configured
- [ ] Backup procedures in place
- [ ] Performance testing completed

---

## 📈 Next Steps

1. **Immediate**: Deploy current system with core features
2. **Phase 2**: Integrate wedding system when backend is ready
3. **Phase 3**: Add advanced analytics and reporting
4. **Phase 4**: Mobile app development
5. **Phase 5**: Advanced AI features and automation

---

*This document should be updated as new APIs are integrated and requirements change. Keep it as the single source of truth for deployment configuration.* 