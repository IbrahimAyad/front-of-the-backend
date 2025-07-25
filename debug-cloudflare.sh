#!/bin/bash

echo "🔍 Debugging Cloudflare Upload Issue..."
echo ""

# Test if the cloudflare routes are accessible
echo "1️⃣ Testing if Cloudflare routes exist..."
curl -I https://front-of-the-backend-production.up.railway.app/api/cloudflare/upload 2>&1 | head -10
echo ""

echo "2️⃣ The 90% stuck issue means:"
echo "   - Frontend sends the file successfully"
echo "   - Backend receives the file"
echo "   - But Cloudflare API call fails or times out"
echo ""

echo "3️⃣ Check Railway logs for:"
echo "   🔧 Cloudflare Config: (should show account ID and API key)"
echo "   📸 Cloudflare API Response: (should show success/error)"
echo ""

echo "4️⃣ Common causes:"
echo "   - API Token incorrect or missing permissions"
echo "   - Account ID incorrect"
echo "   - Cloudflare API endpoint blocked by Railway"
echo ""

echo "5️⃣ To verify Cloudflare credentials work, run locally:"
echo "   node test-cloudflare-direct.js"
echo ""

echo "📝 Action items:"
echo "1. Check Railway logs during upload attempt"
echo "2. Look for '🔧 Cloudflare Config:' in logs"
echo "3. Share any error messages from logs"