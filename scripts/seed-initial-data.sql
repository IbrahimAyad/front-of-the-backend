-- Seed Initial Data for KCT Menswear
-- This script populates the database with sample data

-- 1. Create sample customers
INSERT INTO customers (id, name, email, phone, city, state, country, "createdAt", "updatedAt")
VALUES 
    ('cust001', 'John Doe', 'john.doe@example.com', '555-0101', 'New York', 'NY', 'USA', NOW(), NOW()),
    ('cust002', 'Jane Smith', 'jane.smith@example.com', '555-0102', 'Los Angeles', 'CA', 'USA', NOW(), NOW()),
    ('cust003', 'Bob Johnson', 'bob.johnson@example.com', '555-0103', 'Chicago', 'IL', 'USA', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. Create customer profiles for each customer
INSERT INTO customer_profiles ("customerId", "customerTier", "engagementScore", "totalSpent", "totalOrders")
SELECT id, 'Silver', 50, 0, 0
FROM customers
WHERE id IN ('cust001', 'cust002', 'cust003')
ON CONFLICT ("customerId") DO NOTHING;

-- 3. Create sample products
INSERT INTO products (id, name, description, category, subcategory, price, sku, status, "isPublished", "createdAt", "updatedAt")
VALUES 
    ('prod001', 'Classic Navy Suit', 'Timeless navy blue suit', 'Suits', 'Business', 899.00, 'SUIT-NAVY-001', 'active', true, NOW(), NOW()),
    ('prod002', 'White Dress Shirt', 'Crisp white cotton shirt', 'Shirts', 'Formal', 149.00, 'SHIRT-WHITE-001', 'active', true, NOW(), NOW()),
    ('prod003', 'Silk Tie - Burgundy', 'Elegant burgundy silk tie', 'Accessories', 'Ties', 89.00, 'TIE-BURG-001', 'active', true, NOW(), NOW()),
    ('prod004', 'Charcoal Wool Suit', 'Modern charcoal suit', 'Suits', 'Business', 999.00, 'SUIT-CHAR-001', 'active', true, NOW(), NOW()),
    ('prod005', 'Blue Oxford Shirt', 'Classic oxford button-down', 'Shirts', 'Casual', 129.00, 'SHIRT-BLUE-001', 'active', true, NOW(), NOW())
ON CONFLICT (sku) DO NOTHING;

-- 4. Create sample orders
INSERT INTO orders (id, "customerId", total, "totalAmount", status, "createdAt", "updatedAt")
VALUES 
    ('ord001', 'cust001', 1048.00, 1048.00, 'COMPLETED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    ('ord002', 'cust002', 238.00, 238.00, 'PENDING', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    ('ord003', 'cust003', 999.00, 999.00, 'IN_PROGRESS', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- 5. Create order items
INSERT INTO order_items (id, "orderId", "productId", quantity, price, total)
VALUES 
    ('item001', 'ord001', 'prod001', 1, 899.00, 899.00),
    ('item002', 'ord001', 'prod002', 1, 149.00, 149.00),
    ('item003', 'ord002', 'prod002', 1, 149.00, 149.00),
    ('item004', 'ord002', 'prod003', 1, 89.00, 89.00),
    ('item005', 'ord003', 'prod004', 1, 999.00, 999.00)
ON CONFLICT DO NOTHING;

-- 6. Create sample leads
INSERT INTO leads (id, "customerId", status, source, "createdAt", "updatedAt")
VALUES 
    ('lead001', 'cust001', 'QUALIFIED', 'WEBSITE', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    ('lead002', 'cust002', 'NEW', 'REFERRAL', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('lead003', NULL, 'CONTACTED', 'WALK_IN', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- 7. Create sample appointments
INSERT INTO appointments (id, "customerId", date, type, status, "createdAt", "updatedAt")
VALUES 
    ('appt001', 'cust001', NOW() + INTERVAL '3 days', 'FITTING', 'SCHEDULED', NOW(), NOW()),
    ('appt002', 'cust002', NOW() + INTERVAL '7 days', 'CONSULTATION', 'SCHEDULED', NOW(), NOW()),
    ('appt003', 'cust003', NOW() - INTERVAL '2 days', 'MEASUREMENT', 'COMPLETED', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT DO NOTHING;

-- 8. Create sample collections
INSERT INTO collections (id, name, slug, description, "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES 
    ('coll001', 'Business Essentials', 'business-essentials', 'Core business wardrobe pieces', true, 1, NOW(), NOW()),
    ('coll002', 'Wedding Collection', 'wedding-collection', 'Elegant suits for special occasions', true, 2, NOW(), NOW()),
    ('coll003', 'Summer Collection', 'summer-collection', 'Lightweight fabrics for warm weather', true, 3, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 9. Link products to collections
INSERT INTO product_collections ("productId", "collectionId", position)
VALUES 
    ('prod001', 'coll001', 1),
    ('prod004', 'coll001', 2),
    ('prod002', 'coll001', 3),
    ('prod001', 'coll002', 1),
    ('prod004', 'coll002', 2)
ON CONFLICT DO NOTHING;

-- 10. Update customer profiles with order data
UPDATE customer_profiles cp
SET 
    "totalSpent" = COALESCE((
        SELECT SUM(o.total) 
        FROM orders o 
        WHERE o."customerId" = cp."customerId" 
        AND o.status = 'COMPLETED'
    ), 0),
    "totalOrders" = COALESCE((
        SELECT COUNT(*) 
        FROM orders o 
        WHERE o."customerId" = cp."customerId" 
        AND o.status = 'COMPLETED'
    ), 0),
    "updatedAt" = NOW()
WHERE "customerId" IN ('cust001', 'cust002', 'cust003');

-- Verify data was created
SELECT 'Data Seeding Results:' as status;
SELECT 'Customers:', COUNT(*) FROM customers;
SELECT 'Products:', COUNT(*) FROM products;
SELECT 'Orders:', COUNT(*) FROM orders;
SELECT 'Leads:', COUNT(*) FROM leads;
SELECT 'Appointments:', COUNT(*) FROM appointments;
SELECT 'Collections:', COUNT(*) FROM collections;