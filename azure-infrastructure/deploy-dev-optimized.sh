#!/bin/bash

# Deploy DEVELOPMENT-OPTIMIZED Azure Infrastructure
# Target cost: ~$10-15/month (90% savings!)

set -e

# Configuration
RESOURCE_GROUP="rg-survivor-sports-dev"
LOCATION="East US"
APP_NAME="gamesraffle-dev"
SUBSCRIPTION="SportsData"
SQL_ADMIN_PASSWORD="DevPassword123!"

echo "🚀 Deploying COST-OPTIMIZED Azure Infrastructure for Development..."
echo "💰 Target Monthly Cost: $10-15 (vs current $103)"
echo ""

# Step 1: Create Resource Group
echo "📦 Creating Resource Group..."
az group create \
  --name $RESOURCE_GROUP \
  --location "$LOCATION" \
  --subscription $SUBSCRIPTION

# Step 2: Create FREE App Service Plan for Backend
echo "🆓 Creating FREE App Service Plan..."
az appservice plan create \
  --name "plan-$APP_NAME-free" \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --subscription $SUBSCRIPTION \
  --sku F1 \
  --is-linux \
  --number-of-workers 1

# Step 3: Create Backend Web App (FREE)
echo "🌐 Creating Backend Web App (FREE)..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "plan-$APP_NAME-free" \
  --name "$APP_NAME-backend" \
  --subscription $SUBSCRIPTION \
  --runtime "NODE|18-lts" \
  --https-only true

# Step 4: Create Basic SQL Database (cheapest option)
echo "🗄️ Creating SQL Server + Basic Database..."
az sql server create \
  --name "sql-$APP_NAME" \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --admin-user "survivoradmin" \
  --admin-password $SQL_ADMIN_PASSWORD \
  --subscription $SUBSCRIPTION

# Create BASIC SQL Database (cheapest tier)
az sql db create \
  --resource-group $RESOURCE_GROUP \
  --server "sql-$APP_NAME" \
  --name "SurvivorSportsDB" \
  --service-objective Basic \
  --subscription $SUBSCRIPTION

# Allow Azure services to access SQL Server
az sql server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --server "sql-$APP_NAME" \
  --name "AllowAzureServices" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0 \
  --subscription $SUBSCRIPTION

# Step 5: NO REDIS CACHE for development (use in-memory sessions)
echo "⚡ Skipping Redis Cache - Using in-memory sessions for development"

# Step 6: Create Storage Account (Standard LRS - cheapest)
echo "💾 Creating Storage Account..."
STORAGE_NAME="st${APP_NAME}$(date +%s)"
az storage account create \
  --name $STORAGE_NAME \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --subscription $SUBSCRIPTION

# Step 7: Configure Backend Environment Variables
echo "⚙️ Setting Backend Environment Variables..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name "$APP_NAME-backend" \
  --subscription $SUBSCRIPTION \
  --settings \
    NODE_ENV=development \
    PORT=8000 \
    JWT_SECRET="dev-jwt-secret-$(date +%s)" \
    JWT_EXPIRES_IN="24h" \
    JWT_REFRESH_EXPIRES_IN="30d" \
    BCRYPT_SALT_ROUNDS=10 \
    CORS_ORIGINS="https://red-hill-054635e0f.1.azurestaticapps.net,http://localhost:3000" \
    SMS_ENABLED=false \
    REDIS_ENABLED=false \
    SESSION_STORE=memory \
    GMAIL_USER="ltorres321@gmail.com" \
    GMAIL_APP_PASSWORD="julpffmvigthdspx" \
    SQL_CONNECTION_STRING="Server=tcp:sql-$APP_NAME.database.windows.net,1433;Initial Catalog=SurvivorSportsDB;Persist Security Info=False;User ID=survivoradmin;Password=$SQL_ADMIN_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

echo ""
echo "🎉 COST-OPTIMIZED DEPLOYMENT COMPLETE!"
echo ""
echo "📊 COST COMPARISON:"
echo "   Current:  ~$103/month"
echo "   New:      ~$10-15/month"
echo "   Savings:  ~$90/month (87% reduction!)"
echo ""
echo "📍 Your Development URLs:"
echo "   Backend:  https://$APP_NAME-backend.azurewebsites.net"
echo "   Frontend: https://red-hill-054635e0f.1.azurestaticapps.net"
echo ""
echo "🔧 WHAT CHANGED:"
echo "   ✅ App Service: Premium → FREE F1"
echo "   ✅ SQL Database: S2 → Basic"
echo "   ✅ Redis Cache: Removed (using in-memory)"
echo "   ✅ Storage: Standard LRS (cheapest)"
echo "   ✅ Removed redundant services"
echo ""
echo "⚠️  DEVELOPMENT LIMITATIONS:"
echo "   • Free App Service: 60 CPU min/day, sleeps after 20min idle"
echo "   • Basic SQL: 2GB storage limit"
echo "   • No Redis: Sessions stored in memory (reset on restart)"
echo "   • Perfect for development, not production!"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Update your backend to use memory sessions instead of Redis"
echo "2. Deploy your backend code"
echo "3. Update frontend API URL"
echo "4. Test functionality"
echo ""