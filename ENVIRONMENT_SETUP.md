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

## Next Steps

1. Create the appropriate `.env` file for your environment
2. Start the frontend: `npm run dev:frontend`
3. Test the connection to Railway backend
4. Deploy frontend to Vercel or Railway 