-- AlterTable
ALTER TABLE "products" ADD COLUMN     "colorFamily" TEXT,
ADD COLUMN     "fabricBenefits" TEXT[],
ADD COLUMN     "fabricCare" TEXT,
ADD COLUMN     "fabricMarketing" TEXT,
ADD COLUMN     "hexPrimary" TEXT,
ADD COLUMN     "hexSecondary" TEXT,
ADD COLUMN     "localKeywords" TEXT[],
ADD COLUMN     "occasionTags" TEXT[],
ADD COLUMN     "outfitRole" TEXT,
ADD COLUMN     "pairsWellWith" TEXT[],
ADD COLUMN     "primaryOccasion" TEXT,
ADD COLUMN     "smartAttributes" JSONB,
ADD COLUMN     "styleNotes" TEXT,
ADD COLUMN     "targetLocation" TEXT,
ADD COLUMN     "trendingFor" TEXT[];

-- CreateTable
CREATE TABLE "color_palettes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "hexCode" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "formalityScore" INTEGER NOT NULL DEFAULT 3,
    "versatilityScore" INTEGER NOT NULL DEFAULT 3,
    "seasonality" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "color_palettes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "formalityRange" INTEGER[],
    "seasonalPeak" TEXT[],
    "typicalAge" TEXT,
    "essentialItems" TEXT[],
    "popularColors" TEXT[],
    "trendingStyles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "color_palettes_name_key" ON "color_palettes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "color_palettes_slug_key" ON "color_palettes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "event_profiles_name_key" ON "event_profiles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "event_profiles_slug_key" ON "event_profiles"("slug");
