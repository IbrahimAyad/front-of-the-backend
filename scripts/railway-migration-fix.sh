#!/bin/bash

echo "🚀 Railway Database Migration Fix Script"
echo "======================================="

# Check if we're in Railway environment
if [ -z "$RAILWAY_ENVIRONMENT" ]; then
    echo "⚠️  Warning: Not running in Railway environment"
    echo "This script is designed to run in Railway shell"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📊 Step 1: Checking current database state..."
npx prisma db execute --file ./scripts/check-railway-db.sql || echo "Check failed"

echo ""
echo "🔄 Step 2: Running Prisma migrations..."
npx prisma migrate deploy

echo ""
echo "🔧 Step 3: Running emergency fixes for missing elements..."
npx prisma db execute --file ./scripts/emergency-db-fix.sql

echo ""
echo "🌱 Step 4: Populating customer profiles..."
npx tsx prisma/populate-customer-profiles.ts || echo "Profile population skipped"

echo ""
echo "📊 Step 5: Final database state check..."
echo "SELECT 'Tables:', COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | npx prisma db execute --stdin
echo "SELECT 'Customer Profiles:', COUNT(*) FROM customer_profiles;" | npx prisma db execute --stdin
echo "SELECT 'Collections:', COUNT(*) FROM collections;" | npx prisma db execute --stdin

echo ""
echo "✅ Migration fix complete!"
echo ""
echo "🔍 To verify API is working, test these endpoints:"
echo "  - /api/customers/test"
echo "  - /api/products"
echo "  - /api/orders/stats"