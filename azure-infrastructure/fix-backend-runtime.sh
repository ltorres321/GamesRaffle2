#!/bin/bash

# Fix Backend Runtime Issue
# The NODE|18-lts runtime string was incorrect, let's fix it

set -e

# Configuration
RESOURCE_GROUP="rg-survivor-sports"
BACKEND_APP_NAME="games-raffle-backend-api"
SUBSCRIPTION="SportsData"
APP_SERVICE_PLAN_NAME="plan-gamesraffle-free"

echo "🔧 Fixing Backend Runtime Issue..."

# Step 1: Check available runtimes
echo "📋 Checking available Node.js runtimes..."
echo "Available Linux runtimes:"
az webapp list-runtimes --os-type linux --output table | grep -i node || true

echo ""
echo "Available Windows runtimes:"  
az webapp list-runtimes --os-type windows --output table | grep -i node || true

# Step 2: Delete the failed web app if it exists
echo "🗑️ Cleaning up failed web app..."
az webapp delete \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION || echo "Web app doesn't exist, continuing..."

# Step 3: Create web app with correct runtime - use Node 20 LTS (available)
echo "🌐 Creating Web App with Windows Node 20 LTS runtime..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN_NAME \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION \
  --runtime "NODE:20LTS" \
  --https-only true

# If Windows fails, try Linux with Node 20 LTS
if [ $? -ne 0 ]; then
  echo "⚠️ Windows failed, trying Linux with Node 20 LTS..."
  az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN_NAME \
    --name $BACKEND_APP_NAME \
    --subscription $SUBSCRIPTION \
    --runtime "NODE:20-lts" \
    --https-only true
fi

# If that fails too, try Node 22 LTS
if [ $? -ne 0 ]; then
  echo "⚠️ Trying Node 22 LTS..."
  az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN_NAME \
    --name $BACKEND_APP_NAME \
    --subscription $SUBSCRIPTION \
    --runtime "NODE:22-lts" \
    --https-only true
fi

echo "✅ Web App created successfully!"

# Step 4: Configure App Settings (same as before)
echo "⚙️ Setting up environment variables..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION \
  --settings \
    NODE_ENV=production \
    WEBSITE_NODE_DEFAULT_VERSION="~20" \
    PORT=8000 \
    JWT_SECRET="your-super-secret-jwt-key-change-this-in-production" \
    JWT_EXPIRES_IN="1h" \
    JWT_REFRESH_EXPIRES_IN="30d" \
    BCRYPT_SALT_ROUNDS=12 \
    CORS_ORIGINS="https://red-hill-05463560f.1.azurestaticapps.net,http://localhost:3000" \
    SMS_ENABLED=false \
    GMAIL_USER="ltorres321@gmail.com" \
    GMAIL_APP_PASSWORD="julpffmvigthdspx"

echo "✅ Backend App Service fixed!"
echo ""
echo "🔗 Backend URL: https://$BACKEND_APP_NAME.azurewebsites.net"
echo ""
echo "🚀 Next steps:"
echo "1. Run: ./deploy-backend-code.sh"
echo "2. Add SQL connection string"
echo "3. Test the API"