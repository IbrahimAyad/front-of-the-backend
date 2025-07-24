-- Outfit Templates Schema
-- This creates the foundation for outfit management

-- Outfit templates table
CREATE TABLE "OutfitTemplate" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL, -- 'business', 'wedding', 'casual', 'formal'
    "availability_rule" TEXT NOT NULL DEFAULT 'check_components', -- 'always', 'check_components'
    "min_stock" INTEGER DEFAULT 0,
    "standing_hold_id" TEXT, -- Reference to MacOS Admin standing hold
    "base_price" DECIMAL(10,2) NOT NULL,
    "bundle_price" DECIMAL(10,2) NOT NULL,
    "savings_amount" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "tags" TEXT[],
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutfitTemplate_pkey" PRIMARY KEY ("id")
);

-- Outfit components linking table
CREATE TABLE "OutfitComponent" (
    "id" TEXT NOT NULL,
    "outfit_template_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "component_type" TEXT NOT NULL, -- 'suit', 'shirt', 'tie', 'shoes', 'belt'
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "is_required" BOOLEAN DEFAULT true,
    "alternatives" TEXT[], -- Array of alternative product IDs
    "size_mapping" JSONB, -- Maps outfit size to component size
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutfitComponent_pkey" PRIMARY KEY ("id")
);

-- Customer saved outfits
CREATE TABLE "CustomerOutfit" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size_selections" JSONB NOT NULL, -- {"suit": "42R", "shirt": "L", "tie": null}
    "customizations" JSONB, -- Any modifications from template
    "is_favorite" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerOutfit_pkey" PRIMARY KEY ("id")
);

-- Outfit hold tracking
CREATE TABLE "OutfitHold" (
    "id" TEXT NOT NULL,
    "outfit_template_id" TEXT NOT NULL,
    "hold_id" TEXT NOT NULL, -- MacOS Admin hold ID
    "hold_type" TEXT NOT NULL, -- 'standing', 'temporary'
    "customer_id" TEXT,
    "session_id" TEXT,
    "items" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'converted', 'released'
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutfitHold_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "OutfitTemplate_sku_key" ON "OutfitTemplate"("sku");
CREATE INDEX "OutfitTemplate_category_idx" ON "OutfitTemplate"("category");
CREATE INDEX "OutfitTemplate_is_active_idx" ON "OutfitTemplate"("is_active");
CREATE INDEX "OutfitComponent_outfit_template_id_idx" ON "OutfitComponent"("outfit_template_id");
CREATE INDEX "OutfitComponent_product_id_idx" ON "OutfitComponent"("product_id");
CREATE INDEX "CustomerOutfit_customer_id_idx" ON "CustomerOutfit"("customer_id");
CREATE INDEX "CustomerOutfit_template_id_idx" ON "CustomerOutfit"("template_id");
CREATE INDEX "OutfitHold_outfit_template_id_idx" ON "OutfitHold"("outfit_template_id");
CREATE INDEX "OutfitHold_hold_id_idx" ON "OutfitHold"("hold_id");
CREATE INDEX "OutfitHold_status_idx" ON "OutfitHold"("status");

-- Foreign keys
ALTER TABLE "OutfitComponent" ADD CONSTRAINT "OutfitComponent_outfit_template_id_fkey" 
    FOREIGN KEY ("outfit_template_id") REFERENCES "OutfitTemplate"("id") ON DELETE CASCADE;
ALTER TABLE "OutfitComponent" ADD CONSTRAINT "OutfitComponent_product_id_fkey" 
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;
ALTER TABLE "CustomerOutfit" ADD CONSTRAINT "CustomerOutfit_customer_id_fkey" 
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;
ALTER TABLE "CustomerOutfit" ADD CONSTRAINT "CustomerOutfit_template_id_fkey" 
    FOREIGN KEY ("template_id") REFERENCES "OutfitTemplate"("id") ON DELETE CASCADE;
ALTER TABLE "OutfitHold" ADD CONSTRAINT "OutfitHold_outfit_template_id_fkey" 
    FOREIGN KEY ("outfit_template_id") REFERENCES "OutfitTemplate"("id") ON DELETE CASCADE;