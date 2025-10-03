#!/bin/bash

echo "🚀 GitHub Commits Tracker Setup Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Please edit the .env file and add your GitHub OAuth credentials${NC}"
    echo "1. Go to https://github.com/settings/developers"
    echo "2. Create a new OAuth App"
    echo "3. Add your Client ID and Client Secret to the .env file"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker and run this script again"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if GitHub credentials are set
source .env
if [ "$GITHUB_CLIENT_ID" = "your_github_client_id" ] || [ "$GITHUB_CLIENT_SECRET" = "your_github_client_secret" ]; then
    echo -e "${RED}❌ GitHub OAuth credentials not configured${NC}"
    echo "Please update the .env file with your actual GitHub OAuth credentials"
    echo ""
    echo "Quick setup:"
    echo "1. Go to: https://github.com/settings/developers"
    echo "2. Click 'New OAuth App'"
    echo "3. Use these settings:"
    echo "   - Homepage URL: http://localhost:5173"
    echo "   - Callback URL: http://localhost:3000/api/auth/github/callback"
    echo "4. Copy Client ID and Client Secret to .env file"
    exit 1
fi

echo -e "${GREEN}✅ GitHub OAuth credentials configured${NC}"
echo ""

# Ask user if they want to start the application
echo "Ready to start the application!"
echo ""
read -p "Do you want to start with Docker Compose? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🐳 Starting Docker Compose..."
    echo "This will:"
    echo "  - Start PostgreSQL database"
    echo "  - Start Redis for job queuing"
    echo "  - Build and start the backend (NestJS)"
    echo "  - Build and start the frontend (Vue.js)"
    echo "  - Run database migrations"
    echo ""
    
    docker-compose up --build
else
    echo ""
    echo "To start the application later, run:"
    echo "  docker-compose up --build"
    echo ""
    echo "Or for local development:"
    echo "  1. Start services: docker-compose up postgres redis"
    echo "  2. Backend: cd backend && npm install && npm run start:dev"
    echo "  3. Frontend: cd frontend && npm install && npm run dev"
fi

