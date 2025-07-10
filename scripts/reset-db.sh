#!/bin/bash

# Database reset script

echo "⚠️  WARNING: This will reset the entire database!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo "🗑️  Resetting database..."

# Navigate to backend directory
cd backend

# Reset the database
npx prisma migrate reset --force

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed the database
echo "🌱 Seeding the database..."
npm run db:seed

echo "✅ Database reset complete!"