# Survivor Sports Betting App - Azure Infrastructure Deployment Script (PowerShell)
# This script creates all Azure resources needed for the application

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "rg-survivor-sports",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "East US",
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "survivor-sports-app",
    
    [Parameter(Mandatory=$false)]
    [string]$SqlAdminUser = "survivoradmin",
    
    [Parameter(Mandatory=$true)]
    [SecureString]$SqlAdminPassword
)

# Configuration Variables
$SqlServerName = "sql-survivor-sports"
$SqlDbName = "SurvivorSportsDB"
$RedisName = "redis-survivor-sports"
$StorageName = "stsurvivor$(Get-Date -Format 'yyyyMMddHHmmss')"
$FunctionAppName = "func-survivor-sports"
$StaticWebAppName = "swa-survivor-sports"
$AppInsightsName = "ai-survivor-sports"

Write-Host "🚀 Starting Azure Infrastructure Deployment for Survivor Sports App" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

try {
    # Ensure user is logged in to Azure
    Write-Host "🔐 Checking Azure login status..." -ForegroundColor Yellow
    $context = Get-AzContext
    if (-not $context) {
        Write-Host "Please login to Azure first using Connect-AzAccount" -ForegroundColor Red
        exit 1
    }

    # Create Resource Group
    Write-Host "📦 Creating Resource Group: $ResourceGroupName" -ForegroundColor Yellow
    $resourceGroup = New-AzResourceGroup -Name $ResourceGroupName -Location $Location -Tag @{project="survivor-sports"; environment="production"} -Force
    
    # Create App Service Plan (Linux, Premium V3)
    Write-Host "🖥️  Creating App Service Plan" -ForegroundColor Yellow
    $appServicePlan = New-AzAppServicePlan `
        -ResourceGroupName $ResourceGroupName `
        -Name "asp-$AppName" `
        -Location $Location `
        -Tier "PremiumV3" `
        -NumberofWorkers 1 `
        -WorkerSize "Small" `
        -Linux

    # Create App Service for Node.js Backend
    Write-Host "🌐 Creating App Service for Backend API" -ForegroundColor Yellow
    $webApp = New-AzWebApp `
        -ResourceGroupName $ResourceGroupName `
        -Name "$AppName-api" `
        -AppServicePlan $appServicePlan.Id `
        -AssignIdentity $true

    # Configure App Service runtime stack
    Set-AzWebApp `
        -ResourceGroupName $ResourceGroupName `
        -Name "$AppName-api" `
        -LinuxFxVersion "NODE|18-lts"

    # Configure App Service settings
    Write-Host "⚙️  Configuring App Service settings" -ForegroundColor Yellow
    $appSettings = @{
        "NODE_ENV" = "production"
        "PORT" = "8000"
        "JWT_SECRET" = "your-super-secret-jwt-key-change-this"
        "SESSION_SECRET" = "your-session-secret-change-this"
        "WEBSITE_NODE_DEFAULT_VERSION" = "18.17.0"
    }
    
    Set-AzWebAppSettings -ResourceGroupName $ResourceGroupName -Name "$AppName-api" -AppSettings $appSettings

    # Create SQL Server
    Write-Host "🗄️  Creating SQL Server: $SqlServerName" -ForegroundColor Yellow
    $sqlServer = New-AzSqlServer `
        -ResourceGroupName $ResourceGroupName `
        -ServerName $SqlServerName `
        -Location $Location `
        -SqlAdministratorCredentials (New-Object System.Management.Automation.PSCredential($SqlAdminUser, $SqlAdminPassword))

    # Configure SQL Server firewall (allow Azure services)
    Write-Host "🔒 Configuring SQL Server firewall rules" -ForegroundColor Yellow
    New-AzSqlServerFirewallRule `
        -ResourceGroupName $ResourceGroupName `
        -ServerName $SqlServerName `
        -FirewallRuleName "AllowAzureServices" `
        -StartIpAddress "0.0.0.0" `
        -EndIpAddress "0.0.0.0"

    # Create SQL Database
    Write-Host "💾 Creating SQL Database: $SqlDbName" -ForegroundColor Yellow
    $sqlDatabase = New-AzSqlDatabase `
        -ResourceGroupName $ResourceGroupName `
        -ServerName $SqlServerName `
        -DatabaseName $SqlDbName `
        -RequestedServiceObjectiveName "S2" `
        -BackupStorageRedundancy "Local"

    # Create Azure Cache for Redis (Premium tier)
    Write-Host "⚡ Creating Azure Cache for Redis: $RedisName" -ForegroundColor Yellow
    $redisCache = New-AzRedisCache `
        -ResourceGroupName $ResourceGroupName `
        -Name $RedisName `
        -Location $Location `
        -Sku "Premium" `
        -Size "P1" `
        -EnableNonSslPort $false `
        -RedisConfiguration @{"maxmemory-policy"="allkeys-lru"} `
        -Tag @{project="survivor-sports"}

    # Create Storage Account
    Write-Host "📁 Creating Storage Account: $StorageName" -ForegroundColor Yellow
    $storageAccount = New-AzStorageAccount `
        -ResourceGroupName $ResourceGroupName `
        -Name $StorageName `
        -Location $Location `
        -SkuName "Standard_LRS" `
        -Kind "StorageV2" `
        -AccessTier "Hot"

    # Create blob container for ID verification
    $storageContext = $storageAccount.Context
    New-AzStorageContainer -Name "id-verification" -Context $storageContext -Permission Off

    # Create Application Insights
    Write-Host "📊 Creating Application Insights: $AppInsightsName" -ForegroundColor Yellow
    $appInsights = New-AzApplicationInsights `
        -ResourceGroupName $ResourceGroupName `
        -Name $AppInsightsName `
        -Location $Location `
        -Kind "web"

    # Create Function App
    Write-Host "⚙️  Creating Function App: $FunctionAppName" -ForegroundColor Yellow
    $functionApp = New-AzFunctionApp `
        -ResourceGroupName $ResourceGroupName `
        -Name $FunctionAppName `
        -StorageAccountName $StorageName `
        -PlanName "asp-$AppName" `
        -Runtime "node" `
        -RuntimeVersion "18" `
        -FunctionsVersion "4" `
        -AssignIdentity $true

    # Get connection strings and keys
    Write-Host "🔑 Retrieving connection strings and keys..." -ForegroundColor Yellow

    # SQL Connection String
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SqlAdminPassword))
    $sqlConnectionString = "Server=tcp:$SqlServerName.database.windows.net,1433;Initial Catalog=$SqlDbName;Persist Security Info=False;User ID=$SqlAdminUser;Password=$plainPassword;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

    # Redis Connection String
    $redisKeys = Get-AzRedisCacheKey -ResourceGroupName $ResourceGroupName -Name $RedisName
    $redisConnectionString = "$RedisName.redis.cache.windows.net:6380,password=$($redisKeys.PrimaryKey),ssl=True,abortConnect=False"

    # Storage Connection String
    $storageKeys = Get-AzStorageAccountKey -ResourceGroupName $ResourceGroupName -Name $StorageName
    $storageConnectionString = "DefaultEndpointsProtocol=https;AccountName=$StorageName;AccountKey=$($storageKeys[0].Value);EndpointSuffix=core.windows.net"

    # Application Insights Key
    $appInsightsKey = $appInsights.InstrumentationKey

    # Update App Service configuration with connection strings
    Write-Host "🔧 Configuring App Service with connection strings" -ForegroundColor Yellow
    $updatedAppSettings = @{
        "NODE_ENV" = "production"
        "PORT" = "8000"
        "JWT_SECRET" = "your-super-secret-jwt-key-change-this"
        "SESSION_SECRET" = "your-session-secret-change-this"
        "SQL_CONNECTION_STRING" = $sqlConnectionString
        "REDIS_CONNECTION_STRING" = $redisConnectionString
        "STORAGE_CONNECTION_STRING" = $storageConnectionString
        "APPINSIGHTS_INSTRUMENTATIONKEY" = $appInsightsKey
        "ESPN_API_KEY" = "your-espn-api-key-here"
        "WEBSITE_NODE_DEFAULT_VERSION" = "18.17.0"
    }
    
    Set-AzWebAppSettings -ResourceGroupName $ResourceGroupName -Name "$AppName-api" -AppSettings $updatedAppSettings

    # Update Function App configuration
    $functionAppSettings = @{
        "SQL_CONNECTION_STRING" = $sqlConnectionString
        "REDIS_CONNECTION_STRING" = $redisConnectionString
        "ESPN_API_KEY" = "your-espn-api-key-here"
        "APPINSIGHTS_INSTRUMENTATIONKEY" = $appInsightsKey
        "FUNCTIONS_WORKER_RUNTIME" = "node"
        "WEBSITE_NODE_DEFAULT_VERSION" = "18"
    }
    
    Update-AzFunctionAppSetting -ResourceGroupName $ResourceGroupName -Name $FunctionAppName -AppSetting $functionAppSettings

    Write-Host ""
    Write-Host "✅ Azure Infrastructure Deployment Complete!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "📋 Resource Summary:" -ForegroundColor Cyan
    Write-Host "   Resource Group: $ResourceGroupName" -ForegroundColor White
    Write-Host "   App Service: $AppName-api" -ForegroundColor White
    Write-Host "   SQL Server: $SqlServerName" -ForegroundColor White
    Write-Host "   SQL Database: $SqlDbName" -ForegroundColor White
    Write-Host "   Redis Cache: $RedisName" -ForegroundColor White
    Write-Host "   Storage Account: $StorageName" -ForegroundColor White
    Write-Host "   Function App: $FunctionAppName" -ForegroundColor White
    Write-Host "   Application Insights: $AppInsightsName" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Important URLs:" -ForegroundColor Cyan
    Write-Host "   Backend API: https://$AppName-api.azurewebsites.net" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Run database schema creation script" -ForegroundColor White
    Write-Host "   2. Deploy backend API code" -ForegroundColor White
    Write-Host "   3. Deploy frontend code" -ForegroundColor White
    Write-Host "   4. Configure GitHub Actions for CI/CD" -ForegroundColor White
    Write-Host "   5. Test the complete application" -ForegroundColor White
    Write-Host ""
    Write-Host "🔒 Security Reminders:" -ForegroundColor Red
    Write-Host "   - Change default SQL admin password" -ForegroundColor White
    Write-Host "   - Update JWT_SECRET and SESSION_SECRET" -ForegroundColor White
    Write-Host "   - Configure proper CORS settings" -ForegroundColor White
    Write-Host "   - Set up SSL certificates" -ForegroundColor White
    Write-Host "   - Review firewall rules" -ForegroundColor White
    Write-Host ""

    # Save configuration to file for later use
    $config = @{
        ResourceGroup = $ResourceGroupName
        SqlConnectionString = $sqlConnectionString
        RedisConnectionString = $redisConnectionString
        StorageConnectionString = $storageConnectionString
        AppInsightsKey = $appInsightsKey
        BackendUrl = "https://$AppName-api.azurewebsites.net"
    }
    
    $config | ConvertTo-Json | Out-File -FilePath "azure-config.json" -Encoding UTF8
    Write-Host "💾 Configuration saved to azure-config.json" -ForegroundColor Green

} catch {
    Write-Host "❌ Error during deployment: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack Trace: $($_.Exception.StackTrace)" -ForegroundColor Red
    exit 1
}