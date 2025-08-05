# Azure Deployment Troubleshooting Guide

## Fixed Issues

### ✅ Node.js Runtime Issue
**Problem**: `Linux Runtime 'NODE:18-lts' is not supported`
**Solution**: Updated deployment script to use `NODE:20-lts` which is currently supported by Azure.

### ✅ SQL Server Parameter Issue
**Problem**: `unrecognized arguments: false` when creating SQL Server
**Solution**: Removed invalid `--enable-ad-only-auth false` parameter from SQL Server creation command.

### ✅ Static Web App Issue
**Problem**: Static Web App creation fails due to non-existent GitHub repository
**Solution**: Commented out Static Web App creation - will create manually after frontend is ready.

### ✅ Redis Cache Parameter Issue
**Problem**: Multiple Redis configuration errors:
- `unrecognized arguments: false`
- `Failed to parse string as JSON: maxmemory-policy=allkeys-lru`
**Solution**: Fixed JSON format for redis-configuration parameter and removed invalid parameters.

## Next Steps After Fixing Runtime Issue

### 1. Continue Deployment
Run the fixed deployment script:
```bash
cd azure-infrastructure
./deploy-infrastructure.sh
```

### 2. If You Get Additional Errors

**Static Web App Creation May Fail**
The Static Web App creation might fail because it references a non-existent GitHub repository. You can either:

**Option A**: Skip Static Web App for now
Comment out lines 139-150 in the deployment script:
```bash
# Static Web App creation - skip for now
# az staticwebapp create \
#     --name $STATIC_WEB_APP_NAME \
#     --resource-group $RESOURCE_GROUP \
#     --location "$LOCATION" \
#     --source https://github.com/your-username/survivor-sports-frontend \
#     --branch main \
#     --app-location "/" \
#     --api-location "api" \
#     --output-location "out" \
#     --sku Standard
```

**Option B**: Create it manually later through Azure Portal

### 3. Monitor Deployment Progress

The deployment creates these resources in order:
- ✅ Resource Group 
- ✅ App Service Plan
- 🔄 App Service (should work now with NODE:20-lts)
- 🔄 SQL Server & Database
- 🔄 Redis Cache (takes 10-15 minutes)
- 🔄 Storage Account
- 🔄 Application Insights
- 🔄 Function App

### 4. Common Issues & Solutions

**SQL Server Creation Issues**:
- Ensure password meets complexity requirements
- Check region availability

**Redis Cache Takes Long**:
- Premium Redis can take 10-15 minutes to provision
- This is normal behavior

**Storage Account Name Conflicts**:
- Storage account names must be globally unique
- Script uses timestamp to avoid conflicts

### 5. Verify Deployment Success

After successful deployment, you should see:
```
✅ Azure Infrastructure Deployment Complete!
==================================================
📋 Resource Summary:
   Resource Group: rg-survivor-sports
   App Service: survivor-sports-app-api
   SQL Server: sql-survivor-sports
   SQL Database: SurvivorSportsDB
   Redis Cache: redis-survivor-sports
   Storage Account: stsurvivor[timestamp]
   Function App: func-survivor-sports
   Application Insights: ai-survivor-sports
```

### 6. Next Phase After Successful Deployment

1. **Setup Database**:
   ```sql
   -- Connect to SQL Server and run:
   -- 1. database/create-schema.sql
   -- 2. database/seed-data.sql
   ```

2. **Configure Backend**:
   ```bash
   cd ../backend
   cp .env.example .env
   # Update .env with connection strings from deployment output
   npm install
   npm run dev
   ```

3. **Test Backend**:
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"healthy",...}
   ```

## Need Help?

If you encounter other issues:
1. Check Azure Portal for resource status
2. Review deployment logs
3. Verify subscription limits and quotas
4. Check service availability in your region

The main issue (Node.js runtime) has been fixed, so the deployment should proceed successfully now!