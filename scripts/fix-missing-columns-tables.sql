-- Fix Missing Columns and Tables
-- Run this to fix the current 500 errors

-- 1. Add missing size columns to customer_profiles
ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS "jacketSize" TEXT,
ADD COLUMN IF NOT EXISTS "jacketSizeConfidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "vestSize" TEXT,
ADD COLUMN IF NOT EXISTS "vestSizeConfidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "shirtSize" TEXT,
ADD COLUMN IF NOT EXISTS "shirtSizeConfidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "shoeSize" TEXT,
ADD COLUMN IF NOT EXISTS "shoeSizeConfidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "pantsSize" TEXT,
ADD COLUMN IF NOT EXISTS "pantsSizeConfidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "sizeProfileCompleteness" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "highValueFirstOrder" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "primaryOccasion" TEXT,
ADD COLUMN IF NOT EXISTS "preferredStyles" TEXT[],
ADD COLUMN IF NOT EXISTS "preferredColors" TEXT[],
ADD COLUMN IF NOT EXISTS "acceptsEmailMarketing" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "acceptsSmsMarketing" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "marketingTags" TEXT[],
ADD COLUMN IF NOT EXISTS "firstPurchaseDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastPurchaseDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "daysSinceLastPurchase" INTEGER;

-- 2. Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2),
    customizations JSONB,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE SET NULL
);

-- 3. Create index for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items("orderId");
CREATE INDEX IF NOT EXISTS idx_order_items_productId ON order_items("productId");

-- 4. Re-seed order items with the sample data
INSERT INTO order_items (id, "orderId", "productId", quantity, price, total)
VALUES 
    ('item001', 'ord001', 'prod001', 1, 899.00, 899.00),
    ('item002', 'ord001', 'prod002', 1, 149.00, 149.00),
    ('item003', 'ord002', 'prod002', 1, 149.00, 149.00),
    ('item004', 'ord002', 'prod003', 1, 89.00, 89.00),
    ('item005', 'ord003', 'prod004', 1, 999.00, 999.00)
ON CONFLICT DO NOTHING;

-- 5. Verify fixes
SELECT 'customer_profiles columns:' as check_type, COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'customer_profiles' 
AND column_name IN ('jacketSize', 'vestSize', 'shirtSize');

SELECT 'order_items table:' as check_type, 
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items') as exists,
    (SELECT COUNT(*) FROM order_items) as row_count;