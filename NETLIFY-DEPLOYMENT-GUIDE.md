# Netlify Frontend Deployment Guide

## Prerequisites
✅ Backend deployed and running on Render: https://gamesraffle2.onrender.com/health
✅ Database migrated to Supabase PostgreSQL with all tables and data
✅ Frontend configured with Netlify deployment settings

## Netlify Deployment Steps

### 1. Create Netlify Account
- Go to [https://netlify.com](https://netlify.com)
- Sign up or log in with GitHub account

### 2. Deploy from GitHub Repository
1. Click **"New site from Git"**
2. Choose **"GitHub"** as provider
3. Authorize Netlify to access your GitHub account
4. Select repository: **`ltorres321/GamesRaffle2`**
5. Select branch: **`ltorres-1`**

### 3. Configure Build Settings
```
Base directory: frontend
Build command: npm run build
Publish directory: frontend/out
```

### 4. Environment Variables
Add these environment variables in Netlify dashboard:
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://gamesraffle2.onrender.com
NEXT_TELEMETRY_DISABLED=1
```

### 5. Deploy Site
1. Click **"Deploy site"**
2. Wait for build to complete (usually 2-3 minutes)
3. Note your Netlify URL (will be something like: `https://amazing-app-123456.netlify.app`)

## Post-Deployment Tasks

### Update CORS Settings
Once you have your Netlify URL, update Render backend CORS settings:

1. Go to Render dashboard: https://render.com
2. Select your **gamesraffle2** service
3. Go to **Environment** tab
4. Update `CORS_ORIGINS` variable:
   ```
   CORS_ORIGINS=https://your-netlify-url.netlify.app,https://localhost:3000
   ```
5. Save changes (this will redeploy the backend)

### Test Complete Migration
1. Visit your Netlify URL
2. Test user registration/login
3. Verify authentication state persistence
4. Test API calls to Render backend
5. Confirm JWT token compatibility with existing Azure users

## Expected Netlify URL Format
Your Netlify URL will look like:
- `https://[random-words-123456].netlify.app` (auto-generated)
- Or you can set a custom subdomain like: `https://gamesraffle2.netlify.app`

## Troubleshooting

### Build Issues
- Check build logs for dependency errors
- Verify Node.js version compatibility
- Ensure all dependencies are in `package.json`

### Runtime Issues
- Check browser console for API connection errors
- Verify environment variables are set correctly
- Test backend health: https://gamesraffle2.onrender.com/health

### CORS Issues
- Ensure Netlify URL is added to backend CORS_ORIGINS
- Check both HTTP and HTTPS protocols if needed

## Cost Confirmation
✅ **Netlify**: Free tier (up to 100GB bandwidth, 300 build minutes)
✅ **Render**: Free tier backend (750 hours/month)
✅ **Supabase**: Free tier database (500MB storage, 2GB bandwidth)

**Total Monthly Cost: $0** 🎉

## Next Steps After Deployment
1. Update CORS settings with actual Netlify URL
2. Test complete application functionality
3. Verify Azure JWT token compatibility
4. Monitor performance and uptime
5. Set up custom domain if desired

## Migration Success Metrics
- ✅ Frontend loads successfully from Netlify
- ✅ API calls work between Netlify → Render
- ✅ Database operations work via Render → Supabase
- ✅ Authentication flow maintains Azure token compatibility
- ✅ Cost reduced from $103/month → $0/month