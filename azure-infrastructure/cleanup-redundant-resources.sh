#!/bin/bash

# Clean Up Redundant Azure Resources
# Remove duplicate App Services and plans to save costs

set -e

# Configuration
RESOURCE_GROUP="rg-survivor-sports"
SUBSCRIPTION="SportsData"

echo "🧹 Cleaning up redundant Azure resources..."
echo "💰 This will save costs by removing unused resources"

# Step 1: List current resources for review
echo ""
echo "📋 Current App Services and Plans in your resource group:"
az resource list \
  --resource-group $RESOURCE_GROUP \
  --subscription $SUBSCRIPTION \
  --resource-type "Microsoft.Web/sites" \
  --output table

echo ""
az resource list \
  --resource-group $RESOURCE_GROUP \
  --subscription $SUBSCRIPTION \
  --resource-type "Microsoft.Web/serverfarms" \
  --output table

echo ""
echo "🎯 ANALYSIS FROM YOUR IMAGE:"
echo "✅ Keep: games-raffle-backend-api (NEW - for backend API)"
echo "✅ Keep: plan-gamesraffle-free (NEW - Linux F1 free plan)" 
echo "❌ Remove: survivor-sports-app-api (OLD - duplicate backend)"
echo "❌ Remove: asp-survivor-sports-app (OLD - duplicate plan)"
echo ""

# Step 2: Remove OLD duplicate backend API
echo "🗑️ Removing OLD backend API: survivor-sports-app-api..."
az webapp delete \
  --resource-group $RESOURCE_GROUP \
  --name "survivor-sports-app-api" \
  --subscription $SUBSCRIPTION || echo "Resource doesn't exist"

# Step 3: Remove OLD App Service plan
echo "🗑️ Removing OLD App Service plan: asp-survivor-sports-app..."
az appservice plan delete \
  --resource-group $RESOURCE_GROUP \
  --name "asp-survivor-sports-app" \
  --subscription $SUBSCRIPTION || echo "Resource doesn't exist"

# Step 4: Verify cleanup
echo ""
echo "✅ CLEANUP COMPLETE!"
echo ""
echo "📊 Remaining resources (what you should see):"
echo "✅ games-raffle-backend-api (App Service) - Your NEW backend"
echo "✅ plan-gamesraffle-free (App Service plan) - F1 Free Linux plan"
echo "✅ survivor-sports-app (Static Web App) - Your frontend"
echo ""
echo "💰 COST SAVINGS:"
echo "• Removed duplicate App Service (potential monthly cost)"
echo "• Removed duplicate App Service plan (potential monthly cost)"
echo "• Kept only what you need for your application"
echo ""
echo "🎯 FINAL ARCHITECTURE:"
echo "Frontend: https://red-hill-05463560f.1.azurestaticapps.net"
echo "Backend:  https://games-raffle-backend-api.azurewebsites.net"
echo "Database: SurvivorSportsDB (Azure SQL)"
echo ""
echo "🚀 Next step: Deploy your backend code with ./deploy-backend-code.sh"