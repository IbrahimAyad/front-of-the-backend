-- Run Prisma Migrations on Railway
-- This will sync the database schema with Prisma expectations

-- First, let's check what migrations exist in the database
SELECT migration_name, finished_at 
FROM _prisma_migrations 
ORDER BY finished_at DESC;

-- If migrations are missing, we need to run them via Prisma CLI
-- Connect to Railway and run:
-- npx prisma migrate deploy

-- For now, let's verify the current state
SELECT 
    'customers' as table_name, 
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers') as exists,
    (SELECT COUNT(*) FROM customers) as count
UNION ALL
SELECT 
    'orders', 
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders'),
    (SELECT COUNT(*) FROM orders)
UNION ALL
SELECT 
    'leads', 
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads'),
    (SELECT COUNT(*) FROM leads)
UNION ALL
SELECT 
    'appointments', 
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'appointments'),
    (SELECT COUNT(*) FROM appointments)
UNION ALL
SELECT 
    'order_items', 
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items'),
    (SELECT COUNT(*) FROM order_items);