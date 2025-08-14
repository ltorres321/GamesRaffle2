# ✅ FREE MIGRATION CHECKLIST

## 🚨 IMPORTANT: NO SCRIPTS TO RUN LOCALLY!

The migration to free hosting is done through **web dashboards only**. You don't run any scripts on your computer - everything happens in the cloud platforms' web interfaces.

## 📋 EXACT STEPS TO FOLLOW (30 minutes)

### ⏱️ PHASE 1: Database Setup (10 minutes)

#### Step 1: Create Supabase Account
1. Go to **https://supabase.com**
2. Click "Start your project"
3. Sign up with your **GitHub account** (easiest option)
4. Create new project:
   - **Name**: `gamesraffle-db`
   - **Password**: Generate strong password (save it!)
   - **Region**: East US 
   - Click "Create new project"
5. **Wait 2-3 minutes** for database setup

#### Step 2: Import Database Schema
1. In Supabase dashboard, go to **"SQL Editor"** tab
2. Open the file `database/migrate-to-postgresql.sql` (I created this for you)
3. **Copy all contents** and paste into SQL Editor
4. Click **"Run"** to create all tables
5. Go to **Settings > Database** and copy the connection string

### ⏱️ PHASE 2: Backend Deployment (10 minutes)

#### Step 3: Create Render Account
1. Go to **https://render.com**
2. Click "Get Started" and sign up with **GitHub**
3. Click **"New"** → **"Web Service"**
4. Click **"Connect account"** to link GitHub
5. Select your **"GamesRaffle2"** repository
6. Configure deployment:
   - **Name**: `gamesraffle-backend`
   - **Region**: US East
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node src/server.js`
   - **Instance Type**: Free

#### Step 4: Set Environment Variables in Render
1. In your Render service, go to **"Environment"** tab
2. Add these variables:
```
NODE_ENV=production
PORT=8000
SQL_CONNECTION_STRING=postgresql://[paste-from-supabase-settings]
JWT_SECRET=your-strong-jwt-secret-32-chars-minimum
SESSION_SECRET=your-strong-session-secret-32-chars-minimum
USE_MEMORY_CACHE=true
REDIS_ENABLED=false
CORS_ORIGINS=https://your-app-name.netlify.app
```
3. Click **"Save Changes"**
4. Wait for automatic deployment

### ⏱️ PHASE 3: Frontend Deployment (10 minutes)

#### Step 5: Create Netlify Account
1. Go to **https://netlify.com**
2. Click "Sign up" and choose **GitHub**
3. Click **"Add new site"** → **"Import an existing project"**
4. Choose **GitHub** and select **"GamesRaffle2"**
5. Configure build:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/.next`
   - **Branch**: `main`
6. Click **"Deploy site"**

#### Step 6: Update Frontend Configuration
1. In Netlify, go to **"Site settings"** → **"Environment variables"**
2. Add:
```
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```
3. Click **"Save"**
4. Go to **"Deploys"** and click **"Trigger deploy"**

## 🎯 SUMMARY OF WHAT HAPPENS

- **No local scripts**: Everything runs in cloud dashboards
- **Automatic deployments**: Connected to your GitHub repo
- **Free hosting**: Supabase (database) + Render (backend) + Netlify (frontend)
- **Total cost**: **$0/month** vs current $103/month

## 📁 FILES I CREATED FOR YOU

1. **[`FREE-MIGRATION-GUIDE.md`](FREE-MIGRATION-GUIDE.md)** - Detailed technical guide
2. **[`backend/src/config/supabase.js`](backend/src/config/supabase.js)** - PostgreSQL database connection
3. **[`database/migrate-to-postgresql.sql`](database/migrate-to-postgresql.sql)** - Database schema for Supabase
4. **[`frontend/.env.production.example`](frontend/.env.production.example)** - Environment variables template

## 🚀 AFTER MIGRATION

1. **Test your app** at the new URLs
2. **Keep Azure running** until everything works
3. **Cancel Azure services** once migration is confirmed
4. **Save $103/month!** 🎉

## ❓ WHICH OPTION SHOULD I CHOOSE?

**For immediate cost savings**: Follow this free migration checklist
**For staying on Azure**: Use the Azure cost-optimized scripts I created earlier

Both options will save you significant money, but the free option saves 100%!