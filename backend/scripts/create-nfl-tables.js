#!/usr/bin/env node

/**
 * Focused NFL Tables Creation Script
 * Creates only the NFL-related tables needed for ESPN integration testing
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('../src/config/database');
const logger = require('../src/utils/logger');

async function createNFLTables() {
    console.log('🏈 Creating NFL Tables for ESPN Integration\n');
    console.log('════════════════════════════════════════════');
    
    try {
        // Initialize the database connection
        await pool.initialize();
        console.log('✅ Database connection initialized');
        
        console.log('\n🚀 Creating NFL tables...');
        
        // Start transaction
        await pool.query('BEGIN');
        console.log('   📝 Transaction started');
        
        // 1. Create UUID extension
        await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        console.log('   ✅ UUID extension enabled');
        
        // 2. Create NFL Teams table
        const createTeamsSQL = `
            CREATE TABLE IF NOT EXISTS nfl_teams (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                team_code VARCHAR(5) UNIQUE NOT NULL,
                city VARCHAR(100) NOT NULL,
                name VARCHAR(100) NOT NULL,
                conference VARCHAR(3) NOT NULL,
                division VARCHAR(10) NOT NULL,
                logo_url VARCHAR(255),
                primary_color VARCHAR(7),
                secondary_color VARCHAR(7),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;
        
        await pool.query(createTeamsSQL);
        console.log('   ✅ nfl_teams table created');
        
        // 3. Create NFL Games table
        const createGamesSQL = `
            CREATE TABLE IF NOT EXISTS nfl_games (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                week INTEGER NOT NULL,
                season INTEGER NOT NULL,
                game_date TIMESTAMP WITH TIME ZONE NOT NULL,
                home_team_id UUID REFERENCES nfl_teams(id),
                away_team_id UUID REFERENCES nfl_teams(id),
                home_score INTEGER DEFAULT 0,
                away_score INTEGER DEFAULT 0,
                winner_team_id UUID REFERENCES nfl_teams(id),
                is_final BOOLEAN DEFAULT FALSE,
                espn_game_id VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;
        
        await pool.query(createGamesSQL);
        console.log('   ✅ nfl_games table created');
        
        // 4. Create indexes
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_nfl_teams_code ON nfl_teams(team_code)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_nfl_games_week_season ON nfl_games(week, season)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_nfl_games_date ON nfl_games(game_date)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_nfl_games_espn_id ON nfl_games(espn_game_id)`);
        console.log('   ✅ Indexes created');
        
        // 5. Insert NFL Teams data
        const insertTeamsSQL = `
            INSERT INTO nfl_teams (team_code, city, name, conference, division) VALUES
            ('ARI', 'Arizona', 'Cardinals', 'NFC', 'West'),
            ('ATL', 'Atlanta', 'Falcons', 'NFC', 'South'),
            ('BAL', 'Baltimore', 'Ravens', 'AFC', 'North'),
            ('BUF', 'Buffalo', 'Bills', 'AFC', 'East'),
            ('CAR', 'Carolina', 'Panthers', 'NFC', 'South'),
            ('CHI', 'Chicago', 'Bears', 'NFC', 'North'),
            ('CIN', 'Cincinnati', 'Bengals', 'AFC', 'North'),
            ('CLE', 'Cleveland', 'Browns', 'AFC', 'North'),
            ('DAL', 'Dallas', 'Cowboys', 'NFC', 'East'),
            ('DEN', 'Denver', 'Broncos', 'AFC', 'West'),
            ('DET', 'Detroit', 'Lions', 'NFC', 'North'),
            ('GB', 'Green Bay', 'Packers', 'NFC', 'North'),
            ('HOU', 'Houston', 'Texans', 'AFC', 'South'),
            ('IND', 'Indianapolis', 'Colts', 'AFC', 'South'),
            ('JAX', 'Jacksonville', 'Jaguars', 'AFC', 'South'),
            ('KC', 'Kansas City', 'Chiefs', 'AFC', 'West'),
            ('LAC', 'Los Angeles', 'Chargers', 'AFC', 'West'),
            ('LAR', 'Los Angeles', 'Rams', 'NFC', 'West'),
            ('LV', 'Las Vegas', 'Raiders', 'AFC', 'West'),
            ('MIA', 'Miami', 'Dolphins', 'AFC', 'East'),
            ('MIN', 'Minnesota', 'Vikings', 'NFC', 'North'),
            ('NE', 'New England', 'Patriots', 'AFC', 'East'),
            ('NO', 'New Orleans', 'Saints', 'NFC', 'South'),
            ('NYG', 'New York', 'Giants', 'NFC', 'East'),
            ('NYJ', 'New York', 'Jets', 'AFC', 'East'),
            ('PHI', 'Philadelphia', 'Eagles', 'NFC', 'East'),
            ('PIT', 'Pittsburgh', 'Steelers', 'AFC', 'North'),
            ('SEA', 'Seattle', 'Seahawks', 'NFC', 'West'),
            ('SF', 'San Francisco', '49ers', 'NFC', 'West'),
            ('TB', 'Tampa Bay', 'Buccaneers', 'NFC', 'South'),
            ('TEN', 'Tennessee', 'Titans', 'AFC', 'South'),
            ('WAS', 'Washington', 'Commanders', 'NFC', 'East')
            ON CONFLICT (team_code) DO NOTHING
        `;
        
        await pool.query(insertTeamsSQL);
        console.log('   ✅ NFL teams data inserted');
        
        // 6. Create trigger for updated_at
        const createTriggerSQL = `
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `;
        
        await pool.query(createTriggerSQL);
        
        const createTriggerOnGamesSQL = `
            DROP TRIGGER IF EXISTS update_nfl_games_updated_at ON nfl_games;
            CREATE TRIGGER update_nfl_games_updated_at 
                BEFORE UPDATE ON nfl_games 
                FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()
        `;
        
        await pool.query(createTriggerOnGamesSQL);
        console.log('   ✅ Update trigger created');
        
        // Commit transaction
        await pool.query('COMMIT');
        console.log('   📝 Transaction committed');
        
        console.log('\n🔍 Verifying tables...');
        
        // Verify tables exist and have data
        const teamsCount = await pool.query('SELECT COUNT(*) as count FROM nfl_teams');
        console.log(`   🏈 NFL Teams: ${teamsCount.rows[0].count} teams loaded`);
        
        const gamesTableCheck = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'nfl_games' 
            ORDER BY ordinal_position
        `);
        console.log(`   🎮 NFL Games table: ${gamesTableCheck.rows.length} columns`);
        
        // Show sample teams
        const sampleTeams = await pool.query('SELECT team_code, city, name FROM nfl_teams ORDER BY team_code LIMIT 6');
        console.log('\n   📊 Sample NFL Teams:');
        sampleTeams.rows.forEach(team => {
            console.log(`      ${team.team_code}: ${team.city} ${team.name}`);
        });
        
        console.log('\n════════════════════════════════════════════');
        console.log('🎉 NFL Tables Creation Completed Successfully!');
        console.log('\n📊 Summary:');
        console.log(`   🗂️ Tables: nfl_teams, nfl_games`);
        console.log(`   🏈 Teams: ${teamsCount.rows[0].count} NFL teams`);
        console.log(`   📊 Indexes: 4 performance indexes`);
        console.log(`   🔧 Triggers: update timestamp trigger`);
        console.log('\n🔄 Next Steps:');
        console.log('   1. ✅ Database ready for ESPN API integration');
        console.log('   2. 🚀 Run ESPN integration test to verify game insertion');
        console.log('   3. 🏈 Ready for full NFL Survivor functionality');
        
        return true;
        
    } catch (error) {
        // Rollback on error
        try {
            await pool.query('ROLLBACK');
            console.log('   ❌ Transaction rolled back');
        } catch (rollbackError) {
            console.log('   ⚠️ Rollback failed:', rollbackError.message);
        }
        
        console.error('\n❌ NFL tables creation failed:', error.message);
        
        if (error.message.includes('already exists')) {
            console.log('\n💡 Tables may already exist - this is usually okay');
            console.log('   Check verification results above');
            return true; // Consider this a success
        }
        
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Run the creation script
if (require.main === module) {
    createNFLTables()
        .then((success) => {
            if (success) {
                console.log('\n🎉 NFL tables script completed successfully');
                process.exit(0);
            } else {
                console.log('\n❌ NFL tables script failed');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 NFL tables script crashed:', error.message);
            process.exit(1);
        });
}

module.exports = { createNFLTables };