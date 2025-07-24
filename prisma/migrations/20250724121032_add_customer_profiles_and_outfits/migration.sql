-- CreateTable
CREATE TABLE "customer_profiles" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerTier" TEXT NOT NULL DEFAULT 'Silver',
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "vipStatus" BOOLEAN NOT NULL DEFAULT false,
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
    "sizeProfileCompleteness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "averageOrderValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "repeatCustomer" BOOLEAN NOT NULL DEFAULT false,
    "highValueFirstOrder" BOOLEAN NOT NULL DEFAULT false,
    "primaryOccasion" TEXT,
    "preferredStyles" TEXT[],
    "preferredColors" TEXT[],
    "acceptsEmailMarketing" BOOLEAN NOT NULL DEFAULT true,
    "acceptsSmsMarketing" BOOLEAN NOT NULL DEFAULT false,
    "marketingTags" TEXT[],
    "firstPurchaseDate" TIMESTAMP(3),
    "lastPurchaseDate" TIMESTAMP(3),
    "daysSinceLastPurchase" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_histories" (
    "id" TEXT NOT NULL,
    "customerProfileId" TEXT NOT NULL,
    "orderId" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "productNames" TEXT[],
    "orderTotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "purchase_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_segments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "customerCount" INTEGER NOT NULL DEFAULT 0,
    "avgOrderValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outfit_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "season" TEXT,
    "basePrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outfit_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outfit_components" (
    "id" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "componentType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "outfit_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_outfits" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "templateId" TEXT,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "customizations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_outfits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_customerId_key" ON "customer_profiles"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_segments_name_key" ON "customer_segments"("name");

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_histories" ADD CONSTRAINT "purchase_histories_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_components" ADD CONSTRAINT "outfit_components_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "outfit_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_components" ADD CONSTRAINT "outfit_components_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_outfits" ADD CONSTRAINT "saved_outfits_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_outfits" ADD CONSTRAINT "saved_outfits_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "outfit_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
