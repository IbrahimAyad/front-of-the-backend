# MacOS Admin Panel Integration Guide

## Overview

This guide explains how to connect your front-of-the-backend system with the MacOS Admin Panel that serves product data on port 8080.

## 🔧 What Was Added

### Backend Endpoints

#### 1. Manual Sync Endpoint
```
GET /api/sync/pull-from-admin
```
- Manually pulls products from MacOS Admin Panel
- Updates your database with latest product data
- Routes products to appropriate categories (suits/shirts/ties)

#### 2. Webhook Receiver
```
POST /api/webhooks/products
```
- Receives push updates from MacOS Admin Panel
- Automatically updates your database when products change
- Handles bulk product updates

#### 3. Additional Sync Endpoints
```
GET /api/sync/pull-inventory    # Sync inventory levels
GET /api/sync/pull-customers    # Sync customer data  
GET /api/sync/pull-orders       # Sync order data
```

### Frontend Integration

- **Sync Button** in Inventory Management Dashboard (`/inventory`)
- Real-time sync status and progress indicators
- Success/error messaging for sync operations
- Automatic data refresh after successful sync

## 🚀 Setup Instructions

### 1. Environment Configuration

Add both API keys to your Railway backend environment:

```bash
# Backend authenticates TO MacOS Admin Panel
MACOS_ADMIN_API_KEY=452a711bbfd449a28a98756b69e14560

# MacOS Admin Panel authenticates TO Backend (webhook security)
BACKEND_API_KEY=0aadbad87424e6f468ce0fdb18d1462fd03b133c1b48fd805fab14d4bac3bd75
```

**How to add to Railway:**
1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to "Variables" tab
4. Add these variables:
   - `MACOS_ADMIN_API_KEY` = `452a711bbfd449a28a98756b69e14560`
   - `BACKEND_API_KEY` = `0aadbad87424e6f468ce0fdb18d1462fd03b133c1b48fd805fab14d4bac3bd75`
5. Redeploy your service

### 2. MacOS Admin Panel Requirements

Your MacOS Admin Panel should provide these endpoints:

```
GET http://localhost:8080/api/products      # Product data
GET http://localhost:8080/api/inventory     # Inventory levels
GET http://localhost:8080/api/customers     # Customer data
GET http://localhost:8080/api/orders        # Order data
```

**Authentication Flow:**
- **Backend → MacOS Admin**: Uses `X-API-Key: 452a711bbfd449a28a98756b69e14560`
- **MacOS Admin → Backend**: Uses `X-API-Key: 0aadbad87424e6f468ce0fdb18d1462fd03b133c1b48fd805fab14d4bac3bd75`

### 3. Expected Data Format

#### Products Endpoint (`/api/products`)
```json
[
  {
    "id": "product-1",
    "sku": "SUIT-001",
    "name": "Navy Business Suit",
    "description": "Professional navy suit",
    "price": 599.99,
    "category": "suits",
    "inStock": 15
  }
]
```

#### Inventory Endpoint (`/api/inventory`)
```json
[
  {
    "sku": "SUIT-001",
    "quantity": 15
  }
]
```

#### Customers Endpoint (`/api/customers`)
```json
[
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, State"
  }
]
```

## 🧪 Testing the Integration

### 1. Run the Test Script
```bash
node test-macos-admin-sync.js
```

This will test:
- Manual sync endpoint functionality
- Webhook receiver
- Database integration
- Additional sync endpoints

### 2. Manual Testing Steps

1. **Start MacOS Admin Panel** (port 8080)
2. **Open Frontend** → Navigate to `/inventory`
3. **Click "Sync from MacOS Admin"** button
4. **Verify Results:**
   - Success message appears
   - Products appear in the admin UI
   - Database is updated

### 3. Test Webhook (Optional)
```bash
curl -X POST http://localhost:8000/api/webhooks/products \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 0aadbad87424e6f468ce0fdb18d1462fd03b133c1b48fd805fab14d4bac3bd75" \
  -d '{
    "products": [
      {
        "id": "test-1",
        "sku": "TEST-SUIT-001", 
        "name": "Test Suit",
        "price": 599.99,
        "category": "suits",
        "inStock": 10
      }
    ]
  }'
```

## 🔄 How It Works

### Manual Sync Flow
1. User clicks "Sync from MacOS Admin" in frontend
2. Frontend calls `GET /api/sync/pull-from-admin`
3. Backend fetches data from `http://localhost:8080/api/products`
4. Backend updates database with new/changed products
5. Frontend shows success message and refreshes data

### Webhook Flow (for push updates)
1. MacOS Admin Panel detects product changes
2. MacOS Admin sends POST to `/api/webhooks/products`
3. Backend receives and processes product updates
4. Database is updated automatically
5. Frontend can be notified via WebSocket (optional)

### Data Routing
Products are automatically routed based on category:
- `"suits"` → Suits database/table
- `"shirts"` → Shirts database/table  
- `"ties"` → Ties database/table
- `"accessories"` → Accessories database/table

## 🛠️ Troubleshooting

### Common Issues

#### 1. "MacOS Admin not running"
- **Cause:** MacOS Admin Panel is not started or not on port 8080
- **Solution:** Start your MacOS Admin Panel and ensure it's running on `http://localhost:8080`

#### 2. "MACOS_ADMIN_API_KEY not configured"
- **Cause:** Environment variable not set on Railway
- **Solution:** Add the API key to Railway environment variables

#### 3. "Could not connect to MacOS Admin"
- **Cause:** Network connectivity or firewall issues
- **Solution:** 
  - Ensure both systems are on same network
  - Check firewall settings
  - Verify MacOS Admin is accessible at `http://localhost:8080`

#### 4. Authentication errors
- **Cause:** API key mismatch
- **Solution:** Verify API key matches in both systems

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will show detailed sync logs in the backend console.

## 📊 Monitoring

### Frontend Indicators
- **Sync Button State:** Shows "Syncing..." during operation
- **Success Messages:** Green alert with sync results
- **Error Messages:** Red alert with error details
- **Product Count:** Updates automatically after sync

### Backend Logs
Monitor Railway logs for:
- Sync requests and responses
- Database update operations
- Error messages and stack traces

## 🔮 Future Enhancements

Potential improvements:
1. **Real-time Sync:** WebSocket connection for instant updates
2. **Scheduled Sync:** Automatic periodic synchronization
3. **Conflict Resolution:** Handle concurrent updates gracefully
4. **Sync History:** Track all sync operations and changes
5. **Selective Sync:** Choose specific categories or products to sync

## 📋 Summary

✅ **Completed:**
- Manual sync endpoint (`/api/sync/pull-from-admin`)
- Webhook receiver (`/api/webhooks/products`) 
- Frontend sync button with status indicators
- Additional sync endpoints for inventory, customers, orders
- Comprehensive error handling and logging
- Test script for verification

🎯 **Ready to Use:**
1. Add `MACOS_ADMIN_API_KEY` to Railway environment
2. Start MacOS Admin Panel on port 8080
3. Click "Sync from MacOS Admin" in frontend
4. Products will appear in your admin UI

The integration is minimal but complete - just two endpoints that keep your existing code intact while connecting to the MacOS Admin Panel. 