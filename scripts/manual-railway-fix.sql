-- Manual Railway Database Fix
-- Run this directly in Railway PostgreSQL if migrations fail

-- 1. Create customer_profiles if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customer_profiles') THEN
        CREATE TABLE customer_profiles (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "customerId" TEXT UNIQUE NOT NULL,
            "customerTier" TEXT DEFAULT 'Silver',
            "engagementScore" INTEGER DEFAULT 0,
            "vipStatus" BOOLEAN DEFAULT false,
            "jacketSize" TEXT,
            "jacketSizeConfidence" DOUBLE PRECISION,
            "vestSize" TEXT,
            "vestSizeConfidence" DOUBLE PRECISION,
            "shirtSize" TEXT,
            "shirtSizeConfidence" DOUBLE PRECISION,
            "shoeSize" TEXT,
            "shoeSizeConfidence" DOUBLE PRECISION,
            "pantsSize" TEXT,
            "pantsSizeConfidence" DOUBLE PRECISION,
            "sizeProfileCompleteness" DOUBLE PRECISION DEFAULT 0,
            "totalSpent" DECIMAL(65,30) DEFAULT 0,
            "totalOrders" INTEGER DEFAULT 0,
            "averageOrderValue" DECIMAL(65,30) DEFAULT 0,
            "repeatCustomer" BOOLEAN DEFAULT false,
            "highValueFirstOrder" BOOLEAN DEFAULT false,
            "primaryOccasion" TEXT,
            "preferredStyles" TEXT[],
            "preferredColors" TEXT[],
            "acceptsEmailMarketing" BOOLEAN DEFAULT true,
            "acceptsSmsMarketing" BOOLEAN DEFAULT false,
            "marketingTags" TEXT[],
            "firstPurchaseDate" TIMESTAMP(3),
            "lastPurchaseDate" TIMESTAMP(3),
            "daysSinceLastPurchase" INTEGER,
            "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE
        );
        CREATE INDEX idx_customer_profiles_customerId ON customer_profiles("customerId");
    END IF;
END $$;

-- 2. Create collections if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collections') THEN
        CREATE TABLE collections (
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
        CREATE INDEX idx_collections_slug ON collections(slug);
    END IF;
END $$;

-- 3. Create product_collections if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_collections') THEN
        CREATE TABLE product_collections (
            "productId" TEXT NOT NULL,
            "collectionId" TEXT NOT NULL,
            position INTEGER DEFAULT 0,
            PRIMARY KEY ("productId", "collectionId"),
            FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY ("collectionId") REFERENCES collections(id) ON DELETE CASCADE
        );
    END IF;
END $$;

-- 4. Add missing columns to products (handle gracefully if they exist)
DO $$ 
BEGIN
    -- Check and add each column individually
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'smartAttributes') THEN
        ALTER TABLE products ADD COLUMN "smartAttributes" JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'fabricMarketing') THEN
        ALTER TABLE products ADD COLUMN "fabricMarketing" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'fabricCare') THEN
        ALTER TABLE products ADD COLUMN "fabricCare" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'fabricBenefits') THEN
        ALTER TABLE products ADD COLUMN "fabricBenefits" TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'colorFamily') THEN
        ALTER TABLE products ADD COLUMN "colorFamily" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'hexPrimary') THEN
        ALTER TABLE products ADD COLUMN "hexPrimary" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'hexSecondary') THEN
        ALTER TABLE products ADD COLUMN "hexSecondary" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'primaryOccasion') THEN
        ALTER TABLE products ADD COLUMN "primaryOccasion" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'occasionTags') THEN
        ALTER TABLE products ADD COLUMN "occasionTags" TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'trendingFor') THEN
        ALTER TABLE products ADD COLUMN "trendingFor" TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'outfitRole') THEN
        ALTER TABLE products ADD COLUMN "outfitRole" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'pairsWellWith') THEN
        ALTER TABLE products ADD COLUMN "pairsWellWith" TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'styleNotes') THEN
        ALTER TABLE products ADD COLUMN "styleNotes" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'localKeywords') THEN
        ALTER TABLE products ADD COLUMN "localKeywords" TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'targetLocation') THEN
        ALTER TABLE products ADD COLUMN "targetLocation" TEXT;
    END IF;
END $$;

-- 5. Populate customer profiles for existing customers
INSERT INTO customer_profiles ("customerId", "customerTier", "engagementScore")
SELECT id, 'Silver', 50
FROM customers
WHERE id NOT IN (SELECT "customerId" FROM customer_profiles)
ON CONFLICT DO NOTHING;

-- 6. Create color_palettes table if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'color_palettes') THEN
        CREATE TABLE color_palettes (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name TEXT NOT NULL,
            slug TEXT NOT NULL,
            family TEXT NOT NULL,
            "hexCode" TEXT NOT NULL,
            "displayOrder" INTEGER DEFAULT 0,
            "formalityScore" INTEGER DEFAULT 3,
            "versatilityScore" INTEGER DEFAULT 3,
            seasonality TEXT[],
            "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT color_palettes_slug_key UNIQUE (slug)
        );
    END IF;
END $$;

-- 7. Create event_profiles table if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_profiles') THEN
        CREATE TABLE event_profiles (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name TEXT NOT NULL,
            slug TEXT NOT NULL,
            description TEXT,
            "formalityRange" INTEGER[],
            "seasonalPeak" TEXT[],
            "typicalAge" TEXT,
            "essentialItems" TEXT[],
            "popularColors" TEXT[],
            "trendingStyles" TEXT[],
            "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT event_profiles_slug_key UNIQUE (slug)
        );
    END IF;
END $$;

-- Final check
SELECT 
    'customer_profiles' as table_name, 
    COUNT(*) as row_count,
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customer_profiles') as exists
FROM customer_profiles
UNION ALL
SELECT 
    'collections', 
    COUNT(*),
    EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'collections')
FROM collections
UNION ALL
SELECT 
    'products with smart attributes', 
    COUNT(*),
    EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'smartAttributes')
FROM products
WHERE "smartAttributes" IS NOT NULL;