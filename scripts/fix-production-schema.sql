-- Emergency fix for production database
-- This adds the missing columns that are causing 500 errors

-- 1. Add missing variant image columns
ALTER TABLE "product_variants" 
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "imageAlt" TEXT;

-- 2. Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_variants' 
AND column_name IN ('imageUrl', 'imageAlt');