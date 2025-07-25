#!/bin/bash

echo "🚀 Starting development environment..."

# Kill any existing processes
echo "🔧 Cleaning up existing processes..."
pkill -f "nodemon --exec tsx src/server.ts" || true
pkill -f "vite --port 3001" || true
sleep 2

# Start backend
echo "🖥️  Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
  if curl -s http://localhost:8000/api/products > /dev/null 2>&1; then
    echo "✅ Backend is ready!"
    break
  fi
  sleep 1
done

# Check if database needs seeding
echo "🔍 Checking database..."
./scripts/populate-db.sh

# Start frontend
echo "🎨 Starting frontend..."
npm run dev:frontend &
FRONTEND_PID=$!

echo ""
echo "✅ Development environment started!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait