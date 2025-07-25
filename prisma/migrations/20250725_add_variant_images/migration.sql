-- Add missing columns to product_variants table
ALTER TABLE "product_variants" 
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "imageAlt" TEXT;