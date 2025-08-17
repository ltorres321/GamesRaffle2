# Development Environment Setup

## Overview
- **main** branch = Production (stable, working version)
- **ltorres-1** branch = Development/Test (bug fixes, new features)

## Current Status

### Production Environment (main branch)
✅ **Frontend**: Netlify (auto-deploy from main)
✅ **Backend**: https://gamesraffle2.onrender.com (from main)
✅ **Database**: Supabase PostgreSQL (shared)

### Development Environment (ltorres-1 branch)
⚠️ **Frontend**: Needs separate Netlify site
⚠️ **Backend**: Needs new Render service
⚠️ **API Config**: Needs dev backend URL

## Setup Instructions

### 1. Create Development Backend on Render
1. Go to Render Dashboard
2. Create new Web Service
3. Connect to GitHub repo
4. Branch: `ltorres-1`
5. Name: `gamesraffle2-dev`
6. Build Command: `npm install`
7. Start Command: `npm start`
8. Environment Variables: (copy from production + add `NODE_ENV=development`)

### 2. Create Development Frontend on Netlify
1. Go to Netlify Dashboard
2. New site from Git
3. Connect to GitHub repo
4. Branch: `ltorres-1`
5. Build command: `npm run build`
6. Publish directory: `.next`
7. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://gamesraffle2-dev.onrender.com
   NODE_ENV=development
   ```

### 3. Update API Configuration
Update `frontend/src/config/api.ts` to detect branch:
```typescript
function getBackendURL(): string {
  // Development environment (ltorres-1 branch)
  if (process.env.NEXT_PUBLIC_ENV === 'development') {
    return 'https://gamesraffle2-dev.onrender.com';
  }
  
  // Production environment (main branch)
  if (process.env.NODE_ENV === 'production') {
    return 'https://gamesraffle2.onrender.com';
  }
  
  // Local development
  return 'http://localhost:8000';
}
```

## Workflow
1. Develop features on `ltorres-1` branch
2. Test on dev environment
3. When stable, merge `ltorres-1` → `main`
4. Production auto-deploys from `main`

## Current NFL Survivor Implementation
The NFL Survivor functionality is currently on `ltorres-1` branch:
- ✅ Complete backend API (`/api/survivor/*`)
- ✅ NFL 2024 historical data service
- ✅ Frontend integration
- ⚠️ Needs dev deployment to test