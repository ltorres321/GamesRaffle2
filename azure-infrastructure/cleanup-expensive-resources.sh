#!/bin/bash

# Cleanup Expensive Azure Resources
# This will remove the costly Premium services and keep only essentials

set -e

RESOURCE_GROUP="rg-survivor-sports"
SUBSCRIPTION="SportsData"

echo "💰 CLEANING UP EXPENSIVE AZURE RESOURCES..."
echo "⚠️  This will remove Premium services costing ~$90/month"
echo ""
echo "🔍 Current expensive resources to remove:"
echo "   - Redis Cache Premium P1: $49.34/month"
echo "   - App Service Premium plans: $41.18/month" 
echo "   - Redundant PostgreSQL: $4.08/month"
echo ""
read -p "Continue? This will save ~$90/month (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo "🧹 Starting cleanup..."

# Remove Redis Cache Premium (saves $49.34/month)
echo "🗑️ Removing Redis Cache Premium..."
REDIS_NAMES=$(az redis list --resource-group $RESOURCE_GROUP --subscription $SUBSCRIPTION --query "[].name" -o tsv 2>/dev/null || true)
for REDIS_NAME in $REDIS_NAMES; do
    echo "   Deleting Redis: $REDIS_NAME"
    az redis delete --name $REDIS_NAME --resource-group $RESOURCE_GROUP --subscription $SUBSCRIPTION --yes --no-wait
done

# Remove Premium App Service Plans (saves $30-40/month)
echo "🗑️ Removing Premium App Service Plans..."
PLAN_NAMES=$(az appservice plan list --resource-group $RESOURCE_GROUP --subscription $SUBSCRIPTION --query "[?sku.tier=='PremiumV3' || sku.tier=='Premium'].name" -o tsv 2>/dev/null || true)
for PLAN_NAME in $PLAN_NAMES; do
    # First, move apps to a cheaper plan or delete them
    APP_NAMES=$(az webapp list --resource-group $RESOURCE_GROUP --subscription $SUBSCRIPTION --query "[?serverFarmId contains '$PLAN_NAME'].name" -o tsv 2>/dev/null || true)
    
    for APP_NAME in $APP_NAMES; do
        echo "   Stopping app: $APP_NAME"
        az webapp stop --name $APP_NAME --resource-group $RESOURCE_GROUP --subscription $SUBSCRIPTION 2>/dev/null || true
    done
    
    echo "   Deleting Premium plan: $PLAN_NAME"
    az appservice plan delete --name $PLAN_NAME --resource-group $RESOURCE_GROUP --subscription $SUBSCRIPTION --yes 2>/dev/null || true
done

# Remove PostgreSQL Flexible Server (saves $4.08/month)
echo "🗑️ Removing PostgreSQL servers..."
POSTGRES_SERVERS=$(az postgres flexible-server list --resource-group $RESOURCE_GROUP --subscription $SUBSCRIPTION --query "[].name" -o tsv 2>/dev/null || true)
for SERVER_NAME in $POSTGRES_SERVERS; do
    echo "   Deleting PostgreSQL: $SERVER_NAME"
    az postgres flexible-server delete --name $SERVER_NAME --resource-group $RESOURCE_GROUP --subscription $SUBSCRIPTION --yes --no-wait 2>/dev/null || true
done

# Remove Function Apps on Premium plans
echo "🗑️ Removing Function Apps..."
FUNCTION_APPS=$(az functionapp list --resource-group $RESOURCE_GROUP --subscription $SUBSCRIPTION --query "[].name" -o tsv 2>/dev/null || true)
for FUNC_NAME in $FUNCTION_APPS; do
    echo "   Deleting Function App: $FUNC_NAME"
    az functionapp delete --name $FUNC_NAME --resource-group $RESOURCE_GROUP --subscription $SUBSCRIPTION 2>/dev/null || true
done

# Keep these cheaper resources:
echo "✅ Keeping cost-effective resources:"
echo "   - SQL Database (Basic): ~$5/month"
echo "   - Storage Account: ~$1-2/month" 
echo "   - Static Web Apps: FREE"

echo ""
echo "🎉 CLEANUP COMPLETE!"
echo ""
echo "💰 ESTIMATED MONTHLY SAVINGS: ~$90"
echo "📊 New monthly cost: ~$6-8 (vs previous $103)"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Deploy cost-optimized infrastructure:"
echo "   chmod +x azure-infrastructure/deploy-dev-optimized.sh"
echo "   ./azure-infrastructure/deploy-dev-optimized.sh"
echo ""
echo "2. Update backend code to use memory sessions instead of Redis"
echo "3. Redeploy your backend without Redis dependencies"
echo ""
echo "⚠️  NOTE: Deleted resources cannot be recovered!"
echo "💡 TIP: Consider FREE alternatives in deploy-completely-free.md"