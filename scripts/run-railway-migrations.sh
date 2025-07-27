#!/bin/bash

# Run Prisma migrations on Railway
# This should be run from Railway's shell or with Railway CLI

echo "🚀 Running Prisma migrations on Railway..."

# Run migrations
npx prisma migrate deploy

# Run the emergency SQL fix
echo "🔧 Running emergency database fixes..."
npx prisma db execute --file ./scripts/emergency-db-fix.sql

echo "✅ Migrations complete!"