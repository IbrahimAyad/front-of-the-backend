#!/bin/bash

# Fix Local Development Server Issues
echo "🔧 Fixing local development server issues..."

# Kill any hanging Node/TSX processes
echo "🚫 Killing any hanging server processes..."
pkill -f "tsx src/server.ts" 2>/dev/null || true
pkill -f "node.*8000" 2>/dev/null || true
pkill -f "node.*8001" 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 2

# Clear any port conflicts
echo "🧹 Checking for port conflicts..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:8001 | xargs kill -9 2>/dev/null || true

# Clear nodemon cache
echo "🗑️ Clearing nodemon cache..."
rm -rf node_modules/.cache 2>/dev/null || true

# Restart with clean environment
echo "🚀 Starting clean development server..."
npm run dev

echo "✅ Local development server should now start without multipart errors!" 