#!/bin/bash

# Survivor Sports Betting App - Azure Infrastructure Deployment Script
# This script creates all Azure resources needed for the application

set -e

# Configuration Variables
RESOURCE_GROUP="rg-survivor-sports"
LOCATION="East US"
APP_NAME="survivor-sports-app"
SQL_SERVER_NAME="sql-survivor-sports"
SQL_DB_NAME="SurvivorSportsDB"
REDIS_NAME="redis-survivor-sports"
STORAGE_NAME="stsurvivor$(date +%s)"
FUNCTION_APP_NAME="func-survivor-sports"
STATIC_WEB_APP_NAME="swa-survivor-sports"
APP_INSIGHTS_NAME="ai-survivor-sports"

# Admin credentials (change these!)
SQL_ADMIN_USER="survivoradmin"
SQL_ADMIN_PASSWORD="SurvivorApp2024!"

echo "🚀 Starting Azure Infrastructure Deployment for Survivor Sports App"
echo "=================================================="

# Create Resource Group
echo "📦 Creating Resource Group: $RESOURCE_GROUP"
az group create \
    --name $RESOURCE_GROUP \
    --location "$LOCATION" \
    --tags project="survivor-sports" environment="production"

# Create App Service Plan (Linux, Premium V3)
echo "🖥️  Creating App Service Plan"
az appservice plan create \
    --name "asp-$APP_NAME" \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --sku P1V3 \
    --is-linux

# Create App Service for Node.js Backend
echo "🌐 Creating App Service for Backend API"
az webapp create \
    --name "$APP_NAME-api" \
    --resource-group $RESOURCE_GROUP \
    --plan "asp-$APP_NAME" \
    --runtime "NODE:20-lts" \
    --assign-identity

# Configure App Service settings
az webapp config appsettings set \
    --name "$APP_NAME-api" \
    --resource-group $RESOURCE_GROUP \
    --settings \
        NODE_ENV=production \
        PORT=8000 \
        JWT_SECRET="your-super-secret-jwt-key-change-this" \
        SESSION_SECRET="your-session-secret-change-this"

# Create SQL Server
echo "🗄️  Creating SQL Server: $SQL_SERVER_NAME"
az sql server create \
    --name $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --admin-user $SQL_ADMIN_USER \
    --admin-password "$SQL_ADMIN_PASSWORD"

# Configure SQL Server firewall (allow Azure services)
echo "🔒 Configuring SQL Server firewall rules"
az sql server firewall-rule create \
    --server $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP \
    --name "AllowAzureServices" \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

# Create SQL Database
echo "💾 Creating SQL Database: $SQL_DB_NAME"
az sql db create \
    --name $SQL_DB_NAME \
    --server $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP \
    --service-objective S2 \
    --backup-storage-redundancy Local

# Create Azure Cache for Redis (Premium tier for persistence)
echo "⚡ Creating Azure Cache for Redis: $REDIS_NAME"
az redis create \
    --name $REDIS_NAME \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --sku Premium \
    --vm-size P1 \
    --redis-configuration maxmemory-policy=allkeys-lru \
    --tags project="survivor-sports"

# Create Storage Account for file uploads
echo "📁 Creating Storage Account: $STORAGE_NAME"
az storage account create \
    --name $STORAGE_NAME \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --access-tier Hot

# Create blob container for ID verification documents
az storage container create \
    --name "id-verification" \
    --account-name $STORAGE_NAME \
    --public-access off

# Create Application Insights
echo "📊 Creating Application Insights: $APP_INSIGHTS_NAME"
az monitor app-insights component create \
    --app $APP_INSIGHTS_NAME \
    --location "$LOCATION" \
    --resource-group $RESOURCE_GROUP \
    --kind web \
    --application-type web

# Create Function App for scheduled tasks
echo "⚙️  Creating Function App: $FUNCTION_APP_NAME"
az functionapp create \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --storage-account $STORAGE_NAME \
    --plan "asp-$APP_NAME" \
    --runtime node \
    --runtime-version 20 \
    --functions-version 4 \
    --assign-identity

# Create Static Web App for React frontend (skipping for now - will create manually later)
echo "🎨 Skipping Static Web App creation (will create after frontend is ready)"
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

# Get connection strings and keys
echo "🔑 Retrieving connection strings and keys..."

# SQL Connection String
SQL_CONNECTION_STRING=$(az sql db show-connection-string \
    --client ado.net \
    --server $SQL_SERVER_NAME \
    --name $SQL_DB_NAME \
    --output tsv)

# Redis Connection String
REDIS_CONNECTION_STRING=$(az redis list-keys \
    --name $REDIS_NAME \
    --resource-group $RESOURCE_GROUP \
    --query primaryConnectionString \
    --output tsv)

# Storage Connection String
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
    --name $STORAGE_NAME \
    --resource-group $RESOURCE_GROUP \
    --query connectionString \
    --output tsv)

# Application Insights Key
APP_INSIGHTS_KEY=$(az monitor app-insights component show \
    --app $APP_INSIGHTS_NAME \
    --resource-group $RESOURCE_GROUP \
    --query instrumentationKey \
    --output tsv)

# Update App Service configuration with connection strings
echo "🔧 Configuring App Service with connection strings"
az webapp config appsettings set \
    --name "$APP_NAME-api" \
    --resource-group $RESOURCE_GROUP \
    --settings \
        SQL_CONNECTION_STRING="$SQL_CONNECTION_STRING" \
        REDIS_CONNECTION_STRING="$REDIS_CONNECTION_STRING" \
        STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION_STRING" \
        APPINSIGHTS_INSTRUMENTATIONKEY="$APP_INSIGHTS_KEY" \
        ESPN_API_KEY="your-espn-api-key-here"

# Update Function App configuration
az functionapp config appsettings set \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        SQL_CONNECTION_STRING="$SQL_CONNECTION_STRING" \
        REDIS_CONNECTION_STRING="$REDIS_CONNECTION_STRING" \
        ESPN_API_KEY="your-espn-api-key-here" \
        APPINSIGHTS_INSTRUMENTATIONKEY="$APP_INSIGHTS_KEY"

echo ""
echo "✅ Azure Infrastructure Deployment Complete!"
echo "=================================================="
echo "📋 Resource Summary:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   App Service: $APP_NAME-api"
echo "   SQL Server: $SQL_SERVER_NAME"
echo "   SQL Database: $SQL_DB_NAME"
echo "   Redis Cache: $REDIS_NAME"
echo "   Storage Account: $STORAGE_NAME"
echo "   Function App: $FUNCTION_APP_NAME"
echo "   Static Web App: $STATIC_WEB_APP_NAME"
echo "   Application Insights: $APP_INSIGHTS_NAME"
echo ""
echo "🔗 Important URLs:"
echo "   Backend API: https://$APP_NAME-api.azurewebsites.net"
echo "   Frontend: https://$STATIC_WEB_APP_NAME.azurestaticapps.net"
echo ""
echo "⚠️  Next Steps:"
echo "   1. Run database schema creation script"
echo "   2. Deploy backend API code"
echo "   3. Deploy frontend code"
echo "   4. Configure GitHub Actions for CI/CD"
echo "   5. Test the complete application"
echo ""
echo "🔒 Security Reminders:"
echo "   - Change default SQL admin password"
echo "   - Update JWT_SECRET and SESSION_SECRET"
echo "   - Configure proper CORS settings"
echo "   - Set up SSL certificates"
echo "   - Review firewall rules"
echo ""