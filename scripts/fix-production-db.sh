#!/bin/bash

echo "🔧 Fixing production database schema..."

# First, let's generate a fresh migration
echo "1️⃣ Generating migration..."
npx prisma migrate dev --name add_variant_images --create-only

# Show the migration that will be applied
echo "2️⃣ Migration to be applied:"
cat prisma/migrations/*/migration.sql

echo ""
echo "3️⃣ To apply this to production, run:"
echo "   npx prisma migrate deploy"
echo ""
echo "Or directly on Railway:"
echo "   railway run npx prisma migrate deploy"