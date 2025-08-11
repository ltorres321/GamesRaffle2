#!/bin/bash

# SAFE Resource Analysis - Don't delete, just understand what we have
# Let the user decide what to keep based on actual usage

set -e

# Configuration
RESOURCE_GROUP="rg-survivor-sports"
SUBSCRIPTION="SportsData"

echo "🔍 SAFE ANALYSIS: Understanding your Azure resources..."
echo "📋 This script won't delete anything - just provides information"

echo ""
echo "=== APP SERVICES ==="
az webapp list \
  --resource-group $RESOURCE_GROUP \
  --subscription $SUBSCRIPTION \
  --query "[].{Name:name, State:state, Plan:serverFarmId, Runtime:linuxFxVersion, Location:location, Created:null}" \
  --output table

echo ""
echo "=== FUNCTION APPS ==="
az functionapp list \
  --resource-group $RESOURCE_GROUP \
  --subscription $SUBSCRIPTION \
  --query "[].{Name:name, State:state, Plan:serverFarmId, Runtime:linuxFxVersion, Location:location}" \
  --output table

echo ""
echo "=== APP SERVICE PLANS ==="
az appservice plan list \
  --resource-group $RESOURCE_GROUP \
  --subscription $SUBSCRIPTION \
  --query "[].{Name:name, Tier:sku.tier, Size:sku.name, OS:kind, Apps:numberOfSites}" \
  --output table

echo ""
echo "🎯 DETAILED ANALYSIS:"
echo ""

# Analyze func-survivor-sports
echo "📊 FUNCTION APP: func-survivor-sports"
FUNC_INFO=$(az functionapp show \
  --resource-group $RESOURCE_GROUP \
  --name "func-survivor-sports" \
  --subscription $SUBSCRIPTION \
  --query "{State:state, Runtime:linuxFxVersion, Plan:serverFarmId}" \
  --output json 2>/dev/null || echo "{}")

if [[ "$FUNC_INFO" != "{}" ]]; then
  echo "   Status: Active"
  echo "   Purpose: This was created by our infrastructure scripts"
  echo "   Likely used for: Scheduled tasks (Tuesday 3am score checking), background processing"
  echo "   From: azure-infrastructure/deploy-infrastructure.sh"
  echo "   ⚠️  WARNING: May break scheduled jobs if deleted!"
else
  echo "   Status: Not found or already deleted"
fi

echo ""
echo "📊 APP SERVICE PLAN: asp-survivor-sports-app"
PLAN_INFO=$(az appservice plan show \
  --resource-group $RESOURCE_GROUP \
  --name "asp-survivor-sports-app" \
  --subscription $SUBSCRIPTION \
  --query "{Tier:sku.tier, Apps:numberOfSites, OS:kind}" \
  --output json 2>/dev/null || echo "{}")

if [[ "$PLAN_INFO" != "{}" ]]; then
  echo "   Status: Active"
  echo "   Hosting: func-survivor-sports (Function App)"
  echo "   Purpose: Infrastructure for background processing"
  echo "   From: Original azure infrastructure deployment"
  echo "   ⚠️  WARNING: Required for Function App to work!"
else
  echo "   Status: Not found or already deleted"
fi

echo ""
echo "🤔 RECOMMENDATIONS:"
echo ""
echo "✅ KEEP if you need:"
echo "   • Scheduled score checking (Tuesday 3am)"
echo "   • Background job processing"
echo "   • Automated game state updates"
echo ""
echo "❓ INVESTIGATE what func-survivor-sports actually does:"
echo "   1. Check Functions inside the Function App"
echo "   2. Review code deployed to it"
echo "   3. Check if it's running scheduled jobs"
echo ""
echo "💡 SAFE APPROACH:"
echo "   1. Keep everything for now"
echo "   2. Focus on deploying your new backend"
echo "   3. Monitor usage over time"
echo "   4. Remove only when you're certain they're unused"

echo ""
echo "📋 NEXT STEPS:"
echo "1. Deploy your new backend: ./fix-linux-backend.sh"
echo "2. Deploy code: ./deploy-backend-code.sh"
echo "3. Test the application fully"
echo "4. Then decide about cleanup"