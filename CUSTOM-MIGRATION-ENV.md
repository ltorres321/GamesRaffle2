# 🔐 YOUR CUSTOM MIGRATION ENVIRONMENT VARIABLES

## 🚨 CRITICAL: USE SAME JWT_SECRET & SESSION_SECRET AS AZURE

**⚠️ MANDATORY FOR SEAMLESS MIGRATION: The JWT_SECRET and SESSION_SECRET below are the EXACT values from your current Azure backend. Using different values will break all existing user tokens and force users to log out/back in.**

## ✅ EXACT AZURE SECRETS FOR TOKEN COMPATIBILITY

Use these **EXACT** environment variables in Step 4 of the migration to ensure existing user tokens continue working:

### For Render Backend Deployment (Step 4):

```bash
NODE_ENV=production
PORT=8000

# 🔑 REAL AZURE PRODUCTION SECRETS (for token compatibility)
JWT_SECRET=83548a67ee6226b675a1ef152dab664e6c4857bca6c666bdc3b6d64ef6fa9663
SESSION_SECRET=aabfef2273c71e4d4948adbfaee91fc4a17de9d795002bceadb82b5dededa778

# Database connection (FROM YOUR SUPABASE PROJECT)
SQL_CONNECTION_STRING=postgresql://postgres:SurvivorApp2024!@db.pcqwodmgcstlburfpwfy.supabase.co:5432/postgres

# Cache configuration (using memory instead of Redis)
USE_MEMORY_CACHE=true
REDIS_ENABLED=false

# CORS (for now, use a placeholder - update with your actual Netlify URL after Step 3)
CORS_ORIGINS=https://your-netlify-app.netlify.app

# Email settings (keeping same as Azure)
EMAIL_ENABLED=true
EMAIL_PROVIDER=gmail
GMAIL_USER=ltorres321@gmail.com
GMAIL_APP_PASSWORD=julpffmvigthdspx

# SMS disabled for free tier
SMS_ENABLED=false
```

## 🎯 STEP-BY-STEP USAGE

1. **Follow MIGRATION-CHECKLIST.md** (your primary migration guide)
2. **In "Step 2: Render Backend Deployment"**, use the variables above
3. **Replace only these placeholders:**
   - `SQL_CONNECTION_STRING` → Get from Supabase setup
   - `CORS_ORIGINS` → Get from Netlify deployment
4. **Keep everything else exactly as shown above**

## ✅ BENEFITS OF USING SAME SECRETS

- **Existing user sessions continue working**
- **Users don't need to log in again**
- **Seamless migration experience**
- **Tokens remain valid across platforms**

## 🚨 IMPORTANT NOTES

- These secrets will be entered in **Render's web dashboard**, not in your code
- Azure and Render are completely separate - no conflicts
- You can test the new platform while Azure keeps running
- Only switch DNS when you're ready

---

**Next Step**: Follow **MIGRATION-CHECKLIST.md** starting with "Step 1: Supabase Database Setup"!