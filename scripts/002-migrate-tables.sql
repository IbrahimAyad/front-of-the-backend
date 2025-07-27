-- Multi-Schema Database Architecture - Phase 1: Table Migration
-- This script moves tables to their appropriate schemas
-- IMPORTANT: Run this in a transaction and have a backup ready

BEGIN;

-- Step 1: Move product-related tables to tenant_shared schema
ALTER TABLE IF EXISTS products SET SCHEMA tenant_shared;
ALTER TABLE IF EXISTS product_variants SET SCHEMA tenant_shared;
ALTER TABLE IF EXISTS product_images SET SCHEMA tenant_shared;
ALTER TABLE IF EXISTS product_reviews SET SCHEMA tenant_shared;
ALTER TABLE IF EXISTS suppliers SET SCHEMA tenant_shared;
ALTER TABLE IF EXISTS purchase_orders SET SCHEMA tenant_shared;
ALTER TABLE IF EXISTS purchase_order_items SET SCHEMA tenant_shared;
ALTER TABLE IF EXISTS inventory_logs SET SCHEMA tenant_shared;
ALTER TABLE IF EXISTS stock_alerts SET SCHEMA tenant_shared;
ALTER TABLE IF EXISTS collections SET SCHEMA tenant_shared;
ALTER TABLE IF EXISTS product_collections SET SCHEMA tenant_shared;
ALTER TABLE IF EXISTS color_palettes SET SCHEMA tenant_shared;
ALTER TABLE IF EXISTS event_profiles SET SCHEMA tenant_shared;

-- Step 2: Move customer and order tables to tenant_kct schema
ALTER TABLE IF EXISTS customers SET SCHEMA tenant_kct;
ALTER TABLE IF EXISTS orders SET SCHEMA tenant_kct;
ALTER TABLE IF EXISTS order_items SET SCHEMA tenant_kct;
ALTER TABLE IF EXISTS appointments SET SCHEMA tenant_kct;
ALTER TABLE IF EXISTS leads SET SCHEMA tenant_kct;
ALTER TABLE IF EXISTS measurements SET SCHEMA tenant_kct;
ALTER TABLE IF EXISTS customer_profiles SET SCHEMA tenant_kct;
ALTER TABLE IF EXISTS purchase_histories SET SCHEMA tenant_kct;
ALTER TABLE IF EXISTS saved_outfits SET SCHEMA tenant_kct;
ALTER TABLE IF EXISTS outfit_templates SET SCHEMA tenant_kct;
ALTER TABLE IF EXISTS outfit_components SET SCHEMA tenant_kct;

-- Step 3: Move analytics tables to analytics schema
ALTER TABLE IF EXISTS customer_purchase_history SET SCHEMA analytics;
ALTER TABLE IF EXISTS customer_size_analysis SET SCHEMA analytics;
ALTER TABLE IF EXISTS customer_insights SET SCHEMA analytics;
ALTER TABLE IF EXISTS product_recommendations SET SCHEMA analytics;
ALTER TABLE IF EXISTS customer_segments SET SCHEMA analytics;

-- Step 4: Keep auth/system tables in public schema
-- users, ai_actions stay in public

-- Step 5: Update foreign key constraints to reference new schemas
-- This happens automatically when tables are moved

-- Step 6: Update search path for the database
ALTER DATABASE CURRENT SET search_path TO public, tenant_shared, tenant_kct, analytics, cache, audit;

-- Step 7: Grant necessary permissions on moved tables
GRANT ALL ON ALL TABLES IN SCHEMA tenant_shared TO current_user;
GRANT ALL ON ALL TABLES IN SCHEMA tenant_kct TO current_user;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO current_user;

-- Step 8: Verify migration
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname IN ('public', 'tenant_shared', 'tenant_kct', 'analytics', 'cache', 'audit')
    AND tableowner = current_user
ORDER BY schemaname, tablename;

-- If everything looks good, commit. Otherwise ROLLBACK;
-- COMMIT;