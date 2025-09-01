# 🎯 Render Plan & Configuration Guide

## ✅ **USE FREE TIER - PERFECT FOR YOUR MIGRATION**

### SSH Access Question - **NOT NEEDED!**
- ✅ **SSH is NOT required** for web service deployment
- ✅ Render automatically deploys from your GitHub repository  
- ✅ All configuration done through web interface
- ✅ Free tier has everything you need for backend deployment

### Plan Recommendation: **FREE ($0/month)**
**Why Free tier is perfect:**
- ✅ **512 MB RAM** - Sufficient for Node.js backend
- ✅ **0.1 CPU** - Adequate for your current usage
- ✅ **Supports your $0/month cost goal** 
- ✅ **Can upgrade anytime** if more performance needed later
- ✅ **Perfect for testing migration** before switching DNS

## 🔧 Configuration Settings (Based on Your Screenshot)

### Basic Settings:
- **Name**: `GamesRaffle2` (as shown)
- **Language**: `Node` ✅
- **Branch**: `main` ✅  
- **Region**: `Oregon (US West)` ✅
- **Root Directory**: `backend` (CRITICAL - must set this!)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Instance Type:
**Select: "Free" - $0/month**

## 🚨 CRITICAL: Environment Variables Setup

**Environment variables are NOT automatically copied from Azure - you MUST add them manually!**

### Step-by-Step Environment Variables:

**In the "Environment Variables" section shown in your screenshot:**

1. **Click "+ Add Environment Variable"**
2. **Add EACH variable separately:**

```bash
Name: NODE_ENV
Value: production

Name: PORT  
Value: 8000

Name: JWT_SECRET
Value: your-super-secret-jwt-key-change-this-in-production

Name: SESSION_SECRET
Value: development-super-secret-session-key-at-least-32-characters-long-for-games-raffle

Name: SQL_CONNECTION_STRING
Value: postgresql://postgres:SurvivorApp2024!@db.pcqwodmgcstlburfpwfy.supabase.co:5432/postgres

Name: USE_MEMORY_CACHE
Value: true

Name: REDIS_ENABLED
Value: false

Name: CORS_ORIGINS
Value: https://your-app-name.netlify.app

Name: EMAIL_ENABLED
Value: true

Name: EMAIL_PROVIDER
Value: gmail

Name: GMAIL_USER
Value: ltorres321@gmail.com

Name: GMAIL_APP_PASSWORD
Value: julpffmvigthdspx

Name: SMS_ENABLED
Value: false
```

## ⚙️ Advanced Settings (Optional)

**You can use defaults for:**
- **Health Check Path**: `/api/health` (optional)
- **Auto-Deploy**: `On Commit` (recommended)
- **Build Filters**: Leave empty (deploy all changes)

## 🚀 Deploy Process

1. **Configure all settings above**
2. **Click "Deploy Web Service"**  
3. **Wait for build** (first deployment takes 5-10 minutes)
4. **Check build logs** for any errors
5. **Test your API** once live

## 🎯 Success Indicators

**You'll know it worked when:**
- ✅ Build shows "Live" status
- ✅ You get a URL like: `https://gamesraffle2.onrender.com`
- ✅ API health check responds: `https://your-url.onrender.com/api/health`
- ✅ Database abstraction layer connects to PostgreSQL automatically

## 💰 Cost Savings

**Free Render Backend**: $0/month vs Azure App Service: ~$67/month = **$67/month saved!**

**After successful deployment, you're ready for Step 3: Netlify Frontend!**