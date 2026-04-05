#!/bin/bash
# Database setup script for Finance Dashboard
# Run this to quickly set up PostgreSQL and apply migrations

echo "=== Finance Dashboard Database Setup ==="
echo ""

# Step 1: Copy environment file
echo "📋 Step 1: Setting up environment file..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✓ .env created from .env.example"
    echo "⚠️  Please edit .env and update DATABASE_URL with your PostgreSQL credentials"
    echo ""
    read -p "Press Enter after updating .env..."
else
    echo "✓ .env already exists"
fi

# Step 2: Generate Prisma client
echo ""
echo "🔧 Step 2: Generating Prisma client..."
npm run prisma:generate

# Step 3: Apply migrations
echo ""
echo "📊 Step 3: Applying database migrations..."
npm run prisma:migrate -- --name init

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Start the server: npm run dev"
echo "2. Visit: http://localhost:4000/api-docs"
echo "3. Test endpoints in Swagger UI"
echo ""
