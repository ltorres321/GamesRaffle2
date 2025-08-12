#!/usr/bin/env node

const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration from .env
const config = {
    server: 'sql-survivor-sports.database.windows.net',
    database: 'SurvivorSportsDB',
    user: 'survivoradmin',
    password: 'SurvivorApp2024!',
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true,
        requestTimeout: 300000, // 5 minutes for large operations
        connectionTimeout: 30000
    }
};

async function executeSqlFile(filePath, pool) {
    console.log(`\n📄 Executing SQL file: ${filePath}`);
    
    try {
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        
        // Split by GO statements and execute each batch separately
        const batches = sqlContent
            .split(/^\s*GO\s*$/mi)
            .map(batch => batch.trim())
            .filter(batch => batch.length > 0);
        
        console.log(`   Found ${batches.length} SQL batches to execute`);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            if (batch.length > 0) {
                console.log(`   Executing batch ${i + 1}/${batches.length}...`);
                try {
                    await pool.request().query(batch);
                    console.log(`   ✅ Batch ${i + 1} completed successfully`);
                } catch (batchError) {
                    console.error(`   ❌ Error in batch ${i + 1}:`, batchError.message);
                    // Continue with other batches for schema creation
                    if (!batchError.message.includes('already exists')) {
                        throw batchError;
                    }
                }
            }
        }
        
        console.log(`✅ Successfully executed ${filePath}`);
        
    } catch (error) {
        console.error(`❌ Error executing ${filePath}:`, error.message);
        throw error;
    }
}

async function deployDatabase() {
    let pool = null;
    
    try {
        console.log('🚀 Starting database schema deployment...');
        console.log('📡 Connecting to Azure SQL Database...');
        console.log(`   Server: ${config.server}`);
        console.log(`   Database: ${config.database}`);
        
        // Connect to database
        pool = await sql.connect(config);
        console.log('✅ Connected to Azure SQL Database successfully');
        
        // Get absolute paths to SQL files
        const schemaFile = path.resolve(__dirname, '../../database/create-schema-sportradar.sql');
        const seedFile = path.resolve(__dirname, '../../database/seed-data-sportradar.sql');
        
        // Check if files exist
        if (!fs.existsSync(schemaFile)) {
            throw new Error(`Schema file not found: ${schemaFile}`);
        }
        
        if (!fs.existsSync(seedFile)) {
            throw new Error(`Seed file not found: ${seedFile}`);
        }
        
        // Execute schema creation
        await executeSqlFile(schemaFile, pool);
        
        // Execute seed data
        await executeSqlFile(seedFile, pool);
        
        // Verify deployment
        console.log('\n🔍 Verifying deployment...');
        
        const tablesResult = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
            ORDER BY TABLE_NAME
        `);
        
        const teamCountResult = await pool.request().query(`SELECT COUNT(*) as count FROM dbo.Teams`);
        const userCountResult = await pool.request().query(`SELECT COUNT(*) as count FROM dbo.Users`);
        const gameCountResult = await pool.request().query(`SELECT COUNT(*) as count FROM dbo.SurvivorGames`);
        
        console.log('\n📊 Deployment Summary:');
        console.log(`   Tables created: ${tablesResult.recordset.length}`);
        console.log(`   NFL Teams: ${teamCountResult.recordset[0].count}`);
        console.log(`   Users: ${userCountResult.recordset[0].count}`);
        console.log(`   Survivor Games: ${gameCountResult.recordset[0].count}`);
        
        // List all tables
        console.log('\n📋 Created Tables:');
        tablesResult.recordset.forEach(table => {
            console.log(`   ✓ ${table.TABLE_NAME}`);
        });
        
        console.log('\n🎉 Database deployment completed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('   1. Backend API can now connect to the database');
        console.log('   2. Admin user is ready (username: admin, password: Admin123!)');
        console.log('   3. All 32 NFL teams are populated');
        console.log('   4. SportRadar integration ready for team sync');
        
    } catch (error) {
        console.error('❌ Database deployment failed:', error.message);
        
        if (error.code === 'ELOGIN') {
            console.error('💡 Possible solutions:');
            console.error('   - Verify username and password in .env file');
            console.error('   - Check if your IP is whitelisted on Azure SQL firewall');
            console.error('   - Verify the server name is correct');
        } else if (error.code === 'ETIMEOUT') {
            console.error('💡 Connection timeout - check network connectivity');
        }
        
        process.exit(1);
        
    } finally {
        if (pool) {
            try {
                await pool.close();
                console.log('🔒 Database connection closed');
            } catch (closeError) {
                console.error('Warning: Error closing database connection:', closeError.message);
            }
        }
    }
}

// Execute deployment
if (require.main === module) {
    deployDatabase();
}

module.exports = { deployDatabase };