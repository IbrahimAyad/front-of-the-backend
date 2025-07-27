# Multi-Schema Database Migration Execution Plan

## Pre-Migration Checklist
- [ ] Full database backup completed
- [ ] Read replica configured (optional but recommended)
- [ ] Maintenance window scheduled
- [ ] Team notified of migration

## Phase 1: Schema Creation (Day 1)
### Duration: 30 minutes
1. **Create backup**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run schema creation script**
   ```bash
   psql $DATABASE_URL < scripts/001-create-schemas.sql
   ```

3. **Verify schemas created**
   ```sql
   SELECT schema_name FROM information_schema.schemata 
   WHERE schema_name IN ('tenant_shared', 'tenant_kct', 'analytics');
   ```

## Phase 2: Table Migration (Day 1-2)
### Duration: 2-4 hours
1. **Run migration script**
   ```bash
   npm run migrate:multi-schema
   # or
   ts-node scripts/migrate-to-multi-schema.ts
   ```

2. **Verify table distribution**
   ```sql
   SELECT schemaname, COUNT(*) 
   FROM pg_tables 
   WHERE tableowner = current_user 
   GROUP BY schemaname;
   ```

## Phase 3: Application Update (Day 2-3)
### Duration: 1 day
1. **Update Prisma schema**
   - Add `@@schema` directives to models
   - Enable multiSchema preview feature
   
2. **Replace database clients**
   ```typescript
   // Old
   import { prisma } from './lib/prisma'
   
   // New
   import { getSchemaAwareClient } from './lib/db/schema-aware-client'
   const db = getSchemaAwareClient()
   ```

3. **Update service layer**
   - Replace direct Prisma calls with schema-aware client
   - Test all CRUD operations

## Phase 4: Connection Pool Optimization (Day 3)
### Duration: 4 hours
1. **Deploy connection pool**
   ```typescript
   // In server.ts
   import { getPool } from './lib/db/connection-pool'
   
   // Initialize on startup
   const pool = getPool()
   await pool.checkHealth()
   ```

2. **Update environment variables**
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/db?pgbouncer=true
   DATABASE_READONLY_URL=postgresql://user:pass@host-readonly:5432/db
   ```

## Phase 5: Monitoring Setup (Day 4)
### Duration: 2 hours
1. **Deploy monitoring endpoints**
   ```typescript
   // Add to health routes
   app.get('/health/db-schemas', async (req, res) => {
     const db = getSchemaAwareClient()
     const health = await db.healthCheck()
     res.json(health)
   })
   ```

2. **Set up alerts**
   - Connection pool exhaustion
   - Schema accessibility issues
   - Query performance degradation

## Rollback Plan
If issues occur at any phase:

1. **Immediate rollback (< 1 hour)**
   ```sql
   -- Move all tables back to public schema
   BEGIN;
   ALTER TABLE tenant_shared.* SET SCHEMA public;
   ALTER TABLE tenant_kct.* SET SCHEMA public;
   ALTER TABLE analytics.* SET SCHEMA public;
   COMMIT;
   ```

2. **Restore from backup**
   ```bash
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Revert code changes**
   ```bash
   git revert --no-commit HEAD~5..HEAD
   git commit -m "Revert multi-schema migration"
   ```

## Success Criteria
- [ ] All schemas created and accessible
- [ ] Tables distributed correctly across schemas
- [ ] Application functioning with schema-aware clients
- [ ] Connection pool errors reduced by 80%
- [ ] Query performance maintained or improved
- [ ] Zero data loss
- [ ] Rollback plan tested

## Post-Migration Tasks
1. Monitor error logs for 48 hours
2. Analyze query performance metrics
3. Document any issues encountered
4. Plan for read replica implementation
5. Schedule PostgreSQL connection reset fix

## Commands Summary
```bash
# Create schemas
psql $DATABASE_URL < scripts/001-create-schemas.sql

# Run migration
npm run build
node dist/scripts/migrate-to-multi-schema.js

# Verify migration
psql $DATABASE_URL -c "SELECT schemaname, COUNT(*) FROM pg_tables GROUP BY schemaname"

# Check health
curl http://localhost:8000/health/db-schemas
```