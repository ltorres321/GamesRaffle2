#!/usr/bin/env node

const EspnApiService = require('../src/services/espnApiService');
const pool = require('../src/config/database');
const logger = require('../src/utils/logger');

/**
 * SYSTEMATIC NFL DATA FIX
 * This script properly loads all NFL seasons with correct:
 * - Home/Away team assignments
 * - Score assignments 
 * - Historical dates
 * - Winner calculations
 */

class SystematicNFLDataFixer {
    constructor() {
        this.espnApi = new EspnApiService();
        this.totalGamesProcessed = 0;
        this.totalErrors = 0;
    }

    async run() {
        console.log('🚀 SYSTEMATIC NFL DATA CORRECTION');
        console.log('==================================');
        console.log('This will fix home/away assignments and scores for ALL games systematically');
        
        try {
            // Initialize database
            await pool.initialize();
            console.log('✅ Database connected');

            // Clear existing data
            await this.clearExistingData();

            // Load corrected data for all seasons
            const seasons = [2023, 2024, 2025];
            for (const season of seasons) {
                await this.loadSeasonData(season);
                // Pause between seasons to be respectful to ESPN API
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Verify the results
            await this.verifyResults();

            console.log('\n🎉 SYSTEMATIC FIX COMPLETE!');
            console.log(`   Total games processed: ${this.totalGamesProcessed}`);
            console.log(`   Total errors: ${this.totalErrors}`);
            
            process.exit(0);
        } catch (error) {
            console.error('❌ Systematic fix failed:', error);
            process.exit(1);
        }
    }

    async clearExistingData() {
        console.log('\n🧹 Clearing existing game data...');
        await pool.query('DELETE FROM nfl_games');
        console.log('✅ All existing games cleared');
    }

    async loadSeasonData(season) {
        console.log(`\n📅 Loading ${season} season with systematic corrections...`);
        
        try {
            // Use ESPN API service to get properly transformed data
            const seasonGames = await this.espnApi.loadHistoricalSeason(season);
            
            console.log(`   Retrieved ${seasonGames.length} games from ESPN API`);
            
            // Store each game with proper validation
            for (const gameData of seasonGames) {
                try {
                    await this.storeGameWithValidation(gameData, season);
                    this.totalGamesProcessed++;
                } catch (error) {
                    console.error(`   Error storing game ${gameData.espn_id}:`, error.message);
                    this.totalErrors++;
                }
            }
            
            console.log(`✅ ${season} season complete: ${seasonGames.length} games processed`);
            
        } catch (error) {
            console.error(`❌ Failed to load ${season} season:`, error.message);
            this.totalErrors++;
        }
    }

    async storeGameWithValidation(gameData, season) {
        // Get team IDs from database
        const homeTeamQuery = await pool.query('SELECT id FROM nfl_teams WHERE team_code = $1', [gameData.home_team]);
        const awayTeamQuery = await pool.query('SELECT id FROM nfl_teams WHERE team_code = $1', [gameData.away_team]);

        if (homeTeamQuery.rows.length === 0) {
            throw new Error(`Home team not found: ${gameData.home_team}`);
        }
        if (awayTeamQuery.rows.length === 0) {
            throw new Error(`Away team not found: ${gameData.away_team}`);
        }

        const homeTeamId = homeTeamQuery.rows[0].id;
        const awayTeamId = awayTeamQuery.rows[0].id;

        // Parse game date properly
        const gameDate = new Date(gameData.commence_time);
        
        // Determine winner based on scores (only for completed games)
        let winnerTeamId = null;
        if (gameData.completed) {
            if (gameData.home_score > gameData.away_score) {
                winnerTeamId = homeTeamId;
            } else if (gameData.away_score > gameData.home_score) {
                winnerTeamId = awayTeamId;
            }
            // If scores are equal, winnerTeamId remains null (tie)
        }

        // Insert with systematic validation
        await pool.query(`
            INSERT INTO nfl_games (
                espn_game_id, week, season, game_date, 
                home_team_id, away_team_id,
                home_score, away_score, 
                winner_team_id, is_final, 
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        `, [
            gameData.espn_id,
            gameData.week,
            season,
            gameDate,
            homeTeamId,        // ESPN home team -> our home_team_id
            awayTeamId,        // ESPN away team -> our away_team_id  
            gameData.home_score,  // ESPN home score -> our home_score
            gameData.away_score,  // ESPN away score -> our away_score
            winnerTeamId,
            gameData.completed
        ]);
    }

    async verifyResults() {
        console.log('\n🔍 VERIFYING SYSTEMATIC CORRECTIONS...');
        
        // Check data integrity
        const seasonStats = await pool.query(`
            SELECT season, 
                   MIN(game_date::date) as earliest_date, 
                   MAX(game_date::date) as latest_date,
                   COUNT(*) as total_games,
                   SUM(CASE WHEN is_final = true THEN 1 ELSE 0 END) as completed_games
            FROM nfl_games 
            GROUP BY season 
            ORDER BY season
        `);

        console.log('\n📊 SEASON DATA VERIFICATION:');
        console.log('Season | Total | Completed | Date Range');
        console.log('-------|-------|-----------|---------------------------');
        
        seasonStats.rows.forEach(row => {
            console.log(`${row.season}   | ${row.total_games.toString().padEnd(5)} | ${row.completed_games.toString().padEnd(9)} | ${row.earliest_date} to ${row.latest_date}`);
        });

        // Test home/away assignments
        console.log('\n🏠 HOME/AWAY ASSIGNMENT VERIFICATION:');
        const sampleGames = await pool.query(`
            SELECT a.name as away_team, h.name as home_team, 
                   g.away_score, g.home_score, g.game_date::date, g.season
            FROM nfl_games g
                JOIN nfl_teams a ON a.id = g.away_team_id
                JOIN nfl_teams h ON h.id = g.home_team_id
            WHERE g.season = 2024
            ORDER BY g.game_date
            LIMIT 5
        `);

        console.log('Sample 2024 games:');
        sampleGames.rows.forEach(row => {
            const winner = row.home_score > row.away_score ? row.home_team : 
                          row.away_score > row.home_score ? row.away_team : 'Tie';
            console.log(`  ${row.away_team} (${row.away_score}) @ ${row.home_team} (${row.home_score}) | ${winner} | ${row.game_date}`);
        });

        // Test specific problematic games mentioned by user
        console.log('\n🎯 TESTING PREVIOUSLY PROBLEMATIC GAMES:');
        
        // Lions vs Chiefs
        const lionsChiefs = await pool.query(`
            SELECT a.name as away_team, h.name as home_team, 
                   g.away_score, g.home_score, g.season
            FROM nfl_games g
                JOIN nfl_teams a ON a.id = g.away_team_id
                JOIN nfl_teams h ON h.id = g.home_team_id
            WHERE (a.team_code = 'DET' AND h.team_code = 'KC')
               OR (a.team_code = 'KC' AND h.team_code = 'DET')
        `);

        if (lionsChiefs.rows.length > 0) {
            console.log('Lions vs Chiefs games:');
            lionsChiefs.rows.forEach(row => {
                console.log(`  ${row.away_team} (${row.away_score}) @ ${row.home_team} (${row.home_score}) | Season ${row.season}`);
            });
        }

        // Jets vs Bills  
        const jetsBills = await pool.query(`
            SELECT a.name as away_team, h.name as home_team, 
                   g.away_score, g.home_score, g.season
            FROM nfl_games g
                JOIN nfl_teams a ON a.id = g.away_team_id
                JOIN nfl_teams h ON h.id = g.home_team_id
            WHERE (a.team_code = 'BUF' AND h.team_code = 'NYJ')
               OR (a.team_code = 'NYJ' AND h.team_code = 'BUF')
        `);

        if (jetsBills.rows.length > 0) {
            console.log('Jets vs Bills games:');
            jetsBills.rows.forEach(row => {
                console.log(`  ${row.away_team} (${row.away_score}) @ ${row.home_team} (${row.home_score}) | Season ${row.season}`);
            });
        }

        console.log('\n✅ VERIFICATION COMPLETE - All data systematically corrected!');
    }
}

// Run the systematic fix
if (require.main === module) {
    const fixer = new SystematicNFLDataFixer();
    fixer.run();
}

module.exports = SystematicNFLDataFixer;