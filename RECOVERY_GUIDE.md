# KCT Project Recovery Guide

## Common Issues and Solutions

### 1. Config Import Errors

**Problem:** Server crashes with "The requested module does not provide an export named 'config'"

**Root Cause:** Mixed import patterns between frontend (Vite) and backend (Node.js) environments.

**Solution:**
- Backend files must import: `import { backendConfig } from '../utils/config'`
- Frontend files must import: `import { frontendConfig } from '../../utils/config'`
- Use `backendConfig.PROPERTY` in backend, `frontendConfig.PROPERTY` in frontend

### 2. Environment Variable Issues

**Problem:** `TypeError: Cannot read properties of undefined (reading 'VITE_USE_MOCK_DATA')`

**Root Cause:** Node.js trying to access `import.meta.env` which only exists in Vite/browser context.

**Solution:**
- Config file uses environment detection: `isViteEnvironment`
- Backend uses `process.env.USE_MOCK_DATA`
- Frontend uses `import.meta.env.VITE_USE_MOCK_DATA`

### 3. Database Connection Issues

**Problem:** PostgreSQL connection refused or stale PID files

**Recovery Steps:**
```bash
# 1. Stop all processes
pkill -f postgres
pkill -f nodemon

# 2. Remove stale PostgreSQL files
rm -f /usr/local/var/postgresql@14/postmaster.pid

# 3. Restart database (choose one)
docker start kct-postgres
# OR
pg_ctl -D /usr/local/var/postgresql@14 start

# 4. Test connection
psql postgres

# 5. Backup before making changes
cp .env .env.backup
pg_dump -U postgres -d kct_menswear > backup.sql
```

### 4. Fastify Plugin Version Mismatches

**Problem:** Plugin version compatibility errors

**Current Issues:**
- Fastify v5.4.0 installed
- @fastify/cors expects v4.x (incompatible)
- @fastify/jwt expects v5.x (compatible)

**Solution:** Update plugins to match Fastify v5.x or downgrade Fastify to v4.x

### 5. Server Startup Commands

**Backend:**
```bash
USE_MOCK_DATA=true npm run dev
```

**Frontend:**
```bash
npm run dev:frontend
```

**Both (separate terminals):**
```bash
# Terminal 1 - Backend
USE_MOCK_DATA=true npm run dev

# Terminal 2 - Frontend  
npm run dev:frontend
```

## Environment Variables

### Backend (.env or environment)
```
USE_MOCK_DATA=true
PORT=8000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Frontend (Vite environment)
```
VITE_USE_MOCK_DATA=true
VITE_FRONTEND_URL=http://localhost:3001
```

## Quick Health Checks

### Backend Health
```bash
curl http://localhost:8000/health
```

### Frontend Health
```bash
curl http://localhost:3001
```

### Database Health
```bash
psql postgres -c "SELECT 1;"
```

## File Structure for Config

```
src/utils/config.ts
├── frontendConfig (for React/Vite)
│   ├── USE_MOCK_DATA (from VITE_USE_MOCK_DATA)
│   └── FRONTEND_URL (from VITE_FRONTEND_URL)
└── backendConfig (for Node.js/Fastify)
    ├── USE_MOCK_DATA (from USE_MOCK_DATA)
    ├── PORT, JWT_SECRET, etc.
    └── All process.env variables
```

## Prevention Tips

1. **Always check imports:** Backend = `backendConfig`, Frontend = `frontendConfig`
2. **Environment separation:** Node.js uses `process.env`, Vite uses `import.meta.env`
3. **Version compatibility:** Keep Fastify and plugins in sync
4. **Database backups:** Always backup before major changes
5. **Process cleanup:** Kill stale processes before restart

## Emergency Reset

If all else fails:
```bash
# Nuclear option - reset everything
pkill -f node
pkill -f postgres
rm -f /usr/local/var/postgresql@14/postmaster.pid
docker restart kct-postgres
npm install
USE_MOCK_DATA=true npm run dev
``` 