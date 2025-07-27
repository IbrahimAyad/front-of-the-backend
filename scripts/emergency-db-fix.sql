-- Emergency fix for missing tables/columns
-- Run this on Railway PostgreSQL to fix 500 errors

-- Check if customer_profiles table exists
CREATE TABLE IF NOT EXISTS customer_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "customerId" TEXT UNIQUE NOT NULL,
    "customerTier" TEXT DEFAULT 'Silver',
    "engagementScore" INTEGER DEFAULT 0,
    "vipStatus" BOOLEAN DEFAULT false,
    "totalSpent" DECIMAL DEFAULT 0,
    "totalOrders" INTEGER DEFAULT 0,
    "averageOrderValue" DECIMAL DEFAULT 0,
    "repeatCustomer" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE
);

-- Check if collections table exists
CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    "heroImage" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "sortOrder" INTEGER DEFAULT 0,
    rules JSONB,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Check if product_collections table exists
CREATE TABLE IF NOT EXISTS product_collections (
    "productId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    PRIMARY KEY ("productId", "collectionId"),
    FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY ("collectionId") REFERENCES collections(id) ON DELETE CASCADE
);

-- Add missing columns to products table if they don't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS "smartAttributes" JSONB,
ADD COLUMN IF NOT EXISTS "fabricMarketing" TEXT,
ADD COLUMN IF NOT EXISTS "fabricCare" TEXT,
ADD COLUMN IF NOT EXISTS "fabricBenefits" TEXT[],
ADD COLUMN IF NOT EXISTS "colorFamily" TEXT,
ADD COLUMN IF NOT EXISTS "hexPrimary" TEXT,
ADD COLUMN IF NOT EXISTS "hexSecondary" TEXT,
ADD COLUMN IF NOT EXISTS "primaryOccasion" TEXT,
ADD COLUMN IF NOT EXISTS "occasionTags" TEXT[],
ADD COLUMN IF NOT EXISTS "trendingFor" TEXT[],
ADD COLUMN IF NOT EXISTS "outfitRole" TEXT,
ADD COLUMN IF NOT EXISTS "pairsWellWith" TEXT[],
ADD COLUMN IF NOT EXISTS "styleNotes" TEXT,
ADD COLUMN IF NOT EXISTS "localKeywords" TEXT[],
ADD COLUMN IF NOT EXISTS "targetLocation" TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_colorFamily ON products("colorFamily");
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_customerId ON customer_profiles("customerId");

-- Update existing customers to have profiles
INSERT INTO customer_profiles ("customerId", "customerTier", "engagementScore")
SELECT id, 'Silver', 50
FROM customers
WHERE id NOT IN (SELECT "customerId" FROM customer_profiles)
ON CONFLICT DO NOTHING;