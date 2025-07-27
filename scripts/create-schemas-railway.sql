-- Railway PostgreSQL Schema Creation Script
-- This creates the schemas WITHOUT moving tables
-- Run this BEFORE deploying the new code

-- Create schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS tenant_shared;
CREATE SCHEMA IF NOT EXISTS tenant_kct;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS cache;
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant permissions to the application user
-- Railway uses the default postgres user
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA tenant_shared TO postgres;
GRANT ALL ON SCHEMA tenant_kct TO postgres;
GRANT ALL ON SCHEMA analytics TO postgres;
GRANT ALL ON SCHEMA cache TO postgres;
GRANT ALL ON SCHEMA audit TO postgres;

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant_shared GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant_kct GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA cache GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT ALL ON TABLES TO postgres;

-- Update search path to include all schemas
ALTER DATABASE postgres SET search_path TO public, tenant_shared, tenant_kct, analytics, cache, audit;

-- Verify schemas were created
SELECT schema_name, schema_owner 
FROM information_schema.schemata 
WHERE schema_name IN ('public', 'tenant_shared', 'tenant_kct', 'analytics', 'cache', 'audit')
ORDER BY schema_name;