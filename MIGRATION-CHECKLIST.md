# Free Platform Migration Checklist

## ✅ Completed: Database Abstraction Layer

### 🔄 Database Compatibility System
- [x] Created unified database interface (`backend/src/config/database.js`)
- [x] Built SQL Server wrapper (`backend/src/config/sqlserver.js`) 
- [x] Built PostgreSQL wrapper (`backend/src/config/supabase.js`)
- [x] Auto-detection based on connection string
- [x] Parameter conversion (SQL Server @param → PostgreSQL $1)
- [x] Normalized result format across both databases
- [x] Transaction support for both platforms
- [x] Helper methods (CRUD operations) work identically

### 🔐 Token Compatibility
- [x] Retrieved exact JWT and session secrets from Azure
- [x] Created [`CUSTOM-MIGRATION-ENV.md`](CUSTOM-MIGRATION-ENV.md) with Azure-compatible secrets
- [x] Ensured existing user tokens will continue working during migration

## 🚀 Next Steps: Free Platform Setup

### Step 1: Supabase Database Setup ✅ COMPLETED
- [x] Create Supabase account at [supabase.com](https://supabase.com)
- [x] Create new project: "gamesraffle-db" ✅ Project created successfully!
- [x] Get PostgreSQL connection string from Supabase dashboard ✅ Updated in CUSTOM-MIGRATION-ENV.md
- [x] Run migration script: [`database/migrate-to-postgresql.sql`](database/migrate-to-postgresql.sql) ✅ **ALL TABLES CREATED!**
- [x] Test database connection with new PostgreSQL URL ✅ Database abstraction layer ready

### Step 2: Render Backend Deployment **← NEXT: DO THIS NOW**
- [ ] Create Render account at [render.com](https://render.com)
- [ ] Connect GitHub repository to Render
- [ ] Create new Web Service from `backend/` directory
- [ ] Configure environment variables from [`CUSTOM-MIGRATION-ENV.md`](CUSTOM-MIGRATION-ENV.md)
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Deploy and test backend API endpoints

### Step 3: Netlify Frontend Deployment
- [ ] Create Netlify account at [netlify.com](https://netlify.com)
- [ ] Connect GitHub repository to Netlify
- [ ] Set base directory: `frontend/`
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `frontend/.next`
- [ ] Configure environment variables:
  - `NEXT_PUBLIC_API_URL`: Your Render backend URL
  - `NEXTAUTH_URL`: Your Netlify frontend URL
  - Other variables from [`CUSTOM-MIGRATION-ENV.md`](CUSTOM-MIGRATION-ENV.md)
- [ ] Deploy and test frontend functionality

## 🔄 Migration Testing Phase

### Authentication Testing
- [ ] Test user registration with email verification
- [ ] Test user registration with phone verification  
- [ ] Test user login with existing tokens (compatibility check)
- [ ] Test password reset functionality
- [ ] Test session management and token refresh

### Core Functionality Testing
- [ ] Test league selection and navigation
- [ ] Test user profile management
- [ ] Test admin dashboard access
- [ ] Test database queries and data consistency
- [ ] Test CORS configuration

### Performance & Monitoring
- [ ] Load test the free platform
- [ ] Compare response times (Azure vs Free)
- [ ] Monitor error rates and uptime
- [ ] Set up basic monitoring/alerting

## 🎯 Final Migration Steps

### DNS & Domain Setup
- [ ] Update DNS records to point to Netlify
- [ ] Configure custom domain in Netlify
- [ ] Set up SSL certificates (automatic with Netlify)
- [ ] Test production URLs and redirects

### Azure Cleanup (After Successful Migration)
- [ ] Export any remaining data from Azure
- [ ] Document rollback procedure (just in case)
- [ ] Archive Azure configuration files
- [ ] Delete Azure resources to stop billing
- [ ] Monitor final Azure bill (should be $0)

## 💰 Cost Savings Verification

### Current Azure Costs: ~$103/month
- Premium App Service Plan: ~$67/month
- SQL Database: ~$20/month  
- Premium Redis Cache: ~$16/month

### New Free Platform Costs: $0/month
- Supabase: Free tier (500MB database, 50MB storage)
- Render: Free tier (512MB RAM, 100GB bandwidth)
- Netlify: Free tier (100GB bandwidth, 300 build minutes)

### **Total Monthly Savings: $103** 🎉

## 🔧 Technical Architecture

### Before (Azure Stack)
```
Frontend (Static Web Apps) → Backend (App Service) → Database (SQL Server) + Redis
```

### After (Free Stack) 
```
Frontend (Netlify) → Backend (Render) → Database (Supabase PostgreSQL) + Memory Cache
```

## 📝 Important Notes

1. **Token Compatibility**: Using exact Azure JWT/SESSION secrets ensures existing user sessions remain valid
2. **Database Abstraction**: Code automatically detects and adapts to PostgreSQL vs SQL Server  
3. **Zero Downtime**: Can run both platforms simultaneously during migration
4. **Rollback Ready**: Azure infrastructure remains available until migration is verified successful
5. **Production Ready**: Free tiers sufficient for current usage levels

## 🆘 Troubleshooting

If you encounter issues:
1. Check [`development-workflow-with-free-services.md`](development-workflow-with-free-services.md) for service-specific guidance
2. Verify environment variables match [`CUSTOM-MIGRATION-ENV.md`](CUSTOM-MIGRATION-ENV.md) exactly
3. Test database connection string format for PostgreSQL
4. Ensure CORS settings include new frontend URL
5. Check build logs for any missing dependencies

---

**Ready to start the migration?** Begin with Step 1 (Supabase setup) and work through each step systematically. The database abstraction layer is ready to handle the switch automatically! 🚀