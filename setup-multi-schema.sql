-- Multi-Schema Database Setup Script
-- This script creates the required schemas for the multi-tenant architecture

-- Create schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS tenant_shared;
CREATE SCHEMA IF NOT EXISTS tenant_kct;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Grant permissions to the database user
-- Replace 'your_db_user' with your actual database user
-- GRANT ALL PRIVILEGES ON SCHEMA tenant_shared TO your_db_user;
-- GRANT ALL PRIVILEGES ON SCHEMA tenant_kct TO your_db_user;
-- GRANT ALL PRIVILEGES ON SCHEMA analytics TO your_db_user;

-- Set search path to include all schemas
-- This allows cross-schema references to work properly
ALTER DATABASE SET search_path TO public, tenant_shared, tenant_kct, analytics;

-- Create some useful views for cross-schema analytics (optional)
CREATE OR REPLACE VIEW analytics.customer_order_summary AS
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.email,
    COUNT(o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_spent,
    MAX(o.createdAt) as last_order_date
FROM tenant_kct.customers c
LEFT JOIN tenant_kct.orders o ON c.id = o.customerId
GROUP BY c.id, c.name, c.email;

-- Create a view for product performance analytics
CREATE OR REPLACE VIEW analytics.product_performance AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.category,
    p.price,
    COUNT(oi.id) as times_ordered,
    COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
    COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
FROM tenant_shared.products p
LEFT JOIN tenant_kct.order_items oi ON p.id = oi.productId
LEFT JOIN tenant_kct.orders o ON oi.orderId = o.id
GROUP BY p.id, p.name, p.category, p.price;

-- Indexes for better performance across schemas
CREATE INDEX IF NOT EXISTS idx_customers_email ON tenant_kct.customers(email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON tenant_kct.orders(customerId);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON tenant_kct.orders(createdAt);
CREATE INDEX IF NOT EXISTS idx_products_category ON tenant_shared.products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON tenant_shared.products(sku);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON tenant_kct.order_items(productId);

COMMENT ON SCHEMA tenant_shared IS 'Shared data across all tenants - products, suppliers, inventory';
COMMENT ON SCHEMA tenant_kct IS 'KCT-specific tenant data - customers, orders, appointments';
COMMENT ON SCHEMA analytics IS 'Analytics and reporting data - insights, recommendations';

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Multi-schema database setup completed successfully!';
    RAISE NOTICE 'Schemas created: public, tenant_shared, tenant_kct, analytics';
    RAISE NOTICE 'Views created: customer_order_summary, product_performance';
    RAISE NOTICE 'Indexes created for optimal performance';
END $$;