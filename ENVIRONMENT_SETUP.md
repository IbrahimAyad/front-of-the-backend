# Environment Setup Guide

## Frontend Environment Variables

The frontend uses Vite environment variables that must be prefixed with `VITE_`.

### Local Development

Create a `.env.local` file in the root directory:

```bash
# Local Development Environment Variables
VITE_FRONTEND_URL=http://localhost:3001
VITE_BACKEND_URL=http://localhost:8000
VITE_WEBSOCKET_URL=ws://localhost:8000/ws
VITE_USE_MOCK_DATA=false
```

### Production (Railway Backend)

Create a `.env.production` file for production builds:

```bash
# Production Environment Variables (Railway)
VITE_FRONTEND_URL=https://your-frontend-domain.vercel.app
VITE_BACKEND_URL=https://front-of-the-backend-production.up.railway.app
VITE_WEBSOCKET_URL=wss://front-of-the-backend-production.up.railway.app/ws
VITE_USE_MOCK_DATA=false
```

## Quick Setup Commands

### For Local Development:
```bash
# Create local environment file
cat > .env.local << EOF
VITE_FRONTEND_URL=http://localhost:3001
VITE_BACKEND_URL=http://localhost:8000
VITE_WEBSOCKET_URL=ws://localhost:8000/ws
VITE_USE_MOCK_DATA=false
EOF
```

### For Production:
```bash
# Create production environment file
cat > .env.production << EOF
VITE_FRONTEND_URL=https://your-frontend-domain.vercel.app
VITE_BACKEND_URL=https://front-of-the-backend-production.up.railway.app
VITE_WEBSOCKET_URL=wss://front-of-the-backend-production.up.railway.app/ws
VITE_USE_MOCK_DATA=false
EOF
```

## Railway Backend URLs

- **Backend API**: `https://front-of-the-backend-production.up.railway.app`
- **WebSocket**: `wss://front-of-the-backend-production.up.railway.app/ws`
- **Admin Login**: `admin@kctmenswear.com` / `admin123`

## MacOS Admin Panel Integration

The backend includes sync endpoints to connect with your local MacOS Admin Panel:

### Environment Variables for Railway
Add these to your Railway backend environment variables:
```bash
# Backend authenticates TO MacOS Admin Panel  
MACOS_ADMIN_API_KEY=452a711bbfd449a28a98756b69e14560

# MacOS Admin Panel authenticates TO Backend
BACKEND_API_KEY=0aadbad87424e6f468ce0fdb18d1462fd03b133c1b48fd805fab14d4bac3bd75
```

### Available Sync Endpoints
- `GET /api/sync/pull-from-admin` - Manual sync products from MacOS Admin
- `POST /api/webhooks/products` - Webhook receiver for push updates
- `GET /api/sync/pull-inventory` - Sync inventory levels
- `GET /api/sync/pull-customers` - Sync customer data
- `GET /api/sync/pull-orders` - Sync order data

## Next Steps

1. Create the appropriate `.env` file for your environment
2. Start the frontend: `npm run dev:frontend`
3. Test the connection to Railway backend
4. Deploy frontend to Vercel or Railway 