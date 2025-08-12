#!/bin/bash

# Deploy Backend Code to Azure App Service
# Run this after creating the Azure App Service with deploy-free-backend.sh

set -e

# Configuration
RESOURCE_GROUP="rg-survivor-sports"
BACKEND_APP_NAME="games-raffle-backend-api"
SUBSCRIPTION="SportsData"

echo "📦 Deploying Backend Code to Azure App Service..."
echo "🎯 Target: $BACKEND_APP_NAME.azurewebsites.net"

# Step 1: Create deployment package (exclude unnecessary files)
echo "📦 Creating deployment package..."
cd ../backend

# Create package.json for production deployment
cat > package-deploy.json << EOF
{
  "name": "games-raffle-backend",
  "version": "1.0.0",
  "description": "Games Raffle Backend API",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "postinstall": "npm install --production"
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
    "node": ">=18.0.0"
  }
}
EOF

# Step 2: Create web.config for Azure App Service Node.js
cat > web.config << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <webSocket enabled="false" />
    <handlers>
      <add name="iisnode" path="src/server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="StaticContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true"/>
          </conditions>
          <action type="Rewrite" url="src/server.js"/>
        </rule>
      </rules>
    </rewrite>
    <iisnode node_env="production" />
    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
        </hiddenSegments>
      </requestFiltering>
    </security>
    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
EOF

# Step 3: Create deployment zip (exclude development files)
echo "🗜️ Creating deployment zip..."
zip -r backend-deploy.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "*.log" \
  -x ".env*" \
  -x "scripts/*" \
  -x "README.md" \
  -x "package.json" \
  && mv package-deploy.json package.json

echo "✅ Deployment package created: backend-deploy.zip"

# Step 4: Deploy to Azure App Service
echo "🚀 Deploying to Azure App Service..."
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION \
  --src backend-deploy.zip

echo "✅ Backend deployed successfully!"

# Step 5: Add SQL Server connection string (user needs to provide the actual connection string)
echo "⚠️  IMPORTANT: Add SQL Server connection string:"
echo ""
echo "az webapp config connection-string set \\"
echo "  --resource-group $RESOURCE_GROUP \\"
echo "  --name $BACKEND_APP_NAME \\"
echo "  --subscription $SUBSCRIPTION \\"
echo "  --connection-string-type SQLAzure \\"
echo "  --settings DefaultConnection='Server=tcp:your-server.database.windows.net,1433;Initial Catalog=SurvivorSportsDB;Persist Security Info=False;User ID=your-username;Password=your-password;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'"

# Step 6: Restart app service
echo "🔄 Restarting App Service..."
az webapp restart \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION

# Step 7: Show deployment URL
echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "🔗 Backend API URL: https://$BACKEND_APP_NAME.azurewebsites.net"
echo ""
echo "🧪 Test your API:"
echo "curl https://$BACKEND_APP_NAME.azurewebsites.net/api/health"
echo ""
echo "📱 Update your frontend:"
echo "Set NEXT_PUBLIC_API_URL=https://$BACKEND_APP_NAME.azurewebsites.net"
echo ""
echo "⚡ Don't forget to:"
echo "1. Add your SQL Server connection string (command shown above)"
echo "2. Update frontend environment variables"
echo "3. Test login functionality"

# Cleanup
rm -f backend-deploy.zip web.config