-- Check Railway Database State
-- This script checks what tables and columns exist

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customer_profiles', 'collections', 'product_collections', 'color_palettes', 'event_profiles')
ORDER BY table_name;

-- Check if products table has smart attributes columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('smartAttributes', 'fabricMarketing', 'colorFamily', 'hexPrimary');

-- Check migration history
SELECT migration_name, finished_at 
FROM _prisma_migrations 
ORDER BY finished_at DESC 
LIMIT 10;

-- Count records in key tables
SELECT 
  (SELECT COUNT(*) FROM customers) as customer_count,
  (SELECT COUNT(*) FROM products) as product_count,
  (SELECT COUNT(*) FROM orders) as order_count;