#!/bin/bash

# Deploy Backend Code to Linux Azure App Service (Simplified)
# This version is optimized specifically for Linux App Service

set -e

# Configuration
RESOURCE_GROUP="rg-survivor-sports"
BACKEND_APP_NAME="games-raffle-backend-api"
SUBSCRIPTION="SportsData"

echo "🐧 Deploying Backend Code to Linux App Service..."
echo "🎯 Target: $BACKEND_APP_NAME.azurewebsites.net"

# Step 1: Navigate to backend directory
cd ../backend

# Step 2: Clean up any previous deployment files
echo "🧹 Cleaning up previous deployment files..."
rm -f backend-deploy.zip package-deploy.json web.config

# Step 3: Create a Linux-optimized package.json
echo "📦 Creating Linux deployment package.json..."
cat > package-deploy.json << EOF
{
  "name": "games-raffle-backend",
  "version": "1.0.0",
  "description": "Games Raffle Backend API",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "build": "echo 'No build step required'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "joi": "^17.9.2",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.0",
    "mssql": "^9.1.1",
    "nodemailer": "^6.9.4",
    "twilio": "^4.14.0",
    "dotenv": "^16.3.1",
    "winston": "^3.10.0",
    "node-cron": "^3.0.2"
  },
  "engines": {
    "node": "20.x"
  }
}
EOF

# Step 4: Create deployment zip with only necessary files
echo "🗜️ Creating clean deployment package..."
zip -r backend-deploy.zip \
  src/ \
  package-deploy.json \
  package-lock.json \
  -x "src/config/.env*" \
  -x "*.log" \
  -x "node_modules/*"

# Rename package file for deployment
mv package-deploy.json package.json
zip -u backend-deploy.zip package.json
mv package.json package-deploy.json

echo "✅ Clean deployment package created"

# Step 5: Use the new Azure CLI deployment command
echo "🚀 Deploying with az webapp deploy..."
az webapp deploy \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION \
  --src-path backend-deploy.zip \
  --type zip \
  --async true

echo "⏳ Deployment initiated. Checking status..."

# Step 6: Wait and check deployment status
sleep 30
echo "📊 Checking deployment status..."

# Step 7: Show the deployment URL and next steps
echo ""
echo "🎉 DEPLOYMENT INITIATED!"
echo ""
echo "🔗 Backend URL: https://$BACKEND_APP_NAME.azurewebsites.net"
echo ""
echo "🧪 Test endpoints:"
echo "curl https://$BACKEND_APP_NAME.azurewebsites.net"
echo "curl https://$BACKEND_APP_NAME.azurewebsites.net/health"
echo ""
echo "⚠️  NEXT STEPS REQUIRED:"
echo "1. Add SQL connection string:"
echo ""
echo "az webapp config connection-string set \\"
echo "  --resource-group $RESOURCE_GROUP \\"
echo "  --name $BACKEND_APP_NAME \\"
echo "  --subscription $SUBSCRIPTION \\"
echo "  --connection-string-type SQLAzure \\"
echo "  --settings DefaultConnection='YOUR_SQL_CONNECTION_STRING'"
echo ""
echo "2. Update frontend API URL:"
echo "   Set NEXT_PUBLIC_API_URL=https://$BACKEND_APP_NAME.azurewebsites.net"
echo ""
echo "3. Check deployment logs if needed:"
echo "   https://$BACKEND_APP_NAME.scm.azurewebsites.net/deployments"

# Cleanup
rm -f backend-deploy.zip package-deploy.json
echo ""
echo "✅ Deployment files cleaned up"