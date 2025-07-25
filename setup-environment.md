# Environment Variables Setup Guide

## Current Issues Found:
1. ❌ **DATABASE_URL** - Using template variables that won't work locally
2. ❌ **CLOUDFLARE_ACCOUNT_ID** - Missing
3. ❌ **CLOUDFLARE_API_TOKEN** - Missing
4. ⚠️  **VITE_CLOUDFLARE_*** - Missing (optional but recommended)

## Required Environment Variables:

### For Railway Deployment:
Add these to your Railway service variables:

```bash
# These were provided by the user earlier:
CLOUDFLARE_ACCOUNT_ID=62232025da980a57e4774b60fef3dccc
CLOUDFLARE_API_TOKEN=Chn3Hcgcy-BQ306WCrA6bT5gSTa5wE-F0SfxNR4k

# Database URL (Railway provides this automatically)
# JWT Secret (already in .env)
JWT_SECRET=4884ff2143bdb1a6afd467add12df04bc4a1c59447b375e3cc38706aef59906f0705262312a04a4f0f9be112d3ec0d7cb2cdef8437e07cd309bfccd8eede441a
```

### For Vercel Deployment:
Add these to your Vercel environment variables:

```bash
# Frontend needs these prefixed with VITE_
VITE_CLOUDFLARE_ACCOUNT_ID=62232025da980a57e4774b60fef3dccc
VITE_CLOUDFLARE_API_TOKEN=Chn3Hcgcy-BQ306WCrA6bT5gSTa5wE-F0SfxNR4k
VITE_API_BASE_URL=https://front-of-the-backend-production.up.railway.app

# Add the Railway PostgreSQL connection string
DATABASE_URL=postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway
```

### For Local Development (.env.local):
Create a `.env.local` file with:

```bash
# Database (use the Railway external URL for now)
DATABASE_URL="postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@trolley.proxy.rlwy.net:21772/railway"

# JWT Secret
JWT_SECRET="4884ff2143bdb1a6afd467add12df04bc4a1c59447b375e3cc38706aef59906f0705262312a04a4f0f9be112d3ec0d7cb2cdef8437e07cd309bfccd8eede441a"

# Cloudflare Images
CLOUDFLARE_ACCOUNT_ID="62232025da980a57e4774b60fef3dccc"
CLOUDFLARE_API_TOKEN="Chn3Hcgcy-BQ306WCrA6bT5gSTa5wE-F0SfxNR4k"

# Frontend variables (for local dev)
VITE_CLOUDFLARE_ACCOUNT_ID="62232025da980a57e4774b60fef3dccc"
VITE_CLOUDFLARE_API_TOKEN="Chn3Hcgcy-BQ306WCrA6bT5gSTa5wE-F0SfxNR4k"
VITE_API_URL="http://localhost:8000"
VITE_API_BASE_URL="http://localhost:8000"

# Keep existing from .env
NODE_ENV="development"
PORT=8000
```

## Variable Purposes:

1. **DATABASE_URL**: PostgreSQL connection string
   - Railway internal: `postgresql://postgres:pass@postgres.railway.internal:5432/railway`
   - Railway external: `postgresql://postgres:pass@host.proxy.rlwy.net:port/railway`

2. **JWT_SECRET**: Used to sign JWT tokens for authentication
   - Must be at least 32 characters
   - Keep this secret!

3. **CLOUDFLARE_ACCOUNT_ID**: Your Cloudflare account identifier
   - Found in Cloudflare dashboard
   - Used for image uploads

4. **CLOUDFLARE_API_TOKEN**: API token with Cloudflare Images permissions
   - NOT the Global API Key
   - Must have Images read/write permissions

5. **VITE_* variables**: Frontend environment variables
   - Exposed to browser (be careful!)
   - Used for client-side API calls

## Common Issues:

1. **"Invalid API Token"**: Make sure you're using an API Token, not Global API Key
2. **"Database connection failed"**: Check DATABASE_URL format and credentials
3. **"JWT_SECRET too short"**: Must be at least 32 characters
4. **Template variables (${{}})**": These only work on Railway, not locally

## Testing Your Configuration:

Run the environment check script:
```bash
npx tsx check-environment-vars.ts
```

This will verify all variables are properly set and valid.