#!/bin/bash

echo "🚀 Setting up Cloudflare Images integration..."

# Environment variables for Railway
echo "
📋 Copy these environment variables to Railway (https://railway.app):

CLOUDFLARE_ACCOUNT_ID=ea644c4a47a499ad4721449cbac587f4
CLOUDFLARE_API_TOKEN=feda0b5504010de502b702700c9e403680105

"

# Environment variables for Vercel
echo "📋 Copy these environment variables to Vercel (https://vercel.com):

VITE_CLOUDFLARE_ACCOUNT_ID=ea644c4a47a499ad4721449cbac587f4
VITE_CLOUDFLARE_IMAGES_API_KEY=feda0b5504010de502b702700c9e403680105
VITE_CLOUDFLARE_IMAGES_ACCOUNT_HASH=QI-O2U_ayTU_H_Ilcb4c6Q
VITE_CLOUDFLARE_IMAGE_DELIVERY_URL=https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q

"

# Create local .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

# Add Cloudflare vars to .env if not present
if ! grep -q "CLOUDFLARE_ACCOUNT_ID" .env; then
    echo "" >> .env
    echo "# Cloudflare Images Configuration" >> .env
    echo "CLOUDFLARE_ACCOUNT_ID=\"ea644c4a47a499ad4721449cbac587f4\"" >> .env
    echo "CLOUDFLARE_API_TOKEN=\"feda0b5504010de502b702700c9e403680105\"" >> .env
    echo "✅ Added Cloudflare variables to .env"
fi

echo "
🎯 Next Steps:
1. Add the Railway environment variables above to your Railway project
2. Add the Vercel environment variables above to your Vercel project
3. Restart both Railway and Vercel deployments
4. Test image upload functionality

💡 Testing locally:
- Make sure backend is running: npm run dev
- Frontend should connect to backend on port 8000
"