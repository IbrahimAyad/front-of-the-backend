#!/bin/bash

echo "🔧 Fixing immediate issues..."
echo ""

# 1. Remove mock products
echo "📦 Removing mock products..."
echo "Run this command after your Railway backend is deployed:"
echo ""
echo "curl -X POST https://front-of-the-backend-production.up.railway.app/api/cleanup/mock-products"
echo ""

# 2. Test Cloudflare configuration
echo "🖼️ Testing Cloudflare configuration..."
echo "Check Railway logs after deployment to see if these environment variables are set:"
echo "- CLOUDFLARE_ACCOUNT_ID"
echo "- CLOUDFLARE_API_TOKEN"
echo ""

# 3. Deployment steps
echo "🚀 Deployment steps:"
echo "1. Add these to Railway environment variables:"
echo "   CLOUDFLARE_ACCOUNT_ID=ea644c4a47a499ad4721449cbac587f4"
echo "   CLOUDFLARE_API_TOKEN=feda0b5504010de502b702700c9e403680105"
echo ""
echo "2. Deploy to Railway (it will restart automatically)"
echo ""
echo "3. Check Railway logs for any errors"
echo ""
echo "4. Remove mock products using the curl command above"
echo ""
echo "5. Try uploading an image again"
echo ""

# 4. Debug info
echo "📝 To debug image upload issues:"
echo "1. Open browser developer console"
echo "2. Try uploading an image"
echo "3. Look for network requests to /api/cloudflare/upload"
echo "4. Check the response for error details"
echo ""
echo "5. Also check Railway logs for '🔧 Cloudflare Config:' and '📸 Cloudflare API Response:'"
echo ""

echo "✅ The code has been updated with better error handling and logging"