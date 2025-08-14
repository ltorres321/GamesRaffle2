# 🆓 COMPLETE FREE MIGRATION GUIDE

## ❗ IMPORTANT: These Are NOT Azure Services!

The platforms I mentioned are **competing cloud providers** that offer generous free tiers:

- **Railway, Render, Fly.io** = Backend hosting (competitors to Azure App Service)
- **PlanetScale, Supabase, Neon** = Database hosting (competitors to Azure SQL)
- **Vercel, Netlify** = Frontend hosting (competitors to Azure Static Web Apps)

You'll need to create accounts on these platforms (they're free to sign up).

## 🎯 RECOMMENDED STACK: Render + Supabase + Netlify

**Why this combination?**
- ✅ Most generous free tiers
- ✅ Easy setup (no credit card required initially)
- ✅ PostgreSQL database (modern)
- ✅ Built-in authentication features
- ✅ Excellent documentation

## 📋 STEP-BY-STEP MIGRATION (30 minutes)

### Phase 1: Setup Database (10 minutes)

#### Step 1: Create Supabase Account & Database
```bash
# 1. Go to https://supabase.com
# 2. Click "Start your project" 
# 3. Sign up with GitHub (easiest)
# 4. Create new project:
#    - Name: "gamesraffle-db"
#    - Password: (generate strong password - save it!)
#    - Region: East US
# 5. Wait 2-3 minutes for setup
```

#### Step 2: Import Your Database Schema
```sql
-- 1. In Supabase dashboard, go to "SQL Editor"
-- 2. Copy your database schema from Azure SQL
-- 3. Paste and run the schema creation scripts
-- 4. Note down the connection details from Settings > Database
```

### Phase 2: Deploy Backend (10 minutes)

#### Step 3: Create Render Account & Deploy Backend
```bash
# 1. Go to https://render.com
# 2. Sign up with GitHub
# 3. Click "New" > "Web Service"
# 4. Connect your GitHub repo
# 5. Select "GamesRaffle2" repo
# 6. Configure:
#    - Name: gamesraffle-backend
#    - Region: US East
#    - Branch: main
#    - Runtime: Node
#    - Build Command: cd backend && npm install && npm run build
#    - Start Command: cd backend && npm start
#    - Instance Type: Free
```

#### Step 4: Set Environment Variables in Render
```bash
# In Render dashboard, go to Environment tab and add:
NODE_ENV=production
PORT=8000
SQL_CONNECTION_STRING=postgresql://[from-supabase-settings]
JWT_SECRET=your-strong-jwt-secret-here
SESSION_SECRET=your-strong-session-secret-here
CORS_ORIGINS=https://your-netlify-url.netlify.app
USE_MEMORY_CACHE=true
REDIS_ENABLED=false
```

### Phase 3: Deploy Frontend (10 minutes)

#### Step 5: Create Netlify Account & Deploy Frontend
```bash
# 1. Go to https://netlify.com
# 2. Sign up with GitHub
# 3. Click "Add new site" > "Import an existing project"
# 4. Choose GitHub and select your repo
# 5. Configure:
#    - Base directory: frontend
#    - Build command: npm run build
#    - Publish directory: frontend/.next
#    - Branch: main
```

#### Step 6: Update Frontend API Configuration
```bash
# Create frontend/.env.production file:
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```

## 🔧 REQUIRED CODE CHANGES

### Update Backend Database Connection

Create `backend/src/config/supabase.js`:
```javascript
const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.database.connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
```

Update `backend/src/config/database.js`:
```javascript
// Replace SQL Server connection with PostgreSQL
const pool = require('./supabase');

class Database {
  async initialize() {
    try {
      await pool.connect();
      console.log('PostgreSQL connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async query(text, params) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async isHealthy() {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  async close() {
    await pool.end();
  }
}

module.exports = new Database();
```

## 📊 FREE TIER LIMITS

| Service | Free Tier Limits | Perfect For |
|---------|------------------|-------------|
| **Render** | 512MB RAM, 750 hours/month | Development backend |
| **Supabase** | 500MB database, 2GB bandwidth | Development database |  
| **Netlify** | 100GB bandwidth, 300 build minutes | Production frontend |

## ⚠️ MIGRATION CHECKLIST

- [ ] Create Supabase account and database
- [ ] Export data from Azure SQL to Supabase
- [ ] Create Render account and deploy backend
- [ ] Test backend API endpoints
- [ ] Create Netlify account and deploy frontend
- [ ] Update frontend API URLs
- [ ] Test full authentication flow
- [ ] Update DNS settings (optional)
- [ ] Cancel Azure services (after testing)

## 🚀 DEPLOYMENT COMMANDS SUMMARY

```bash
# No scripts to run locally! 
# Everything is done through web dashboards:

# 1. Supabase: https://supabase.com (database)
# 2. Render: https://render.com (backend)  
# 3. Netlify: https://netlify.com (frontend)

# All deployments happen automatically from your GitHub repo!
```

## 💰 COST COMPARISON

| Current Azure | Free Stack | Monthly Savings |
|---------------|------------|-----------------|
| $103/month | $0/month | **$103 (100%)** |

## 🆘 TROUBLESHOOTING

**Common Issues:**
- **Build fails**: Check build commands and paths
- **Database connection fails**: Verify connection string format
- **CORS errors**: Update CORS_ORIGINS environment variable
- **API 404 errors**: Ensure API base URL is correct in frontend

## 📞 NEXT STEPS

1. **Create accounts** on Supabase, Render, and Netlify (free)
2. **Follow the step-by-step guide** above
3. **Test everything works** before canceling Azure
4. **Keep Azure running** until migration is confirmed working

Would you like me to help you with any specific step?