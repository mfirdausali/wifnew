#!/bin/bash

# Setup script for Multi-Role Authentication System

echo "🚀 Setting up Multi-Role Authentication System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ and try again."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Copy environment files
echo "📋 Setting up environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
else
    echo "⚠️  .env already exists, skipping..."
fi

if [ ! -f frontend/.env.local ]; then
    echo "# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production

# Environment
NODE_ENV=development" > frontend/.env.local
    echo "✅ Created frontend/.env.local"
fi

if [ ! -f backend/.env ]; then
    echo "# Database Configuration
DATABASE_URL=postgresql://postgres:localpass@localhost:5432/authdb

# Redis Configuration
REDIS_URL=redis://:localpass@localhost:6379

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Email Configuration (optional for development)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@localhost

# Logging
LOG_LEVEL=debug" > backend/.env
    echo "✅ Created backend/.env"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Running database migrations..."
cd backend && npx prisma migrate dev --name init && cd ..

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd backend && npx prisma generate && cd ..

# Seed the database
echo "🌱 Seeding the database..."
cd backend && npm run db:seed && cd ..

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the development servers, run:"
echo "   npm run dev"
echo ""
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend API will be available at: http://localhost:5000"
echo ""
echo "👤 Default admin credentials:"
echo "   Email: admin@localhost"
echo "   Password: admin123"