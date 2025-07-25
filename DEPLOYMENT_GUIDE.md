# Production Deployment Guide

## Current Issue (July 25, 2025)

The production database is missing columns that exist in the Prisma schema:
- `product_variants.imageUrl`
- `product_variants.imageAlt`

This is causing 500 errors on all product queries.

## Immediate Fix

### Option 1: Via Railway Dashboard
1. Go to Railway Dashboard > Your Project > Database
2. Click "Query" or "Connect"
3. Run this SQL:
```sql
ALTER TABLE "product_variants" 
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "imageAlt" TEXT;
```

### Option 2: Via Railway CLI
```bash
railway run npx prisma db execute --file scripts/fix-production-schema.sql
```

### Option 3: Run Full Migration
```bash
railway run npx prisma migrate deploy
```

## Long-term Production Deployment Process

### Pre-deployment Checklist
- [ ] Run `npm run build` locally to catch TypeScript errors
- [ ] Run `npx prisma migrate dev` to create any needed migrations
- [ ] Test locally with production data
- [ ] Review all pending migrations

### Deployment Steps

1. **Deploy Code & Run Migrations**
   ```bash
   railway up
   ```
   Railway will automatically:
   - Build the application
   - Run `prisma migrate deploy`
   - Start the server

2. **Verify Deployment**
   - Check Railway logs for migration success
   - Test the production site
   - Monitor for errors

### Environment Variables Required

Make sure these are set in Railway:
- `DATABASE_URL`
- `JWT_SECRET`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `NODE_ENV=production`

### Database Migrations

Always use Prisma migrations for schema changes:
```bash
# Create migration locally
npx prisma migrate dev --name descriptive_name

# Deploy to production
railway run npx prisma migrate deploy
```

### Rollback Plan

If deployment fails:
1. Check Railway logs for errors
2. If migrations failed, manually fix via SQL
3. Redeploy previous version if needed

## Best Practices

1. **Never manually edit the production database schema** - always use migrations
2. **Test migrations locally first** with a copy of production data
3. **Keep local and production schemas in sync**
4. **Monitor logs after deployment** for any errors
5. **Have a rollback plan** before deploying

## Common Issues

### Missing Columns Error
- **Symptom**: 500 errors, "column does not exist"
- **Fix**: Run pending migrations or add columns manually

### Migration Lock
- **Symptom**: "Migration already in progress"
- **Fix**: Clear lock in _prisma_migrations table

### Connection Issues
- **Symptom**: "Can't reach database server"
- **Fix**: Check DATABASE_URL and Railway service status