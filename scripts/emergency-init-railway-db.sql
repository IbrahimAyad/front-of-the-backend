-- EMERGENCY: Initialize Empty Railway Database
-- Run this IMMEDIATELY on Railway PostgreSQL

-- Create all core tables from scratch

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN DEFAULT true,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    "zipCode" TEXT,
    country TEXT,
    "dateOfBirth" DATE,
    notes TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products table with all fields
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    "longDescription" TEXT,
    category TEXT,
    subcategory TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    "compareAtPrice" DECIMAL(10,2),
    "costPrice" DECIMAL(10,2),
    sku TEXT UNIQUE,
    barcode TEXT,
    slug TEXT UNIQUE,
    brand TEXT,
    fabric TEXT,
    pattern TEXT,
    season TEXT,
    occasions TEXT[],
    "styleAttributes" JSONB,
    care TEXT[],
    "smartAttributes" JSONB,
    "fabricMarketing" TEXT,
    "fabricCare" TEXT,
    "fabricBenefits" TEXT[],
    "colorFamily" TEXT,
    "hexPrimary" TEXT,
    "hexSecondary" TEXT,
    "primaryOccasion" TEXT,
    "occasionTags" TEXT[],
    "trendingFor" TEXT[],
    "outfitRole" TEXT,
    "pairsWellWith" TEXT[],
    "styleNotes" TEXT,
    "localKeywords" TEXT[],
    "targetLocation" TEXT,
    "trackStock" BOOLEAN DEFAULT true,
    "totalStock" INTEGER DEFAULT 0,
    "availableStock" INTEGER DEFAULT 0,
    "reservedStock" INTEGER DEFAULT 0,
    "minimumStock" INTEGER DEFAULT 0,
    "maximumStock" INTEGER DEFAULT 1000,
    "reorderPoint" INTEGER DEFAULT 10,
    "reorderQuantity" INTEGER DEFAULT 50,
    status TEXT DEFAULT 'active',
    "isPublished" BOOLEAN DEFAULT true,
    "isFeatured" BOOLEAN DEFAULT false,
    "isOnSale" BOOLEAN DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    tags TEXT[],
    weight DECIMAL(10,2),
    dimensions JSONB,
    "supplierId" TEXT,
    "supplierSku" TEXT,
    "leadTime" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "discontinuedAt" TIMESTAMP(3)
);

-- 4. Orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "customerId" TEXT NOT NULL,
    total DECIMAL(10,2) DEFAULT 0,
    "totalAmount" DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    "paymentStatus" TEXT,
    "dueDate" DATE,
    notes TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE
);

-- 5. Customer profiles table
CREATE TABLE IF NOT EXISTS customer_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "customerId" TEXT UNIQUE NOT NULL,
    "customerTier" TEXT DEFAULT 'Silver',
    "engagementScore" INTEGER DEFAULT 0,
    "vipStatus" BOOLEAN DEFAULT false,
    "totalSpent" DECIMAL(65,30) DEFAULT 0,
    "totalOrders" INTEGER DEFAULT 0,
    "averageOrderValue" DECIMAL(65,30) DEFAULT 0,
    "repeatCustomer" BOOLEAN DEFAULT false,
    "lastPurchaseDate" TIMESTAMP(3),
    "daysSinceLastPurchase" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE
);

-- 6. Other essential tables
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "customerId" TEXT,
    status TEXT DEFAULT 'NEW',
    source TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "customerId" TEXT NOT NULL,
    date TIMESTAMP(3) NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS measurements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "customerId" TEXT NOT NULL,
    "dateRecorded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    measurements JSONB,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE
);

-- 7. Collections tables
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

CREATE TABLE IF NOT EXISTS product_collections (
    "productId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    PRIMARY KEY ("productId", "collectionId"),
    FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY ("collectionId") REFERENCES collections(id) ON DELETE CASCADE
);

-- 8. Create Prisma migrations table
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    checksum TEXT NOT NULL,
    finished_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    migration_name TEXT NOT NULL,
    logs TEXT,
    rolled_back_at TIMESTAMP(3),
    started_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    applied_steps_count INTEGER DEFAULT 0
);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_customerId ON orders("customerId");
CREATE INDEX IF NOT EXISTS idx_customer_profiles_customerId ON customer_profiles("customerId");

-- 10. Insert minimal seed data for testing
INSERT INTO users (email, "passwordHash", "firstName", "lastName", name, role)
VALUES 
    ('admin@kctmenswear.com', '$2a$10$rBLJTB8rAHAUlz.1lZGkPO6gJ.Q8J0WZqX7MqQhZh5G6Q1gY6RZIm', 'Admin', 'User', 'Admin User', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- 11. Verify tables were created
SELECT 
    'Tables Created:' as status,
    COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;