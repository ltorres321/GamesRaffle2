#!/bin/bash

# Fix Backend with Proper Linux Runtime Format
# Linux is cheaper and perfect for Node.js applications

set -e

# Configuration
RESOURCE_GROUP="rg-survivor-sports"
BACKEND_APP_NAME="games-raffle-backend-api"
SUBSCRIPTION="SportsData"
LINUX_PLAN="plan-gamesraffle-free"
LOCATION="East US"

echo "🐧 Fixing Backend with Proper Linux Runtime..."
echo "💰 Using Linux (cheaper than Windows, perfect for Node.js)"

# Step 1: Clean up any failed web app
echo "🗑️ Cleaning up failed web app..."
az webapp delete \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION || echo "Web app doesn't exist, continuing..."

# Step 2: Create Linux Web App with CORRECT runtime format
echo "🌐 Creating Linux Web App with Node 20 LTS..."
echo "📋 Using runtime: NODE:20-lts (Linux format)"

az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $LINUX_PLAN \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION \
  --runtime "NODE:20-lts" \
  --https-only true

echo "✅ Linux Web App created successfully!"

# Step 3: Configure App Settings for Linux
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

# Step 4: Configure startup command for Linux
echo "🚀 Setting Linux startup command..."
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --subscription $SUBSCRIPTION \
  --startup-file "src/server.js"

# Step 5: Show final result
echo ""
echo "🎉 SUCCESS! Linux Backend Created!"
echo ""
echo "🔗 Backend URL: https://$BACKEND_APP_NAME.azurewebsites.net"
echo "🐧 Platform: Linux (F1 Free tier - cheaper than Windows!)"
echo "⚡ Runtime: Node.js 20 LTS"
echo "💰 Cost: FREE (Linux is more cost-effective)"
echo ""
echo "✅ Benefits of Linux for Node.js:"
echo "   • Cheaper than Windows"
echo "   • Better performance for Node.js"
echo "   • Native Unix environment"
echo "   • Faster deployments"
echo ""
echo "🚀 Next steps:"
echo "1. Run: ./deploy-backend-code.sh"
echo "2. Add SQL connection string"
echo "3. Test the API"
echo ""
echo "🧪 Test when ready:"
echo "curl https://$BACKEND_APP_NAME.azurewebsites.net"