#!/usr/bin/env node

/**
 * Database Migration Script
 * Runs the PostgreSQL migration to create NFL tables and seed team data
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('../src/config/database');
const logger = require('../src/utils/logger');

async function runMigration() {
    console.log('🗄️ Running Database Migration for NFL Survivor Platform\n');
    console.log('════════════════════════════════════════════════════════');
    
    try {
        // Initialize the database connection
        await pool.initialize();
        console.log('✅ Database connection initialized');
        
        // Read the migration file
        const migrationPath = path.join(__dirname, '..', '..', 'database', 'migrate-to-postgresql.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📖 Migration file loaded');
        console.log(`📄 File: ${migrationPath}`);
        console.log(`📊 Size: ${(migrationSQL.length / 1024).toFixed(1)} KB\n`);
        
        // Split the SQL into individual statements and filter out comments/empty lines
        console.log('🚀 Executing migration...');
        
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== '\n');
        
        console.log(`   📊 Found ${statements.length} SQL statements to execute\n`);
        
        try {
            // Execute the migration statements one by one
            await pool.query('BEGIN');
            console.log('   📝 Transaction started');
            
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                
                // Skip empty statements and pure comments
                if (!statement || statement.startsWith('--') || statement.match(/^\s*$/)) {
                    continue;
                }
                
                try {
                    await pool.query(statement);
                    console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
                    
                    // Log important statements
                    if (statement.includes('CREATE TABLE')) {
                        const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/)?.[1];
                        console.log(`      🗂️ Created table: ${tableName}`);
                    } else if (statement.includes('INSERT INTO nfl_teams')) {
                        console.log('      🏈 Inserted NFL teams data');
                    } else if (statement.includes('CREATE INDEX')) {
                        const indexName = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/)?.[1];
                        console.log(`      📊 Created index: ${indexName}`);
                    }
                    
                } catch (stmtError) {
                    // Some errors we can safely ignore (like "already exists")
                    if (stmtError.message.includes('already exists')) {
                        console.log(`   ⚠️ Statement ${i + 1} skipped (already exists)`);
                        continue;
                    }
                    
                    console.log(`   ❌ Statement ${i + 1} failed:`);
                    console.log(`      SQL: ${statement.substring(0, 100)}...`);
                    console.log(`      Error: ${stmtError.message}`);
                    throw stmtError;
                }
            }
            
            await pool.query('COMMIT');
            console.log('   📝 Transaction committed');
            
            console.log('\n🎉 Migration completed successfully!');
            
        } catch (error) {
            await pool.query('ROLLBACK');
            console.log('   ❌ Transaction rolled back due to error');
            throw error;
        }
        
        // Verify the tables were created
        console.log('\n🔍 Verifying migration results...');
        
        // Check NFL teams table
        const teamsResult = await pool.query('SELECT COUNT(*) as count FROM nfl_teams');
        console.log(`   🏈 NFL Teams: ${teamsResult.rows[0].count} teams loaded`);
        
        // Check NFL games table exists
        const gamesTableResult = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'nfl_games'
            )
        `);
        console.log(`   🎮 NFL Games table: ${gamesTableResult.rows[0].exists ? '✅ Created' : '❌ Missing'}`);
        
        // Check contests table exists
        const contestsTableResult = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'contests'
            )
        `);
        console.log(`   🏆 Contests table: ${contestsTableResult.rows[0].exists ? '✅ Created' : '❌ Missing'}`);
        
        // Check users table exists
        const usersTableResult = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            )
        `);
        console.log(`   👥 Users table: ${usersTableResult.rows[0].exists ? '✅ Created' : '❌ Missing'}`);
        
        // Show sample teams data
        const sampleTeams = await pool.query('SELECT team_code, city, name FROM nfl_teams ORDER BY team_code LIMIT 5');
        console.log('\n   📊 Sample NFL Teams:');
        sampleTeams.rows.forEach(team => {
            console.log(`      ${team.team_code}: ${team.city} ${team.name}`);
        });
        
        console.log('\n════════════════════════════════════════════════════════');
        console.log('✅ Database migration completed successfully!');
        console.log('\n🔄 Next Steps:');
        console.log('   1. ✅ All NFL tables created and teams seeded');
        console.log('   2. 🚀 ESPN API integration can now store game data');
        console.log('   3. 🏈 Ready to test full NFL Survivor functionality');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        
        // Show helpful debugging info
        if (error.message.includes('relation') && error.message.includes('already exists')) {
            console.log('\n💡 Tables may already exist - this is usually not an error');
            console.log('   Run verification script to check current state');
        } else if (error.message.includes('permission')) {
            console.log('\n💡 Permission error - check database credentials');
        } else {
            console.error('Stack trace:', error.stack);
        }
        
        return false;
    }
    
    return true;
}

// Run the migration
if (require.main === module) {
    runMigration()
        .then((success) => {
            if (success) {
                console.log('\n🎉 Migration script completed successfully');
                process.exit(0);
            } else {
                console.log('\n❌ Migration script failed');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Migration script crashed:', error.message);
            process.exit(1);
        });
}

module.exports = { runMigration };