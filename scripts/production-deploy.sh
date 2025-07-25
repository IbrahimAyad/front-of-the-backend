#!/bin/bash

echo "🚀 Production Deployment Script"
echo "==============================="

# Exit on any error
set -e

# 1. Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from project root directory"
  exit 1
fi

# 2. Run build to catch any TypeScript errors
echo "📦 Building application..."
npm run build

# 3. Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# 4. Create migration if schema changed
echo "🗄️  Checking for schema changes..."
npx prisma migrate dev --name auto_migration --create-only

# Check if new migration was created
LATEST_MIGRATION=$(ls -t prisma/migrations | head -1)
if [ "$LATEST_MIGRATION" != "migration_lock.toml" ]; then
  echo "📝 New migration detected: $LATEST_MIGRATION"
  echo "   Review the migration before deploying!"
  cat "prisma/migrations/$LATEST_MIGRATION/migration.sql"
  echo ""
  read -p "Does this migration look correct? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
  fi
fi

# 5. Deploy to Railway
echo "🚂 Deploying to Railway..."
echo "   This will:"
echo "   - Deploy the latest code"
echo "   - Run migrations automatically"
echo "   - Seed the database if empty"

railway up

echo "✅ Deployment complete!"
echo ""
echo "Post-deployment checklist:"
echo "[ ] Check Railway logs for any errors"
echo "[ ] Verify migrations ran successfully"
echo "[ ] Test the production site"
echo "[ ] Monitor for any 500 errors"