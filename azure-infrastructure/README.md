# Azure Infrastructure Deployment Guide

This guide provides step-by-step instructions for deploying the Survivor Sports Betting App infrastructure to Azure.

## Prerequisites

- Azure CLI installed and configured
- PowerShell (for Windows users) or Bash (for Linux/Mac users)
- An active Azure subscription
- Appropriate permissions to create resources in Azure

## Deployment Options

Choose one of the following deployment methods:

### Option 1: Bash Script (Linux/Mac/WSL)

```bash
# Make the script executable
chmod +x deploy-infrastructure.sh

# Run the deployment
./deploy-infrastructure.sh
```

### Option 2: PowerShell Script (Windows)

```powershell
# Set execution policy (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run the deployment with required password parameter
$password = ConvertTo-SecureString "YourSecurePassword123!" -AsPlainText -Force
.\deploy-infrastructure.ps1 -SqlAdminPassword $password

# Or with custom parameters
.\deploy-infrastructure.ps1 -ResourceGroupName "my-survivor-app" -Location "West US 2" -AppName "my-survivor-app" -SqlAdminPassword $password
```

### Option 3: ARM Template Deployment

#### Using Azure CLI

```bash
# Create resource group
az group create --name rg-survivor-sports --location "East US"

# Deploy ARM template
az deployment group create \
  --resource-group rg-survivor-sports \
  --template-file azuredeploy.json \
  --parameters azuredeploy.parameters.json
```

#### Using PowerShell

```powershell
# Create resource group
New-AzResourceGroup -Name "rg-survivor-sports" -Location "East US"

# Deploy ARM template
New-AzResourceGroupDeployment `
  -ResourceGroupName "rg-survivor-sports" `
  -TemplateFile "azuredeploy.json" `
  -TemplateParameterFile "azuredeploy.parameters.json"
```

## Required Configuration Changes

Before deploying, update the following values in your chosen deployment method:

### Security Settings (CRITICAL)

1. **SQL Server Password**: Change the default password in scripts or parameters file
2. **JWT Secret**: Generate a strong, unique JWT secret key
3. **Session Secret**: Generate a strong, unique session secret key
4. **ESPN API Key**: Obtain and configure your ESPN API key

### Script Configuration

If using bash or PowerShell scripts, update these variables at the top of the file:

```bash
# In deploy-infrastructure.sh
SQL_ADMIN_PASSWORD="YourSecurePassword123!"
```

```powershell
# In deploy-infrastructure.ps1 - pass as parameter
-SqlAdminPassword (ConvertTo-SecureString "YourSecurePassword123!" -AsPlainText -Force)
```

### ARM Template Configuration

Update `azuredeploy.parameters.json`:

```json
{
  "sqlAdministratorLoginPassword": {
    "value": "YourSecurePassword123!"
  },
  "jwtSecret": {
    "value": "your-unique-jwt-secret-key-here"
  },
  "sessionSecret": {
    "value": "your-unique-session-secret-key-here"
  },
  "espnApiKey": {
    "value": "your-espn-api-key-here"
  }
}
```

## Deployment Process

### 1. Login to Azure

```bash
# Azure CLI
az login
az account set --subscription "your-subscription-id"
```

```powershell
# PowerShell
Connect-AzAccount
Set-AzContext -SubscriptionId "your-subscription-id"
```

### 2. Choose Your Region

The scripts default to **East US**. To use a different region, update the `LOCATION` variable in scripts or the `location` parameter in ARM templates.

### 3. Run Deployment

Execute your chosen deployment method from above. The process will take 10-15 minutes.

### 4. Verify Deployment

After deployment completes, verify the following resources were created:

- **Resource Group**: `rg-survivor-sports`
- **App Service**: `survivor-sports-app-api`
- **SQL Server**: `sql-survivor-sports`
- **SQL Database**: `SurvivorSportsDB`
- **Redis Cache**: `redis-survivor-sports`
- **Storage Account**: `stsurvivor[timestamp]`
- **Function App**: `func-survivor-sports`
- **Application Insights**: `ai-survivor-sports`

## Post-Deployment Configuration

### 1. Database Schema Setup

After infrastructure deployment, run the database schema creation script:

```bash
# This will be created in the next step
./database/create-schema.sql
```

### 2. Configure CORS

Update CORS settings for your App Service to allow your frontend domain:

```bash
az webapp cors add --resource-group rg-survivor-sports --name survivor-sports-app-api --allowed-origins "https://your-frontend-domain.com"
```

### 3. SSL Configuration

Enable HTTPS-only for production:

```bash
az webapp update --resource-group rg-survivor-sports --name survivor-sports-app-api --https-only true
```

### 4. Custom Domain (Optional)

Configure custom domains for production deployment:

```bash
az webapp config hostname add --resource-group rg-survivor-sports --webapp-name survivor-sports-app-api --hostname "api.yourdomain.com"
```

## Resource Costs (Estimated Monthly)

- **App Service Plan (P1v3)**: ~$146/month
- **SQL Database (S2)**: ~$75/month  
- **Redis Cache (Premium P1)**: ~$251/month
- **Storage Account**: ~$5/month
- **Function App**: ~$0-20/month (consumption-based)
- **Application Insights**: ~$0-10/month (based on usage)

**Total Estimated Cost**: ~$477-507/month

## Security Checklist

After deployment, ensure:

- [ ] Changed default SQL admin password
- [ ] Updated JWT and session secrets
- [ ] Configured proper firewall rules
- [ ] Enabled HTTPS-only
- [ ] Set up proper CORS policies
- [ ] Configured SSL certificates
- [ ] Reviewed storage account access policies
- [ ] Set up monitoring and alerting

## Troubleshooting

### Common Issues

1. **Deployment Fails**: Check Azure subscription limits and permissions
2. **SQL Connection Issues**: Verify firewall rules and connection strings
3. **Redis Connection Issues**: Check Redis configuration and connection string format
4. **Storage Access Issues**: Verify storage account keys and connection strings

### Getting Help

- Check Azure Activity Log for detailed error messages
- Use Azure Cloud Shell for deployment if local CLI has issues
- Verify subscription quotas and limits
- Check resource naming conflicts

## Next Steps

After successful infrastructure deployment:

1. ✅ Infrastructure deployed
2. ⬜ Create database schema
3. ⬜ Deploy backend API code
4. ⬜ Deploy frontend application
5. ⬜ Configure CI/CD pipeline
6. ⬜ Test end-to-end functionality

## Cleanup

To remove all resources:

```bash
az group delete --name rg-survivor-sports --yes --no-wait
```

⚠️ **Warning**: This will permanently delete all resources and data!