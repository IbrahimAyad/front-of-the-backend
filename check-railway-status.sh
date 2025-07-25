#!/bin/bash

echo "🔍 Checking Railway deployment status..."
echo ""

echo "📋 Quick fixes to try:"
echo ""

echo "1. Check Railway deployment logs for errors"
echo "   - Look for database connection errors"
echo "   - Check if the app crashed on startup"
echo ""

echo "2. The DATABASE_URL might have an issue. Try this instead:"
echo "   DATABASE_URL=\"\${{Postgres.DATABASE_URL}}\""
echo "   (Remove the ?connection_limit=5&pool_timeout=10 for now)"
echo ""

echo "3. Or use the direct URL with parameters:"
echo "   DATABASE_URL=\"postgresql://postgres:DnXmjiyxUQqPjVSXBHXyYxcTccUPdkrx@junction.proxy.rlwy.net:28388/railway?connection_limit=5&pool_timeout=10\""
echo ""

echo "4. Common Railway deployment issues:"
echo "   - Database connection string malformed"
echo "   - App crashed during startup"
echo "   - Port binding failed"
echo ""

echo "🚨 The 502 error means Railway's proxy can't reach your backend"
echo "   This usually means the app crashed on startup"
echo ""

echo "📝 To debug:"
echo "1. Go to Railway dashboard"
echo "2. Click on your backend service"
echo "3. Go to 'Deployments' tab"
echo "4. Click on the latest deployment"
echo "5. Check the logs for error messages"