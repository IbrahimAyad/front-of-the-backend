#!/bin/bash

echo "🧪 Testing Railway Deployment..."
echo ""

# Test health endpoint
echo "1️⃣ Testing health endpoint..."
curl -s https://front-of-the-backend-production.up.railway.app/health | jq '.' || echo "❌ Health check failed"
echo ""

# Test database health
echo "2️⃣ Testing database connection..."
curl -s https://front-of-the-backend-production.up.railway.app/health/database | jq '.' || echo "❌ Database check failed"
echo ""

# Test mock products removal
echo "3️⃣ Testing mock products cleanup..."
curl -X POST https://front-of-the-backend-production.up.railway.app/api/cleanup/mock-products \
  -H "Content-Type: application/json" | jq '.' || echo "❌ Mock cleanup failed"
echo ""

echo "✅ If all tests pass, you can:"
echo "1. Login to the admin dashboard"
echo "2. Click 'Remove Mock Products' button"
echo "3. Try uploading an image"
echo "4. Products should refresh automatically"
echo ""
echo "🔍 Check for:"
echo "- No WebSocket errors in console"
echo "- Products appear without manual refresh"
echo "- Image uploads work without getting stuck at 90%"