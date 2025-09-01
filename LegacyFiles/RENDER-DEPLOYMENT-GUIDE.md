# 🚀 Step 2: Render Backend Deployment Guide

## ✅ Prerequisites Complete:
- ✅ Supabase database with all tables created
- ✅ PostgreSQL connection string ready
- ✅ Azure-compatible environment variables prepared
- ✅ Database abstraction layer will auto-detect PostgreSQL

## 📋 Render Deployment Steps

### 1. Create Render Account
1. **Go to:** [render.com](https://render.com)
2. **Sign up** with GitHub (recommended for easy repo connection)
3. **Verify email** if required

### 2. Connect Your Repository
1. **Click "New +"** in Render dashboard
2. **Select "Web Service"**
3. **Connect GitHub repository:** `GamesRaffle2`
4. **Grant repository access** when prompted

### 3. Configure Web Service
**Basic Settings:**
- **Name:** `gamesraffle-backend`
- **Environment:** `Node`
- **Region:** `Oregon (US West)` (good performance)
- **Branch:** `main` 
- **Root Directory:** `backend` (IMPORTANT!)
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### 4. Environment Variables (CRITICAL!)
**Copy these EXACT variables from [`CUSTOM-MIGRATION-ENV.md`](CUSTOM-MIGRATION-ENV.md):**

```bash
NODE_ENV=production
PORT=8000

# 🔑 SAME SECRETS AS AZURE (for token compatibility)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=development-super-secret-session-key-at-least-32-characters-long-for-games-raffle

# Database connection (YOUR SUPABASE CONNECTION)
SQL_CONNECTION_STRING=postgresql://postgres:SurvivorApp2024!@db.pcqwodmgcstlburfpwfy.supabase.co:5432/postgres

# Cache configuration (using memory instead of Redis)
USE_MEMORY_CACHE=true
REDIS_ENABLED=false

# CORS (update with your future Netlify URL)
CORS_ORIGINS=https://your-app-name.netlify.app

# Email settings (keeping same as Azure)
EMAIL_ENABLED=true
EMAIL_PROVIDER=gmail
GMAIL_USER=ltorres321@gmail.com
GMAIL_APP_PASSWORD=julpffmvigthdspx

# SMS disabled for free tier
SMS_ENABLED=false
```

### 5. Deploy and Test
1. **Click "Create Web Service"**
2. **Wait for build** (5-10 minutes first time)
3. **Check build logs** for any errors
4. **Test your API endpoints** once deployed

## 🎯 Success Indicators

**You'll know it worked when:**
- ✅ Build completes without errors
- ✅ Service shows "Live" status  
- ✅ You get a Render URL like: `https://gamesraffle-backend.onrender.com`
- ✅ API responds to health check: `https://your-url.onrender.com/api/health`

## 🚨 Common Issues & Solutions

**Build fails:** 
- Check that Root Directory = `backend`
- Verify `package.json` exists in backend folder

**Database connection errors:**
- Verify SQL_CONNECTION_STRING matches your Supabase exactly
- Check all environment variables are set

**CORS errors later:**
- Update CORS_ORIGINS with your actual Netlify URL after Step 3

---

**After Render deployment succeeds, you're ready for Step 3: Netlify Frontend!**