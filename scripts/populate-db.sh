#!/bin/bash

echo "🌱 Populating database with production data..."

# Check if database is empty
PRODUCT_COUNT=$(npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.count().then(count => {
  console.log(count);
  process.exit(0);
}).catch(() => {
  console.log(0);
  process.exit(0);
});
")

if [ "$PRODUCT_COUNT" -gt "0" ]; then
  echo "✅ Database already has $PRODUCT_COUNT products"
  exit 0
fi

echo "📦 Running production seed..."
npm run db:seed:production

echo "✅ Database populated successfully!"