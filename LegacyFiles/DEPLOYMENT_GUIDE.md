# Games Raffle App - Cost-Effective Deployment Guide

This guide walks through deploying the Games Raffle application using **Azure Static Web Apps** instead of expensive Redis infrastructure, reducing operational costs significantly.

## 🎯 **Cost Optimization Summary**

### **Before (Full Azure Infrastructure)**
- Azure App Service: ~$75/month
- Azure SQL Database: ~$300/month  
- Azure Redis Cache Premium: ~$130/month
- Azure Storage: ~$20/month
- **Total: ~$525/month**

### **After (Static Web App + In-Memory Cache)**
- Azure Static Web Apps: **FREE** (with GitHub Actions)
- Azure SQL Database: ~$300/month
- Azure Storage: ~$20/month
- **Total: ~$320/month** (38% cost reduction)

## 📋 **Prerequisites**

1. **GitHub Repository**: Code must be in a GitHub repository
2. **Azure Account**: Free tier sufficient for Static Web Apps
3. **SportRadar API Key**: `FprVFPIo5uZAI4XuXFy1HBbeEBfzWPVivbKVZ0Fc` (already configured)
4. **Domain** (optional): For custom domain configuration

## 🚀 **Deployment Steps**

### **Step 1: Prepare the Database**

1. **Create Azure SQL Database** (if not already created):
```bash
# Run the Azure deployment script (without Redis)
./azure-infrastructure/deploy-infrastructure.sh
# Or use PowerShell version:
./azure-infrastructure/deploy-infrastructure.ps1
```

2. **Set Up Database Schema**:
```sql
-- Connect to your Azure SQL Database and run:
-- 1. Create tables
USE [SurvivorSportsDB];
-- Execute: database/create-schema-sportradar.sql

-- 2. Insert seed data  
-- Execute: database/seed-data-sportradar.sql
```

### **Step 2: Configure GitHub Repository**

1. **Fork/Clone the Repository**:
```bash
git clone https://github.com/your-username/survivor-sports-app.git
cd survivor-sports-app
```

2. **Set Up GitHub Secrets**:
Go to GitHub Repository → Settings → Secrets and variables → Actions

**Required Secrets:**
```bash
# Database
SQL_CONNECTION_STRING="Server=tcp:your-sql-server.database.windows.net,1433;Initial Catalog=SurvivorSportsDB;Persist Security Info=False;User ID=your-username;Password=your-password;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# SportRadar API (already configured)
SPORTRADAR_API_KEY="FprVFPIo5uZAI4XuXFy1HBbeEBfzWPVivbKVZ0Fc"

# Security
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long-12345"
SESSION_SECRET="your-super-secret-session-key-at-least-32-characters-long-67890"

# Azure Storage
STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=your-storage;AccountKey=your-key;EndpointSuffix=core.windows.net"

# Optional
APPINSIGHTS_INSTRUMENTATIONKEY="your-app-insights-key"
SENDGRID_API_KEY="your-sendgrid-key"
```

### **Step 3: Create Azure Static Web App**

1. **Via Azure Portal**:
   - Go to Azure Portal → Create Resource → Static Web App
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or select existing
   - **Name**: `survivor-sports-app`
   - **Plan**: Free (sufficient for most use cases)
   - **Region**: Choose closest to your users
   - **Deployment**: GitHub
   - **Repository**: Select your forked repository
   - **Branch**: `main`
   - **Build Preset**: Custom
   - **App Location**: `/frontend`
   - **API Location**: `/backend`  
   - **Output Location**: `out`

2. **Get the Deployment Token**:
   - After creation, go to Static Web App → Manage deployment token
   - Copy the token and add it as `AZURE_STATIC_WEB_APPS_API_TOKEN` in GitHub Secrets

### **Step 4: Configure the Application**

1. **Update GitHub Workflow** (already configured in `.github/workflows/azure-static-web-apps-deploy.yml`):
   - The workflow is pre-configured for your setup
   - It automatically deploys on push to `main` branch
   - Uses in-memory caching instead of Redis

2. **Update CORS Origins**:
   - After deployment, get your Static Web App URL (e.g., `https://happy-rock-123abc.azurestaticapps.net`)
   - Update the `CORS_ORIGINS` secret in GitHub to include your app URL

### **Step 5: Deploy**

1. **Commit and Push**:
```bash
git add .
git commit -m "Configure for Azure Static Web App deployment"
git push origin main
```

2. **Monitor Deployment**:
   - Go to GitHub → Actions tab
   - Watch the deployment process
   - Check for any errors in the logs

3. **Verify Deployment**:
   - Visit your Static Web App URL
   - Test the health endpoint: `https://your-app.azurestaticapps.net/api/health`
   - Should return healthy status with database and cache connected

## 🔧 **Key Changes Made for Cost Optimization**

### **1. Memory Cache Instead of Redis**
- **File**: [`backend/src/config/memoryCache.js`](backend/src/config/memoryCache.js:1)
- **Features**: Session management, API caching, rate limiting
- **Cleanup**: Automatic expired item removal every 5 minutes
- **Limitations**: Data lost on restart (acceptable for caching)

### **2. Updated Services**
- **SportRadar Service**: Now uses memory cache for API responses
- **Authentication**: Session management via memory cache
- **Game Service**: In-memory caching for scores and schedules

### **3. GitHub Actions Deployment**
- **File**: [`.github/workflows/azure-static-web-apps-deploy.yml`](.github/workflows/azure-static-web-apps-deploy.yml:1)
- **Features**: Automated deployment, environment variable injection
- **Cost**: **FREE** with GitHub Actions

## 📊 **Performance Considerations**

### **Memory Cache Limitations**
- **Single Instance**: Cache not shared between app instances
- **Restart Loss**: Cache cleared on application restart
- **Memory Usage**: Monitor memory consumption in Azure

### **Recommended Solutions**
1. **Horizontal Scaling**: Use Azure Static Web Apps auto-scaling
2. **Database Optimization**: Implement proper indexing and query optimization
3. **CDN**: Use Azure CDN for static assets (included with Static Web Apps)

## 🔒 **Security Configuration**

### **Environment Variables**
All sensitive data stored in GitHub Secrets and injected at build time:
- Database connection strings
- API keys
- JWT secrets
- Storage credentials

### **CORS Configuration**
Update allowed origins in GitHub Secrets after deployment:
```bash
CORS_ORIGINS="https://your-static-web-app-url.azurestaticapps.net,https://your-custom-domain.com"
```

## 🧪 **Testing the Deployment**

### **1. Health Checks**
```bash
# Application health
curl https://your-app.azurestaticapps.net/api/health

# Database connectivity
curl https://your-app.azurestaticapps.net/api/games/health

# SportRadar integration
curl https://your-app.azurestaticapps.net/api/games/current-week
```

### **2. Authentication Testing**
```bash
# Register a new user
curl -X POST https://your-app.azurestaticapps.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "dateOfBirth": "1990-01-01"
  }'

# Login
curl -X POST https://your-app.azurestaticapps.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### **3. Admin Functions**
```bash
# Login as admin (username: admin, password: Admin123!)
# Then test admin endpoints:

# Sync NFL teams
curl -X POST https://your-app.azurestaticapps.net/api/games/sync/teams \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get current week games
curl https://your-app.azurestaticapps.net/api/games/current-week
```

## 🔄 **Ongoing Maintenance**

### **Database Updates**
- Run score sync manually if needed: `POST /api/games/update-scores`
- Monitor scheduled jobs: `GET /api/games/jobs/status`
- Check API usage: `GET /api/games/stats/api`

### **Monitoring**
- **Azure Portal**: Monitor Static Web App metrics
- **GitHub Actions**: Check deployment logs
- **Application Logs**: Use Application Insights if configured

## 🚀 **Next Steps**

1. **Custom Domain**: Configure custom domain in Azure Static Web Apps
2. **SSL Certificate**: Automatic SSL with custom domains
3. **Frontend Development**: Build React/Next.js frontend
4. **Load Testing**: Test with expected user load
5. **Backup Strategy**: Set up automated database backups

## 💡 **Additional Cost Savings**

1. **Use Azure Free Credits**: New accounts get $200 free credits
2. **Reserved Instances**: For long-term SQL Database usage
3. **Spot Instances**: For development/testing environments
4. **Auto-scaling**: Configure to scale down during low usage

This deployment approach provides a production-ready, cost-effective solution for the Games Raffle application while maintaining all core functionality.