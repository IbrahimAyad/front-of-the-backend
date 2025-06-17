#!/bin/bash

echo "🔧 Setting up KCT Development Environment..."

# Create .env file with secure configuration
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/kct_menswear"

# JWT Configuration
JWT_SECRET="d69f1ce5a19930ad98d51f7b28a97e573d41be8b1420c4fdda26b77b3e1af8b613d089709da20ea6fc07fa45bf5ab0002c4fdda26b77b3e1af8b613d089709da20ea6fc07fa45bf5ab000"
JWT_REFRESH_SECRET="72bde19cc0028c5166a4218049bab842fadb9630aa34a3cf29cf320917cd440bcca03da675e10b9cb11d8deb55c28c5166a4218049bab842fadb9630aa34a3cf29cf320917cd440"

# Server Configuration
PORT=8000
NODE_ENV=development
USE_MOCK_DATA=false

# Frontend Configuration (for CORS)
FRONTEND_URL="http://localhost:3001"

# Upload Configuration
UPLOAD_MAX_SIZE=10485760

# OpenAI Configuration (get new key from https://platform.openai.com/api-keys)
OPENAI_API_KEY="your-new-openai-key-here"

# Google API Configuration (get new key from https://console.cloud.google.com/)
GOOGLE_API_KEY="your-new-google-key-here"
EOF

# Create .env.local (copy of .env for Vite)
cp .env .env.local

# Add Vite-specific variables to .env.local
cat >> .env.local << 'EOF'

# Vite Frontend Configuration
VITE_API_BASE_URL="http://localhost:8000"
VITE_WS_BASE_URL="ws://localhost:8000/ws"
VITE_FRONTEND_URL="http://localhost:3001"
VITE_USE_MOCK_DATA="false"
VITE_NODE_ENV="development"
VITE_ADMIN_EMAIL="admin@kctmenswear.com"
VITE_ADMIN_PASSWORD="admin123"
EOF

echo "✅ Environment files created successfully!"

# Kill any existing processes on ports 8000-8010
echo "🔧 Cleaning up existing processes..."
for port in {8000..8010}; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done

# Kill nodemon and tsx processes
pkill -f "nodemon" 2>/dev/null || true
pkill -f "tsx src/server.ts" 2>/dev/null || true

echo "✅ Processes cleaned up!"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "⚠️  PostgreSQL is not running. Please start PostgreSQL:"
    echo "   - Docker: docker start kct-postgres"
    echo "   - Homebrew: brew services start postgresql@14"
    echo "   - Manual: pg_ctl -D /usr/local/var/postgresql@14 start"
    exit 1
fi

echo "✅ PostgreSQL is running!"

# Run database migrations
echo "🔧 Running database migrations..."
npx prisma migrate deploy

# Seed database
echo "🌱 Seeding database..."
npx prisma db seed || echo "⚠️  Database seeding skipped (may already be seeded)"

echo ""
echo "🎉 Setup complete! You can now start the servers:"
echo ""
echo "Terminal 1 (Backend):"
echo "  npm run start:dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  npm run dev:frontend"
echo ""
echo "🔑 Login credentials:"
echo "  Email: admin@kctmenswear.com"
echo "  Password: admin123"
echo ""
echo "📝 Next steps:"
echo "  1. Get new OpenAI API key: https://platform.openai.com/api-keys"
echo "  2. Get new Google API key: https://console.cloud.google.com/"
echo "  3. Update .env file with your new API keys"
echo "" 