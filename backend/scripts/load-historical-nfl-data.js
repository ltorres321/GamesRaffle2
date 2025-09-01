#!/usr/bin/env node

const EspnApiService = require('../src/services/espnApiService');
const pool = require('../src/config/database');
const logger = require('../src/utils/logger');

/**
 * Load Historical NFL Data from ESPN API
 * This script loads actual historical data with correct dates for each season
 */

async function loadHistoricalNFLData() {
    console.log('🏈 NFL HISTORICAL DATA LOADER');
    console.log('===============================');
    
    try {
        // Initialize database connection
        console.log('🔌 Connecting to database...');
        await pool.initialize();
        console.log('✅ Database connected');
        
        // Initialize ESPN API service
        const espnApi = new EspnApiService();
        
        // Check current data issue
        console.log('\n🔍 Checking current data issue...');
        const currentData = await pool.query(`
            SELECT season, 
                   MIN(game_date::date) as earliest_date, 
                   MAX(game_date::date) as latest_date,
                   COUNT(*) as total_games
            FROM nfl_games 
            GROUP BY season 
            ORDER BY season
        `);
        
        if (currentData.rows.length > 0) {
            console.log('\nCurrent data problem:');
            currentData.rows.forEach(row => {
                console.log(`Season ${row.season}: ${row.earliest_date} to ${row.latest_date} (${row.total_games} games)`);
            });
        } else {
            console.log('No existing game data found.');
        }
        
        console.log('\n🧹 CLEARING EXISTING DATA...');
        await pool.query('DELETE FROM nfl_games');
        console.log('✅ Existing game data cleared');
        
        console.log('\n📡 LOADING HISTORICAL DATA FROM ESPN...');
        console.log('This will take a few minutes to respect ESPN API rate limits...');
        
        // Load all historical seasons from ESPN
        const historicalData = await espnApi.loadAllHistoricalSeasons();
        
        console.log('\n💾 STORING DATA IN DATABASE...');
        
        let totalInserted = 0;
        let totalErrors = 0;
        
        for (const [season, games] of Object.entries(historicalData)) {
            console.log(`\nProcessing ${season} season (${games.length} games)...`);
            
            for (const game of games) {
                try {
                    // Get team IDs
                    const homeTeamQuery = await pool.query('SELECT id FROM nfl_teams WHERE team_code = $1', [game.home_team]);
                    const awayTeamQuery = await pool.query('SELECT id FROM nfl_teams WHERE team_code = $1', [game.away_team]);

                    if (homeTeamQuery.rows.length === 0 || awayTeamQuery.rows.length === 0) {
                        console.warn(`Teams not found: ${game.home_team} vs ${game.away_team}`);
                        totalErrors++;
                        continue;
                    }

                    const homeTeamId = homeTeamQuery.rows[0].id;
                    const awayTeamId = awayTeamQuery.rows[0].id;
                    const gameDate = new Date(game.commence_time);
                    
                    // Determine winner
                    let winnerTeamId = null;
                    if (game.completed && game.home_score > game.away_score) {
                        winnerTeamId = homeTeamId;
                    } else if (game.completed && game.away_score > game.home_score) {
                        winnerTeamId = awayTeamId;
                    }

                    // Insert game
                    await pool.query(`
                        INSERT INTO nfl_games (
                            espn_game_id, week, season, game_date, home_team_id, away_team_id,
                            home_score, away_score, winner_team_id, is_final, created_at, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                        ON CONFLICT (espn_game_id) DO UPDATE SET
                            home_score = EXCLUDED.home_score,
                            away_score = EXCLUDED.away_score,
                            winner_team_id = EXCLUDED.winner_team_id,
                            is_final = EXCLUDED.is_final,
                            updated_at = NOW()
                    `, [
                        game.espn_id, game.week, game.season, gameDate, homeTeamId, awayTeamId,
                        game.home_score, game.away_score, winnerTeamId, game.completed
                    ]);

                    totalInserted++;
                } catch (error) {
                    console.error(`Error inserting game ${game.espn_id}:`, error.message);
                    totalErrors++;
                }
            }
            
            console.log(`✅ ${season} season complete`);
        }
        
        console.log(`\n💾 DATABASE STORAGE COMPLETE`);
        console.log(`   Inserted: ${totalInserted} games`);
        console.log(`   Errors: ${totalErrors}`);
        
        // Verify the fix
        console.log('\n🔍 VERIFYING CORRECTED DATA...');
        const fixedData = await pool.query(`
            SELECT season, 
                   MIN(game_date::date) as earliest_date, 
                   MAX(game_date::date) as latest_date,
                   COUNT(*) as total_games,
                   SUM(CASE WHEN is_final = true THEN 1 ELSE 0 END) as completed_games
            FROM nfl_games 
            GROUP BY season 
            ORDER BY season
        `);
        
        console.log('\n🎯 HISTORICAL DATA VERIFICATION:');
        console.log('Season | Total | Completed | Date Range');
        console.log('-------|-------|-----------|---------------------------');
        
        fixedData.rows.forEach(row => {
            console.log(`${row.season}   | ${row.total_games.toString().padEnd(5)} | ${row.completed_games.toString().padEnd(9)} | ${row.earliest_date} to ${row.latest_date}`);
        });
        
        console.log('\n✅ HISTORICAL DATA LOAD COMPLETE!');
        console.log('   All seasons now have correct historical dates from ESPN API');
        console.log('   Your SQL query will now return proper 2024 games with 2024 dates');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error loading historical data:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    loadHistoricalNFLData();
}

module.exports = { loadHistoricalNFLData };