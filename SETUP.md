# Setup Guide

This guide will walk you through setting up the GitHub Commits Tracker application.

## Step 1: GitHub OAuth Application Setup

1. Navigate to https://github.com/settings/developers
2. Click "OAuth Apps" in the left sidebar
3. Click "New OAuth App"
4. Fill in the form:
   ```
   Application name: GitHub Commits Tracker
   Homepage URL: http://localhost:5173
   Application description: Track commits from starred repositories
   Authorization callback URL: http://localhost:3000/api/auth/github/callback
   ```
5. Click "Register application"
6. You'll see your **Client ID** on the next page
7. Click "Generate a new client secret"
8. **IMPORTANT**: Copy both the Client ID and Client Secret immediately

## Step 2: Configure Environment Variables

1. Open the `.env` file in the root directory
2. Replace the placeholder values:
   ```env
   GITHUB_CLIENT_ID="paste_your_client_id_here"
   GITHUB_CLIENT_SECRET="paste_your_client_secret_here"
   ```
3. Optionally change the JWT_SECRET to a random string:
   ```env
   JWT_SECRET="your-own-random-secret-string"
   ```

## Step 3: Start the Application

### Option A: Using Docker (Recommended)

```bash
# Make sure Docker is running
docker --version
docker-compose --version

# Start all services
docker-compose up --build
```

Wait for all services to start. You'll see:
- ✅ PostgreSQL ready
- ✅ Redis ready
- ✅ Backend running on port 3000
- ✅ Frontend running on port 5173

### Option B: Local Development

**Terminal 1 - Database & Redis:**
```bash
docker run -d --name github-app-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=github_app postgres:15-alpine
docker run -d --name github-app-redis -p 6379:6379 redis:7-alpine
```

**Terminal 2 - Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Step 4: Access the Application

1. Open your browser to: http://localhost:5173
2. Click "Sign in with GitHub"
3. Authorize the application
4. You'll be redirected to your dashboard
