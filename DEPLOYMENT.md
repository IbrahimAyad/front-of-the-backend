# 🚀 KCT Menswear Deployment Guide

## 📋 Pre-Deployment Checklist ✅

- [x] Database migrations applied
- [x] Database seeded with admin user
- [x] Package.json updated for production
- [x] TypeScript configuration ready

## 🛤️ Step 1: Deploy Backend to Railway

### 1.1 Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub repo"
3. Select your `kct-frontend` repository
4. Choose "Deploy from GitHub repo"

### 1.2 Add PostgreSQL Database
1. In Railway dashboard, click "Add Service" → "Database" → "PostgreSQL"
2. Railway will automatically create a database

### 1.3 Configure Environment Variables
In Railway dashboard → your backend service → Variables, add:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-super-secure-jwt-secret-min-32-characters
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-min-32-characters
FRONTEND_URL=https://your-app-name.vercel.app
USE_MOCK_DATA=false
UPLOAD_MAX_SIZE=10485760
```

### 1.4 Build Configuration
Railway will automatically detect Node.js and run:
- `npm install`
- `npm run build` (which includes `prisma generate`)
- `npm start`

### 1.5 Database Migration
After first deployment, Railway will automatically run database migrations via the `postinstall` script.

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" → Import your repository
3. Configure build settings:
   - **Framework**: Vite
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `dist`

### 2.2 Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```env
VITE_API_URL=https://your-backend-url.railway.app
VITE_WEBSOCKET_URL=wss://your-backend-url.railway.app
VITE_USE_MOCK_DATA=false
```

## 🔧 Step 3: Update URLs

### 3.1 Update Railway Environment
Once Vercel gives you the frontend URL, update Railway:
```env
FRONTEND_URL=https://your-actual-vercel-url.vercel.app
```

### 3.2 Update Vercel Environment
Once Railway gives you the backend URL, update Vercel:
```env
VITE_API_URL=https://your-actual-railway-url.railway.app
VITE_WEBSOCKET_URL=wss://your-actual-railway-url.railway.app
```

## 🧪 Step 4: Test Deployment

### 4.1 Test Backend
```bash
# Health check
curl https://your-backend-url.railway.app/health

# API test
curl https://your-backend-url.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kctmenswear.com","password":"admin123"}'
```

### 4.2 Test Frontend
1. Visit your Vercel URL
2. Login with: `admin@kctmenswear.com` / `admin123`
3. Check all pages load correctly

## 📊 Default Login Credentials

**Admin User:**
- Email: `admin@kctmenswear.com`
- Password: `admin123`

## 🔍 Common Issues & Solutions

### CORS Errors
If you get CORS errors, the backend CORS is already configured for:
- `localhost:3000`, `localhost:3001`
- `*.vercel.app`
- `*.railway.app`

### Database Connection Issues
- Ensure `DATABASE_URL` is exactly `${{Postgres.DATABASE_URL}}`
- Check Railway logs for connection errors

### Build Failures
- Ensure all dependencies are in `package.json`
- Check Railway build logs for specific errors

## 🎯 Deployment URLs

After deployment, you'll have:
- **Backend**: `https://your-project-name.railway.app`
- **Frontend**: `https://your-project-name.vercel.app`
- **Database**: Managed by Railway

## 🔐 Security Notes

1. **Generate Strong JWT Secrets**: Use at least 32 characters
2. **Environment Variables**: Never commit real secrets to Git
3. **Database**: Railway PostgreSQL is automatically secured
4. **HTTPS**: Both Railway and Vercel provide SSL certificates

## 📈 Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up automated backups
4. Add CI/CD pipeline for updates

---

🎉 **Your KCT Menswear application is now ready for production!** 