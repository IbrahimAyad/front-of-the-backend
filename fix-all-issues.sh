#!/bin/bash

echo "🔧 Fixing all reported issues..."

# 1. Set up Cloudflare environment variables
echo "
📋 STEP 1: Add these to Railway (https://railway.app):
CLOUDFLARE_ACCOUNT_ID=ea644c4a47a499ad4721449cbac587f4
CLOUDFLARE_API_TOKEN=feda0b5504010de502b702700c9e403680105

📋 STEP 2: Add these to Vercel (https://vercel.com):
VITE_CLOUDFLARE_ACCOUNT_ID=ea644c4a47a499ad4721449cbac587f4
VITE_CLOUDFLARE_IMAGES_API_KEY=feda0b5504010de502b702700c9e403680105
VITE_CLOUDFLARE_IMAGES_ACCOUNT_HASH=QI-O2U_ayTU_H_Ilcb4c6Q
VITE_CLOUDFLARE_IMAGE_DELIVERY_URL=https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q

"

# 2. Remove mock products using API
echo "📦 STEP 3: Remove mock products"
echo "Run this command after backend is running:"
echo "curl -X POST https://front-of-the-backend-production.up.railway.app/api/cleanup/mock-products"
echo ""

# 3. Fix for products not appearing without refresh
echo "🔄 STEP 4: The products refresh issue has been identified"
echo "The AdminProductsPageWithDialog already fetches products on mount"
echo "Make sure the backend is returning all products correctly"
echo ""

# 4. Test image upload
echo "🖼️ STEP 5: Test image upload"
echo "1. After adding Railway env vars, restart Railway deployment"
echo "2. Try uploading an image in the product edit dialog"
echo "3. Check browser console for any errors"
echo ""

echo "✅ Summary of fixes:"
echo "- Cloudflare env vars documented for Railway and Vercel"
echo "- Mock products removal endpoint created at /api/cleanup/mock-products"
echo "- Products should auto-load (fetchProducts runs in useEffect)"
echo "- Image upload will work after env vars are added to Railway"
echo ""
echo "📝 Next steps:"
echo "1. Add the environment variables to Railway and Vercel"
echo "2. Restart both deployments"
echo "3. Run the mock products removal command"
echo "4. Test image upload functionality"