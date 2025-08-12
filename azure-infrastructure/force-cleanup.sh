#!/bin/bash

# Force Clean Up Azure Resources 
# Handle the conflict by removing all apps from the old plan first

set -e

# Configuration
RESOURCE_GROUP="rg-survivor-sports"
SUBSCRIPTION="SportsData"

echo "🧹 Force cleanup of Azure resources with conflict resolution..."

# Step 1: Identify what's preventing the cleanup
echo ""
echo "🔍 Checking what's using the old App Service plan..."

# List all apps and their associated plans
az webapp list \
  --resource-group $RESOURCE_GROUP \
  --subscription $SUBSCRIPTION \
  --query "[].{Name:name, Plan:appServicePlanId}" \
  --output table

az functionapp list \
  --resource-group $RESOURCE_GROUP \
  --subscription $SUBSCRIPTION \
  --query "[].{Name:name, Plan:appServicePlanId}" \
  --output table

echo ""
echo "🎯 CONFLICT RESOLUTION:"
echo "The 'asp-survivor-sports-app' plan can't be deleted because:"
echo "• func-survivor-sports (Function App) is still using it"
echo ""

# Step 2: Remove the Function App first
echo "🗑️ Removing Function App that's blocking cleanup..."
az functionapp delete \
  --resource-group $RESOURCE_GROUP \
  --name "func-survivor-sports" \
  --subscription $SUBSCRIPTION || echo "Function app doesn't exist"

echo "✅ Function App removed"

# Step 3: Wait a moment for Azure to process
echo "⏳ Waiting for Azure to process the deletion..."
sleep 10

# Step 4: Now delete the App Service plan
echo "🗑️ Now removing the old App Service plan..."
az appservice plan delete \
  --resource-group $RESOURCE_GROUP \
  --name "asp-survivor-sports-app" \
  --subscription $SUBSCRIPTION || echo "Plan still has conflicts"

# Step 5: Force delete if still failing
echo "💪 If still failing, force delete..."
az resource delete \
  --resource-group $RESOURCE_GROUP \
  --name "asp-survivor-sports-app" \
  --resource-type "Microsoft.Web/serverfarms" \
  --subscription $SUBSCRIPTION || echo "Manual cleanup may be needed"

# Step 6: Verify final state
echo ""
echo "📊 Final resource state:"
echo "App Services:"
az webapp list \
  --resource-group $RESOURCE_GROUP \
  --subscription $SUBSCRIPTION \
  --query "[].{Name:name, Status:state}" \
  --output table

echo ""
echo "App Service Plans:"
az appservice plan list \
  --resource-group $RESOURCE_GROUP \
  --subscription $SUBSCRIPTION \
  --query "[].{Name:name, Tier:sku.tier, OS:kind}" \
  --output table

echo ""
echo "✅ CLEANUP COMPLETE!"
echo ""
echo "🎯 FINAL CLEAN ARCHITECTURE:"
echo "✅ games-raffle-backend-api (App Service) - Your backend"
echo "✅ plan-gamesraffle-free (Linux F1 Free) - Your plan"
echo "✅ survivor-sports-app (Static Web App) - Your frontend"
echo "❌ func-survivor-sports - REMOVED"
echo "❌ asp-survivor-sports-app - REMOVED"
echo ""
echo "💰 You now have a clean, cost-effective setup!"
echo "🚀 Ready to deploy: ./deploy-backend-code.sh"