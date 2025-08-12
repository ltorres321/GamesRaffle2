#!/bin/bash

# Create Backend with Plan - Handle missing plan situation
# This script creates both the plan AND the web app

set -e

# Configuration
RESOURCE_GROUP="rg-survivor-sports"
BACKEND_APP_NAME="games-raffle-backend-api"
SUBSCRIPTION="SportsData"
LINUX_PLAN="plan-gamesraffle-free"
LOCATION="East US"

echo "🐧 Creating Backend with Fresh Linux Plan..."

# Step 1: Check if plan exists, create if missing
echo "🔍 Checking if App Service Plan exists..."
PLAN_EXISTS=$(az appservice plan show \
  --resource-group $RESOURCE_GROUP \
  --name $LINUX_PLAN \
  --subscription $SUBSCRIPTION \
  --query "name" \
  --output tsv 2>/dev/null || echo "")

if [[ -z "$PLAN_EXISTS" ]]; then
  echo "📦 Creating FREE Linux App Service Plan..."
  az appservice plan create \
    --name $LINUX_PLAN \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --subscription $SUBSCRIPTION \
    --sku F1 \
    --is-linux \
    --number-of-workers 1
  
  echo "✅ FREE Linux Plan created: $LINUX_PLAN"
else
  echo "✅ Plan already exists: $LINUX_PLAN"
fi

# Step 2: Clean up any failed web app
echo "🗑️ Cleaning up any existing web app..."
az webapp delete \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION || echo "No existing app to clean up"

# Step 3: Create Linux Web App with correct runtime
echo "🌐 Creating Linux Web App with Node 20 LTS..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $LINUX_PLAN \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION \
  --runtime "NODE:20-lts" \
  --https-only true

echo "✅ Linux Web App created successfully!"

# Step 4: Configure App Settings for Linux
echo "⚙️ Setting up Linux environment variables..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION \
  --settings \
    NODE_ENV=production \
    PORT=8000 \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    ENABLE_ORYX_BUILD=true \
    JWT_SECRET="your-super-secret-jwt-key-change-this-in-production" \
    JWT_EXPIRES_IN="1h" \
    JWT_REFRESH_EXPIRES_IN="30d" \
    BCRYPT_SALT_ROUNDS=12 \
    CORS_ORIGINS="https://red-hill-05463560f.1.azurestaticapps.net,http://localhost:3000" \
    SMS_ENABLED=false \
    GMAIL_USER="ltorres321@gmail.com" \
    GMAIL_APP_PASSWORD="julpffmvigthdspx"

# Step 5: Configure startup command for Linux
echo "🚀 Setting Linux startup command..."
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION \
  --startup-file "src/server.js"

# Step 6: Verify everything is created
echo ""
echo "📊 Verification - Current resources:"
az appservice plan list \
  --resource-group $RESOURCE_GROUP \
  --subscription $SUBSCRIPTION \
  --query "[].{Name:name, Tier:sku.tier, OS:kind}" \
  --output table

az webapp list \
  --resource-group $RESOURCE_GROUP \
  --subscription $SUBSCRIPTION \
  --query "[].{Name:name, State:state, Plan:serverFarmId}" \
  --output table

# Step 7: Show final result
echo ""
echo "🎉 SUCCESS! Backend Created!"
echo ""
echo "🔗 Backend URL: https://$BACKEND_APP_NAME.azurewebsites.net"
echo "🐧 Platform: Linux F1 Free"
echo "⚡ Runtime: Node.js 20 LTS"
echo ""
echo "🚀 Next step: Deploy your code with ./deploy-backend-code.sh"