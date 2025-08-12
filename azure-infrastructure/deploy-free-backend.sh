#!/bin/bash

# Deploy Free Azure App Service for Backend API
# This script creates a FREE backend service to keep costs down

set -e

# Configuration
RESOURCE_GROUP="rg-survivor-sports"
LOCATION="East US"
APP_SERVICE_PLAN_NAME="plan-gamesraffle-free"
BACKEND_APP_NAME="games-raffle-backend-api"
SUBSCRIPTION="SportsData"

echo "🚀 Deploying FREE Azure App Service Backend..."
echo "📍 Resource Group: $RESOURCE_GROUP"
echo "📍 Location: $LOCATION"
echo "💰 Tier: FREE (F1)"

# Step 1: Create FREE App Service Plan (F1 tier)
echo "📦 Creating FREE App Service Plan..."
az appservice plan create \
  --name $APP_SERVICE_PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --location "$LOCATION" \
  --subscription $SUBSCRIPTION \
  --sku F1 \
  --is-linux \
  --number-of-workers 1

echo "✅ FREE App Service Plan created: $APP_SERVICE_PLAN_NAME"

# Step 2: Create Web App with Node.js runtime
echo "🌐 Creating Web App for Backend API..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN_NAME \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION \
  --runtime "NODE|18-lts" \
  --https-only true

echo "✅ Backend Web App created: $BACKEND_APP_NAME"

# Step 3: Configure App Settings (Environment Variables)
echo "⚙️ Setting up environment variables..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION \
  --settings \
    NODE_ENV=production \
    PORT=8000 \
    JWT_SECRET="your-super-secret-jwt-key-change-this-in-production" \
    JWT_EXPIRES_IN="1h" \
    JWT_REFRESH_EXPIRES_IN="30d" \
    BCRYPT_SALT_ROUNDS=12 \
    CORS_ORIGINS="https://red-hill-05463560f.1.azurestaticapps.net,http://localhost:3000" \
    SMS_ENABLED=false \
    GMAIL_USER="ltorres321@gmail.com" \
    GMAIL_APP_PASSWORD="julpffmvigthdspx"

# Note: SQL Server connection string needs to be added manually for security

# Step 4: Set up deployment from GitHub (optional)
echo "📡 Backend API URL will be: https://$BACKEND_APP_NAME.azurewebsites.net"

# Step 5: Show next steps
echo ""
echo "🎯 DEPLOYMENT COMPLETE!"
echo ""
echo "📍 Your FREE Backend API URL:"
echo "   https://$BACKEND_APP_NAME.azurewebsites.net"
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Add SQL Server connection string:"
echo "   az webapp config connection-string set \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --name $BACKEND_APP_NAME \\"
echo "     --connection-string-type SQLAzure \\"
echo "     --settings DefaultConnection='YOUR_SQL_CONNECTION_STRING'"
echo ""
echo "2. Deploy your backend code:"
echo "   cd backend"
echo "   zip -r backend-deploy.zip . -x node_modules/\\* .git/\\*"
echo "   az webapp deployment source config-zip \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --name $BACKEND_APP_NAME \\"
echo "     --src backend-deploy.zip"
echo ""
echo "3. Update frontend API URL:"
echo "   NEXT_PUBLIC_API_URL=https://$BACKEND_APP_NAME.azurewebsites.net"
echo ""
echo "💰 COST: FREE TIER (No charges for basic usage)"
echo "📊 Limitations: 1GB storage, 60 CPU minutes/day, 1 instance"
echo ""
echo "🔗 Manage your app:"
echo "   https://portal.azure.com/#@theprofessor.org/resource/subscriptions/$SUBSCRIPTION/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$BACKEND_APP_NAME"