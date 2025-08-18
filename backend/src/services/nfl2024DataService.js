const { Pool } = require('pg');
const logger = require('../utils/logger');
const arangoDbService = require('./arangoDbService');

/**
 * Service for loading 2024 NFL season historical data for testing
 * Primary: ArangoDB analytics database with accurate historical data
 * Fallback: Static 2024 season data for offline development
 * Database: PostgreSQL for NFL Survivor game data storage
 */
class NFL2024DataService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    /**
     * Load complete 2024 NFL season data
     */
    async load2024SeasonData() {
        try {
            logger.info('Loading 2024 NFL season data...');

            // First, load team mappings
            await this.loadTeamMappings();

            // Then load all games for the 2024 season
            await this.load2024Games();

            logger.info('Successfully loaded 2024 NFL season data');
            return { success: true, message: '2024 NFL season data loaded successfully' };
        } catch (error) {
            logger.error('Failed to load 2024 season data:', error);
            throw new Error(`Failed to load 2024 season data: ${error.message}`);
        }
    }

    /**
     * Load team SportRadar mappings (simulated IDs for testing)
     */
    async loadTeamMappings() {
        const teamMappings = [
            { alias: 'ARI', sportRadarId: 'sr:competitor:4391' },
            { alias: 'ATL', sportRadarId: 'sr:competitor:4392' },
            { alias: 'BAL', sportRadarId: 'sr:competitor:4393' },
            { alias: 'BUF', sportRadarId: 'sr:competitor:4394' },
            { alias: 'CAR', sportRadarId: 'sr:competitor:4395' },
            { alias: 'CHI', sportRadarId: 'sr:competitor:4396' },
            { alias: 'CIN', sportRadarId: 'sr:competitor:4397' },
            { alias: 'CLE', sportRadarId: 'sr:competitor:4398' },
            { alias: 'DAL', sportRadarId: 'sr:competitor:4399' },
            { alias: 'DEN', sportRadarId: 'sr:competitor:4400' },
            { alias: 'DET', sportRadarId: 'sr:competitor:4401' },
            { alias: 'GB', sportRadarId: 'sr:competitor:4402' },
            { alias: 'HOU', sportRadarId: 'sr:competitor:4403' },
            { alias: 'IND', sportRadarId: 'sr:competitor:4404' },
            { alias: 'JAX', sportRadarId: 'sr:competitor:4405' },
            { alias: 'KC', sportRadarId: 'sr:competitor:4406' },
            { alias: 'LV', sportRadarId: 'sr:competitor:4407' },
            { alias: 'LAC', sportRadarId: 'sr:competitor:4408' },
            { alias: 'LAR', sportRadarId: 'sr:competitor:4409' },
            { alias: 'MIA', sportRadarId: 'sr:competitor:4410' },
            { alias: 'MIN', sportRadarId: 'sr:competitor:4411' },
            { alias: 'NE', sportRadarId: 'sr:competitor:4412' },
            { alias: 'NO', sportRadarId: 'sr:competitor:4413' },
            { alias: 'NYG', sportRadarId: 'sr:competitor:4414' },
            { alias: 'NYJ', sportRadarId: 'sr:competitor:4415' },
            { alias: 'PHI', sportRadarId: 'sr:competitor:4416' },
            { alias: 'PIT', sportRadarId: 'sr:competitor:4417' },
            { alias: 'SF', sportRadarId: 'sr:competitor:4418' },
            { alias: 'SEA', sportRadarId: 'sr:competitor:4419' },
            { alias: 'TB', sportRadarId: 'sr:competitor:4420' },
            { alias: 'TEN', sportRadarId: 'sr:competitor:4421' },
            { alias: 'WAS', sportRadarId: 'sr:competitor:4422' }
        ];

        for (const mapping of teamMappings) {
            await this.pool.query(
                'UPDATE public.teams SET sportradarid = $1 WHERE alias = $2',
                [mapping.sportRadarId, mapping.alias]
            );
        }

        logger.info('Team SportRadar mappings updated');
    }

    /**
     * Load 2024 NFL games with results
     */
    async load2024Games() {
        // Sample games from different weeks of 2024 NFL season
        const games2024 = [
            // Week 1
            { week: 1, date: '2024-09-05 20:20:00', home: 'KC', away: 'BAL', homeScore: 27, awayScore: 20 },
            { week: 1, date: '2024-09-08 13:00:00', home: 'BUF', away: 'NYJ', homeScore: 31, awayScore: 10 },
            { week: 1, date: '2024-09-08 13:00:00', home: 'CIN', away: 'NE', homeScore: 16, awayScore: 10 },
            { week: 1, date: '2024-09-08 13:00:00', home: 'HOU', away: 'IND', homeScore: 29, awayScore: 27 },
            { week: 1, date: '2024-09-08 13:00:00', home: 'JAX', away: 'MIA', homeScore: 17, awayScore: 20 },
            { week: 1, date: '2024-09-08 13:00:00', home: 'MIN', away: 'NYG', homeScore: 28, awayScore: 6 },
            { week: 1, date: '2024-09-08 13:00:00', home: 'NO', away: 'CAR', homeScore: 47, awayScore: 10 },
            { week: 1, date: '2024-09-08 13:00:00', home: 'PHI', away: 'GB', homeScore: 34, awayScore: 29 },
            { week: 1, date: '2024-09-08 13:00:00', home: 'PIT', away: 'ATL', homeScore: 18, awayScore: 10 },
            { week: 1, date: '2024-09-08 13:00:00', home: 'TEN', away: 'CHI', homeScore: 17, awayScore: 24 },
            { week: 1, date: '2024-09-08 16:05:00', home: 'ARI', away: 'BUF', homeScore: 28, awayScore: 34 },
            { week: 1, date: '2024-09-08 16:25:00', home: 'DEN', away: 'SEA', homeScore: 26, awayScore: 20 },
            { week: 1, date: '2024-09-08 16:25:00', home: 'LAC', away: 'LV', homeScore: 22, awayScore: 10 },
            { week: 1, date: '2024-09-08 16:25:00', home: 'LAR', away: 'DET', homeScore: 20, awayScore: 26 },
            { week: 1, date: '2024-09-08 20:20:00', home: 'TB', away: 'WAS', homeScore: 37, awayScore: 20 },
            { week: 1, date: '2024-09-09 20:15:00', home: 'SF', away: 'DAL', homeScore: 19, awayScore: 12 },

            // Week 2
            { week: 2, date: '2024-09-12 20:15:00', home: 'ATL', away: 'PHI', homeScore: 22, awayScore: 21 },
            { week: 2, date: '2024-09-15 13:00:00', home: 'BAL', away: 'LV', homeScore: 23, awayScore: 26 },
            { week: 2, date: '2024-09-15 13:00:00', home: 'CAR', away: 'LAC', homeScore: 3, awayScore: 26 },
            { week: 2, date: '2024-09-15 13:00:00', home: 'CLE', away: 'JAX', homeScore: 18, awayScore: 13 },
            { week: 2, date: '2024-09-15 13:00:00', home: 'GB', away: 'IND', homeScore: 16, awayScore: 10 },
            { week: 2, date: '2024-09-15 13:00:00', home: 'MIN', away: 'SF', homeScore: 23, awayScore: 17 },
            { week: 2, date: '2024-09-15 13:00:00', home: 'NYG', away: 'WAS', homeScore: 18, awayScore: 21 },
            { week: 2, date: '2024-09-15 13:00:00', home: 'NYJ', away: 'TEN', homeScore: 24, awayScore: 17 },
            { week: 2, date: '2024-09-15 13:00:00', home: 'SEA', away: 'NE', homeScore: 23, awayScore: 20 },
            { week: 2, date: '2024-09-15 16:05:00', home: 'ARI', away: 'LAR', homeScore: 41, awayScore: 10 },
            { week: 2, date: '2024-09-15 16:25:00', home: 'KC', away: 'CIN', homeScore: 26, awayScore: 25 },
            { week: 2, date: '2024-09-15 16:25:00', home: 'PIT', away: 'DEN', homeScore: 13, awayScore: 6 },
            { week: 2, date: '2024-09-15 20:20:00', home: 'TB', away: 'DET', homeScore: 16, awayScore: 20 },
            { week: 2, date: '2024-09-16 20:15:00', home: 'CHI', away: 'HOU', homeScore: 13, awayScore: 19 },

            // Week 3
            { week: 3, date: '2024-09-19 20:15:00', home: 'NYJ', away: 'NE', homeScore: 24, awayScore: 3 },
            { week: 3, date: '2024-09-22 13:00:00', home: 'BAL', away: 'DAL', homeScore: 25, awayScore: 28 },
            { week: 3, date: '2024-09-22 13:00:00', home: 'BUF', away: 'JAX', homeScore: 47, awayScore: 10 },
            { week: 3, date: '2024-09-22 13:00:00', home: 'CAR', away: 'LV', homeScore: 22, awayScore: 36 },
            { week: 3, date: '2024-09-22 13:00:00', home: 'CHI', away: 'IND', homeScore: 21, awayScore: 16 },
            { week: 3, date: '2024-09-22 13:00:00', home: 'CLE', away: 'NYG', homeScore: 21, awayScore: 15 },
            { week: 3, date: '2024-09-22 13:00:00', home: 'DEN', away: 'TB', homeScore: 26, awayScore: 7 },
            { week: 3, date: '2024-09-22 13:00:00', home: 'GB', away: 'TEN', homeScore: 30, awayScore: 14 },
            { week: 3, date: '2024-09-22 13:00:00', home: 'HOU', away: 'MIN', homeScore: 34, awayScore: 7 },
            { week: 3, date: '2024-09-22 13:00:00', home: 'MIA', away: 'SEA', homeScore: 24, awayScore: 3 },
            { week: 3, date: '2024-09-22 13:00:00', home: 'NO', away: 'PHI', homeScore: 15, awayScore: 12 },
            { week: 3, date: '2024-09-22 13:00:00', home: 'PIT', away: 'LAC', homeScore: 20, awayScore: 10 },
            { week: 3, date: '2024-09-22 16:05:00', home: 'SF', away: 'LAR', homeScore: 27, awayScore: 24 },
            { week: 3, date: '2024-09-22 16:25:00', home: 'ARI', away: 'WAS', homeScore: 14, awayScore: 42 },
            { week: 3, date: '2024-09-22 20:20:00', home: 'DET', away: 'ATL', homeScore: 20, awayScore: 6 },
            { week: 3, date: '2024-09-23 20:15:00', home: 'KC', away: 'CIN', homeScore: 26, awayScore: 25 },

            // Week 4
            { week: 4, date: '2024-09-26 20:15:00', home: 'DAL', away: 'NYG', homeScore: 20, awayScore: 15 },
            { week: 4, date: '2024-09-29 13:00:00', home: 'ARI', away: 'WAS', homeScore: 42, awayScore: 14 },
            { week: 4, date: '2024-09-29 13:00:00', home: 'ATL', away: 'NO', homeScore: 26, awayScore: 24 },
            { week: 4, date: '2024-09-29 13:00:00', home: 'BUF', away: 'BAL', homeScore: 35, awayScore: 10 },
            { week: 4, date: '2024-09-29 13:00:00', home: 'CIN', away: 'CAR', homeScore: 34, awayScore: 24 },
            { week: 4, date: '2024-09-29 13:00:00', home: 'DEN', away: 'NYJ', homeScore: 10, awayScore: 9 },
            { week: 4, date: '2024-09-29 13:00:00', home: 'HOU', away: 'JAX', homeScore: 24, awayScore: 20 },
            { week: 4, date: '2024-09-29 13:00:00', home: 'IND', away: 'PIT', homeScore: 27, awayScore: 24 },
            { week: 4, date: '2024-09-29 13:00:00', home: 'MIA', away: 'TEN', homeScore: 31, awayScore: 12 },
            { week: 4, date: '2024-09-29 13:00:00', home: 'MIN', away: 'GB', homeScore: 31, awayScore: 29 },
            { week: 4, date: '2024-09-29 13:00:00', home: 'NE', away: 'SF', homeScore: 13, awayScore: 30 },
            { week: 4, date: '2024-09-29 13:00:00', home: 'PHI', away: 'TB', homeScore: 33, awayScore: 16 },
            { week: 4, date: '2024-09-29 16:05:00', home: 'LAC', away: 'KC', homeScore: 17, awayScore: 31 },
            { week: 4, date: '2024-09-29 16:25:00', home: 'LAR', away: 'CHI', homeScore: 24, awayScore: 18 },
            { week: 4, date: '2024-09-29 16:25:00', home: 'LV', away: 'CLE', homeScore: 20, awayScore: 16 },
            { week: 4, date: '2024-09-29 16:25:00', home: 'SEA', away: 'DET', homeScore: 42, awayScore: 29 },
            { week: 4, date: '2024-09-29 20:20:00', home: 'DAL', away: 'NYG', homeScore: 20, awayScore: 15 },

            // Week 5
            { week: 5, date: '2024-10-03 20:15:00', home: 'TB', away: 'ATL', homeScore: 36, awayScore: 30 },
            { week: 5, date: '2024-10-06 13:00:00', home: 'BAL', away: 'CIN', homeScore: 41, awayScore: 38 },
            { week: 5, date: '2024-10-06 13:00:00', home: 'CAR', away: 'CHI', homeScore: 36, awayScore: 10 },
            { week: 5, date: '2024-10-06 13:00:00', home: 'CLE', away: 'WAS', homeScore: 34, awayScore: 13 },
            { week: 5, date: '2024-10-06 13:00:00', home: 'GB', away: 'LAR', homeScore: 24, awayScore: 19 },
            { week: 5, date: '2024-10-06 13:00:00', home: 'HOU', away: 'BUF', homeScore: 23, awayScore: 20 },
            { week: 5, date: '2024-10-06 13:00:00', home: 'IND', away: 'JAX', homeScore: 37, awayScore: 20 },
            { week: 5, date: '2024-10-06 13:00:00', home: 'MIA', away: 'NE', homeScore: 15, awayScore: 10 },
            { week: 5, date: '2024-10-06 13:00:00', home: 'NO', away: 'KC', homeScore: 32, awayScore: 29 },
            { week: 5, date: '2024-10-06 13:00:00', home: 'NYG', away: 'SEA', homeScore: 29, awayScore: 20 },
            { week: 5, date: '2024-10-06 16:05:00', home: 'ARI', away: 'SF', homeScore: 24, awayScore: 35 },
            { week: 5, date: '2024-10-06 16:25:00', home: 'DEN', away: 'LV', homeScore: 34, awayScore: 18 },
            { week: 5, date: '2024-10-06 16:25:00', home: 'LAC', away: 'MIN', homeScore: 23, awayScore: 17 },
            { week: 5, date: '2024-10-06 20:20:00', home: 'DAL', away: 'PIT', homeScore: 17, awayScore: 20 },
            { week: 5, date: '2024-10-07 20:15:00', home: 'NYJ', away: 'DET', homeScore: 27, awayScore: 24 },

            // Week 6
            { week: 6, date: '2024-10-10 20:15:00', home: 'SEA', away: 'SF', homeScore: 36, awayScore: 24 },
            { week: 6, date: '2024-10-13 13:00:00', home: 'ATL', away: 'CAR', homeScore: 38, awayScore: 20 },
            { week: 6, date: '2024-10-13 13:00:00', home: 'BUF', away: 'NYJ', homeScore: 23, awayScore: 20 },
            { week: 6, date: '2024-10-13 13:00:00', home: 'CHI', away: 'JAX', homeScore: 35, awayScore: 16 },
            { week: 6, date: '2024-10-13 13:00:00', home: 'CLE', away: 'PHI', homeScore: 20, awayScore: 16 },
            { week: 6, date: '2024-10-13 13:00:00', home: 'HOU', away: 'NE', homeScore: 41, awayScore: 21 },
            { week: 6, date: '2024-10-13 13:00:00', home: 'IND', away: 'TEN', homeScore: 20, awayScore: 17 },
            { week: 6, date: '2024-10-13 13:00:00', home: 'NO', away: 'TB', homeScore: 51, awayScore: 27 },
            { week: 6, date: '2024-10-13 13:00:00', home: 'WAS', away: 'BAL', homeScore: 30, awayScore: 23 },
            { week: 6, date: '2024-10-13 16:05:00', home: 'ARI', away: 'GB', homeScore: 34, awayScore: 13 },
            { week: 6, date: '2024-10-13 16:25:00', home: 'DEN', away: 'LAC', homeScore: 23, awayScore: 16 },
            { week: 6, date: '2024-10-13 16:25:00', home: 'LV', away: 'PIT', homeScore: 32, awayScore: 13 },
            { week: 6, date: '2024-10-13 20:20:00', home: 'CIN', away: 'NYG', homeScore: 17, awayScore: 7 },
            { week: 6, date: '2024-10-14 20:15:00', home: 'DAL', away: 'DET', homeScore: 47, awayScore: 9 },

            // Week 7
            { week: 7, date: '2024-10-17 20:15:00', home: 'NO', away: 'DEN', homeScore: 33, awayScore: 10 },
            { week: 7, date: '2024-10-20 13:00:00', home: 'BAL', away: 'TB', homeScore: 41, awayScore: 31 },
            { week: 7, date: '2024-10-20 13:00:00', home: 'CAR', away: 'WAS', homeScore: 40, awayScore: 7 },
            { week: 7, date: '2024-10-20 13:00:00', home: 'CIN', away: 'CLE', homeScore: 21, awayScore: 14 },
            { week: 7, date: '2024-10-20 13:00:00', home: 'DET', away: 'MIN', homeScore: 31, awayScore: 29 },
            { week: 7, date: '2024-10-20 13:00:00', home: 'HOU', away: 'GB', homeScore: 24, awayScore: 22 },
            { week: 7, date: '2024-10-20 13:00:00', home: 'JAX', away: 'NE', homeScore: 32, awayScore: 16 },
            { week: 7, date: '2024-10-20 13:00:00', home: 'MIA', away: 'IND', homeScore: 16, awayScore: 10 },
            { week: 7, date: '2024-10-20 13:00:00', home: 'NYJ', away: 'PIT', homeScore: 37, awayScore: 15 },
            { week: 7, date: '2024-10-20 13:00:00', home: 'TEN', away: 'BUF', homeScore: 34, awayScore: 10 },
            { week: 7, date: '2024-10-20 16:05:00', home: 'LV', away: 'LAR', homeScore: 20, awayScore: 15 },
            { week: 7, date: '2024-10-20 16:25:00', home: 'KC', away: 'SF', homeScore: 28, awayScore: 18 },
            { week: 7, date: '2024-10-20 16:25:00', home: 'SEA', away: 'ATL', homeScore: 34, awayScore: 14 },
            { week: 7, date: '2024-10-20 20:20:00', home: 'PHI', away: 'NYG', homeScore: 28, awayScore: 3 },
            { week: 7, date: '2024-10-21 20:15:00', home: 'LAC', away: 'ARI', homeScore: 17, awayScore: 15 },

            // Week 8
            { week: 8, date: '2024-10-24 20:15:00', home: 'HOU', away: 'NYJ', homeScore: 21, awayScore: 13 },
            { week: 8, date: '2024-10-27 13:00:00', home: 'ARI', away: 'MIA', homeScore: 28, awayScore: 27 },
            { week: 8, date: '2024-10-27 13:00:00', home: 'ATL', away: 'TB', homeScore: 31, awayScore: 26 },
            { week: 8, date: '2024-10-27 13:00:00', home: 'BUF', away: 'SEA', homeScore: 31, awayScore: 10 },
            { week: 8, date: '2024-10-27 13:00:00', home: 'CHI', away: 'WAS', homeScore: 18, awayScore: 15 },
            { week: 8, date: '2024-10-27 13:00:00', home: 'CLE', away: 'BAL', homeScore: 29, awayScore: 24 },
            { week: 8, date: '2024-10-27 13:00:00', home: 'DET', away: 'TEN', homeScore: 52, awayScore: 14 },
            { week: 8, date: '2024-10-27 13:00:00', home: 'GB', away: 'JAX', homeScore: 30, awayScore: 27 },
            { week: 8, date: '2024-10-27 13:00:00', home: 'IND', away: 'HOU', homeScore: 31, awayScore: 20 },
            { week: 8, date: '2024-10-27 13:00:00', home: 'NE', away: 'NYJ', homeScore: 25, awayScore: 22 },
            { week: 8, date: '2024-10-27 13:00:00', home: 'NO', away: 'LAC', homeScore: 26, awayScore: 8 },
            { week: 8, date: '2024-10-27 13:00:00', home: 'PHI', away: 'CIN', homeScore: 37, awayScore: 17 },
            { week: 8, date: '2024-10-27 16:05:00', home: 'SF', away: 'DAL', homeScore: 30, awayScore: 24 },
            { week: 8, date: '2024-10-27 16:25:00', home: 'DEN', away: 'CAR', homeScore: 28, awayScore: 14 },
            { week: 8, date: '2024-10-27 16:25:00', home: 'LAR', away: 'MIN', homeScore: 30, awayScore: 20 },
            { week: 8, date: '2024-10-27 20:20:00', home: 'PIT', away: 'NYG', homeScore: 26, awayScore: 18 },
            { week: 8, date: '2024-10-28 20:15:00', home: 'KC', away: 'LV', homeScore: 27, awayScore: 20 },

            // Week 9
            { week: 9, date: '2024-10-31 20:15:00', home: 'HOU', away: 'NYJ', homeScore: 21, awayScore: 13 },
            { week: 9, date: '2024-11-03 13:00:00', home: 'BAL', away: 'DEN', homeScore: 41, awayScore: 10 },
            { week: 9, date: '2024-11-03 13:00:00', home: 'CAR', away: 'NO', homeScore: 23, awayScore: 22 },
            { week: 9, date: '2024-11-03 13:00:00', home: 'CIN', away: 'LV', homeScore: 41, awayScore: 24 },
            { week: 9, date: '2024-11-03 13:00:00', home: 'DAL', away: 'ATL', homeScore: 27, awayScore: 21 },
            { week: 9, date: '2024-11-03 13:00:00', home: 'MIA', away: 'BUF', homeScore: 20, awayScore: 25 },
            { week: 9, date: '2024-11-03 13:00:00', home: 'MIN', away: 'IND', homeScore: 21, awayScore: 13 },
            { week: 9, date: '2024-11-03 13:00:00', home: 'NE', away: 'TEN', homeScore: 17, awayScore: 20 },
            { week: 9, date: '2024-11-03 13:00:00', home: 'WAS', away: 'NYG', homeScore: 27, awayScore: 22 },
            { week: 9, date: '2024-11-03 16:05:00', home: 'ARI', away: 'CHI', homeScore: 29, awayScore: 9 },
            { week: 9, date: '2024-11-03 16:25:00', home: 'LAC', away: 'CLE', homeScore: 27, awayScore: 10 },
            { week: 9, date: '2024-11-03 16:25:00', home: 'LAR', away: 'SEA', homeScore: 26, awayScore: 20 },
            { week: 9, date: '2024-11-03 16:25:00', home: 'LV', away: 'KC', homeScore: 31, awayScore: 17 },
            { week: 9, date: '2024-11-03 20:20:00', home: 'TB', away: 'KC', homeScore: 30, awayScore: 24 },
            { week: 9, date: '2024-11-04 20:15:00', home: 'DET', away: 'GB', homeScore: 24, awayScore: 14 },

            // Week 10
            { week: 10, date: '2024-11-07 20:15:00', home: 'CIN', away: 'BAL', homeScore: 35, awayScore: 34 },
            { week: 10, date: '2024-11-10 13:00:00', home: 'ATL', away: 'NO', homeScore: 20, awayScore: 17 },
            { week: 10, date: '2024-11-10 13:00:00', home: 'BUF', away: 'IND', homeScore: 30, awayScore: 20 },
            { week: 10, date: '2024-11-10 13:00:00', home: 'CHI', away: 'NE', homeScore: 19, awayScore: 3 },
            { week: 10, date: '2024-11-10 13:00:00', home: 'DEN', away: 'KC', homeScore: 16, awayScore: 14 },
            { week: 10, date: '2024-11-10 13:00:00', home: 'GB', away: 'CHI', homeScore: 20, awayScore: 19 },
            { week: 10, date: '2024-11-10 13:00:00', home: 'JAX', away: 'MIN', homeScore: 12, awayScore: 7 },
            { week: 10, date: '2024-11-10 13:00:00', home: 'NYG', away: 'CAR', homeScore: 20, awayScore: 17 },
            { week: 10, date: '2024-11-10 13:00:00', home: 'PIT', away: 'WAS', homeScore: 28, awayScore: 27 },
            { week: 10, date: '2024-11-10 13:00:00', home: 'TEN', away: 'LAC', homeScore: 27, awayScore: 17 },
            { week: 10, date: '2024-11-10 16:05:00', home: 'ARI', away: 'NYJ', homeScore: 31, awayScore: 6 },
            { week: 10, date: '2024-11-10 16:25:00', home: 'LV', away: 'DET', homeScore: 26, awayScore: 14 },
            { week: 10, date: '2024-11-10 16:25:00', home: 'SF', away: 'TB', homeScore: 23, awayScore: 20 },
            { week: 10, date: '2024-11-10 20:20:00', home: 'HOU', away: 'DET', homeScore: 26, awayScore: 23 },
            { week: 10, date: '2024-11-11 20:15:00', home: 'MIA', away: 'LAR', homeScore: 23, awayScore: 15 },

            // Week 11
            { week: 11, date: '2024-11-14 20:15:00', home: 'WAS', away: 'PHI', homeScore: 26, awayScore: 18 },
            { week: 11, date: '2024-11-17 13:00:00', home: 'BAL', away: 'PIT', homeScore: 18, awayScore: 16 },
            { week: 11, date: '2024-11-17 13:00:00', home: 'CLE', away: 'NO', homeScore: 35, awayScore: 14 },
            { week: 11, date: '2024-11-17 13:00:00', home: 'DET', away: 'JAX', homeScore: 52, awayScore: 6 },
            { week: 11, date: '2024-11-17 13:00:00', home: 'GB', away: 'CHI', homeScore: 20, awayScore: 19 },
            { week: 11, date: '2024-11-17 13:00:00', home: 'IND', away: 'NYJ', homeScore: 28, awayScore: 27 },
            { week: 11, date: '2024-11-17 13:00:00', home: 'LV', away: 'MIA', homeScore: 34, awayScore: 19 },
            { week: 11, date: '2024-11-17 13:00:00', home: 'MIN', away: 'TEN', homeScore: 23, awayScore: 13 },
            { week: 11, date: '2024-11-17 13:00:00', home: 'NE', away: 'LAR', homeScore: 28, awayScore: 22 },
            { week: 11, date: '2024-11-17 13:00:00', home: 'NYG', away: 'WAS', homeScore: 27, awayScore: 22 },
            { week: 11, date: '2024-11-17 16:05:00', home: 'ARI', away: 'SEA', homeScore: 16, awayScore: 6 },
            { week: 11, date: '2024-11-17 16:25:00', home: 'KC', away: 'BUF', homeScore: 30, awayScore: 21 },
            { week: 11, date: '2024-11-17 16:25:00', home: 'SF', away: 'SEA', homeScore: 36, awayScore: 24 },
            { week: 11, date: '2024-11-17 20:20:00', home: 'CIN', away: 'LAC', homeScore: 27, awayScore: 17 },
            { week: 11, date: '2024-11-18 20:15:00', home: 'HOU', away: 'DAL', homeScore: 34, awayScore: 10 },

            // Week 12
            { week: 12, date: '2024-11-21 20:15:00', home: 'PIT', away: 'CLE', homeScore: 24, awayScore: 19 },
            { week: 12, date: '2024-11-24 13:00:00', home: 'ATL', away: 'LAC', homeScore: 17, awayScore: 13 },
            { week: 12, date: '2024-11-24 13:00:00', home: 'CAR', away: 'KC', homeScore: 30, awayScore: 27 },
            { week: 12, date: '2024-11-24 13:00:00', home: 'HOU', away: 'TEN', homeScore: 32, awayScore: 27 },
            { week: 12, date: '2024-11-24 13:00:00', home: 'IND', away: 'DET', homeScore: 24, awayScore: 6 },
            { week: 12, date: '2024-11-24 13:00:00', home: 'LV', away: 'DEN', homeScore: 29, awayScore: 19 },
            { week: 12, date: '2024-11-24 13:00:00', home: 'MIA', away: 'NE', homeScore: 34, awayScore: 15 },
            { week: 12, date: '2024-11-24 13:00:00', home: 'MIN', away: 'CHI', homeScore: 30, awayScore: 27 },
            { week: 12, date: '2024-11-24 13:00:00', home: 'NO', away: 'LAR', homeScore: 21, awayScore: 14 },
            { week: 12, date: '2024-11-24 13:00:00', home: 'NYJ', away: 'ARI', homeScore: 31, awayScore: 6 },
            { week: 12, date: '2024-11-24 13:00:00', home: 'TB', away: 'NYG', homeScore: 30, awayScore: 7 },
            { week: 12, date: '2024-11-24 16:05:00', home: 'SEA', away: 'ARI', homeScore: 16, awayScore: 6 },
            { week: 12, date: '2024-11-24 16:25:00', home: 'GB', away: 'SF', homeScore: 38, awayScore: 10 },
            { week: 12, date: '2024-11-24 16:25:00', home: 'PHI', away: 'LAR', homeScore: 37, awayScore: 20 },
            { week: 12, date: '2024-11-24 20:20:00', home: 'BAL', away: 'LAC', homeScore: 30, awayScore: 23 },
            { week: 12, date: '2024-11-25 20:15:00', home: 'KC', away: 'LV', homeScore: 19, awayScore: 17 },

            // Week 13
            { week: 13, date: '2024-11-28 20:15:00', home: 'GB', away: 'MIA', homeScore: 30, awayScore: 17 },
            { week: 13, date: '2024-12-01 13:00:00', home: 'ARI', away: 'MIN', homeScore: 23, awayScore: 22 },
            { week: 13, date: '2024-12-01 13:00:00', home: 'ATL', away: 'LAC', homeScore: 17, awayScore: 13 },
            { week: 13, date: '2024-12-01 13:00:00', home: 'CHI', away: 'DET', homeScore: 23, awayScore: 20 },
            { week: 13, date: '2024-12-01 13:00:00', home: 'CIN', away: 'PIT', homeScore: 16, awayScore: 10 },
            { week: 13, date: '2024-12-01 13:00:00', home: 'HOU', away: 'JAX', homeScore: 23, awayScore: 20 },
            { week: 13, date: '2024-12-01 13:00:00', home: 'IND', away: 'NE', homeScore: 25, awayScore: 24 },
            { week: 13, date: '2024-12-01 13:00:00', home: 'NO', away: 'LA', homeScore: 21, awayScore: 14 },
            { week: 13, date: '2024-12-01 13:00:00', home: 'NYG', away: 'DAL', homeScore: 27, awayScore: 20 },
            { week: 13, date: '2024-12-01 13:00:00', home: 'TEN', away: 'WAS', homeScore: 42, awayScore: 16 },
            { week: 13, date: '2024-12-01 16:05:00', home: 'LAR', away: 'NO', homeScore: 21, awayScore: 14 },
            { week: 13, date: '2024-12-01 16:25:00', home: 'DEN', away: 'CLE', homeScore: 41, awayScore: 32 },
            { week: 13, date: '2024-12-01 16:25:00', home: 'KC', away: 'LV', homeScore: 19, awayScore: 17 },
            { week: 13, date: '2024-12-01 20:20:00', home: 'SEA', away: 'NYJ', homeScore: 26, awayScore: 21 },
            { week: 13, date: '2024-12-02 20:15:00', home: 'PHI', away: 'SF', homeScore: 42, awayScore: 19 },

            // Week 14
            { week: 14, date: '2024-12-05 20:15:00', home: 'DET', away: 'GB', homeScore: 34, awayScore: 31 },
            { week: 14, date: '2024-12-08 13:00:00', home: 'ARI', away: 'SEA', homeScore: 30, awayScore: 18 },
            { week: 14, date: '2024-12-08 13:00:00', home: 'BAL', away: 'PHI', homeScore: 24, awayScore: 19 },
            { week: 14, date: '2024-12-08 13:00:00', home: 'BUF', away: 'LAR', homeScore: 44, awayScore: 42 },
            { week: 14, date: '2024-12-08 13:00:00', home: 'CAR', away: 'ATL', homeScore: 15, awayScore: 9 },
            { week: 14, date: '2024-12-08 13:00:00', home: 'CLE', away: 'PIT', homeScore: 27, awayScore: 14 },
            { week: 14, date: '2024-12-08 13:00:00', home: 'IND', away: 'CIN', homeScore: 34, awayScore: 14 },
            { week: 14, date: '2024-12-08 13:00:00', home: 'MIA', away: 'NYJ', homeScore: 32, awayScore: 26 },
            { week: 14, date: '2024-12-08 13:00:00', home: 'MIN', away: 'LV', homeScore: 3, awayScore: 0 },
            { week: 14, date: '2024-12-08 13:00:00', home: 'NO', away: 'NYG', homeScore: 24, awayScore: 6 },
            { week: 14, date: '2024-12-08 13:00:00', home: 'TB', away: 'LV', homeScore: 28, awayScore: 13 },
            { week: 14, date: '2024-12-08 16:05:00', home: 'SF', away: 'CHI', homeScore: 38, awayScore: 13 },
            { week: 14, date: '2024-12-08 16:25:00', home: 'JAX', away: 'TEN', homeScore: 10, awayScore: 6 },
            { week: 14, date: '2024-12-08 20:20:00', home: 'LAC', away: 'KC', homeScore: 19, awayScore: 17 },
            { week: 14, date: '2024-12-09 20:15:00', home: 'DAL', away: 'CIN', homeScore: 27, awayScore: 20 },

            // Week 15
            { week: 15, date: '2024-12-12 20:15:00', home: 'LAC', away: 'DEN', homeScore: 34, awayScore: 27 },
            { week: 15, date: '2024-12-15 13:00:00', home: 'ATL', away: 'LV', homeScore: 15, awayScore: 9 },
            { week: 15, date: '2024-12-15 13:00:00', home: 'BAL', away: 'NYG', homeScore: 35, awayScore: 14 },
            { week: 15, date: '2024-12-15 13:00:00', home: 'CAR', away: 'DAL', homeScore: 30, awayScore: 14 },
            { week: 15, date: '2024-12-15 13:00:00', home: 'CHI', away: 'MIN', homeScore: 30, awayScore: 12 },
            { week: 15, date: '2024-12-15 13:00:00', home: 'CIN', away: 'TEN', homeScore: 37, awayScore: 27 },
            { week: 15, date: '2024-12-15 13:00:00', home: 'HOU', away: 'MIA', homeScore: 20, awayScore: 12 },
            { week: 15, date: '2024-12-15 13:00:00', home: 'JAX', away: 'NYJ', homeScore: 19, awayScore: 25 },
            { week: 15, date: '2024-12-15 13:00:00', home: 'NE', away: 'ARI', homeScore: 30, awayScore: 17 },
            { week: 15, date: '2024-12-15 13:00:00', home: 'PHI', away: 'PIT', homeScore: 27, awayScore: 13 },
            { week: 15, date: '2024-12-15 13:00:00', home: 'WAS', away: 'NO', homeScore: 20, awayScore: 19 },
            { week: 15, date: '2024-12-15 16:05:00', home: 'SF', away: 'LAR', homeScore: 12, awayScore: 6 },
            { week: 15, date: '2024-12-15 16:25:00', home: 'DET', away: 'BUF', homeScore: 48, awayScore: 24 },
            { week: 15, date: '2024-12-15 16:25:00', home: 'SEA', away: 'GB', homeScore: 30, awayScore: 13 },
            { week: 15, date: '2024-12-15 20:20:00', home: 'KC', away: 'CLE', homeScore: 21, awayScore: 7 },
            { week: 15, date: '2024-12-16 20:15:00', home: 'TB', away: 'LAC', homeScore: 40, awayScore: 17 },

            // Week 16
            { week: 16, date: '2024-12-19 20:15:00', home: 'CLE', away: 'CIN', homeScore: 24, awayScore: 6 },
            { week: 16, date: '2024-12-21 13:00:00', home: 'ARI', away: 'CAR', homeScore: 36, awayScore: 30 },
            { week: 16, date: '2024-12-22 13:00:00', home: 'ATL', away: 'NYG', homeScore: 34, awayScore: 7 },
            { week: 16, date: '2024-12-22 13:00:00', home: 'BAL', away: 'PIT', homeScore: 34, awayScore: 17 },
            { week: 16, date: '2024-12-22 13:00:00', home: 'BUF', away: 'NE', homeScore: 24, awayScore: 21 },
            { week: 16, date: '2024-12-22 13:00:00', home: 'CHI', away: 'DET', homeScore: 34, awayScore: 17 },
            { week: 16, date: '2024-12-22 13:00:00', home: 'DAL', away: 'TB', homeScore: 26, awayScore: 24 },
            { week: 16, date: '2024-12-22 13:00:00', home: 'HOU', away: 'KC', homeScore: 25, awayScore: 19 },
            { week: 16, date: '2024-12-22 13:00:00', home: 'IND', away: 'TEN', homeScore: 38, awayScore: 30 },
            { week: 16, date: '2024-12-22 13:00:00', home: 'MIN', away: 'SEA', homeScore: 27, awayScore: 24 },
            { week: 16, date: '2024-12-22 13:00:00', home: 'NO', away: 'GB', homeScore: 34, awayScore: 0 },
            { week: 16, date: '2024-12-22 13:00:00', home: 'NYJ', away: 'LAR', homeScore: 19, awayScore: 9 },
            { week: 16, date: '2024-12-22 13:00:00', home: 'WAS', away: 'PHI', homeScore: 36, awayScore: 33 },
            { week: 16, date: '2024-12-22 16:05:00', home: 'DEN', away: 'LAC', homeScore: 34, awayScore: 27 },
            { week: 16, date: '2024-12-22 16:25:00', home: 'LV', away: 'JAX', homeScore: 19, awayScore: 14 },
            { week: 16, date: '2024-12-22 20:20:00', home: 'SF', away: 'MIA', homeScore: 29, awayScore: 17 },

            // Week 17
            { week: 17, date: '2024-12-26 20:15:00', home: 'PIT', away: 'KC', homeScore: 29, awayScore: 10 },
            { week: 17, date: '2024-12-29 13:00:00', home: 'CAR', away: 'TB', homeScore: 48, awayScore: 14 },
            { week: 17, date: '2024-12-29 13:00:00', home: 'CHI', away: 'SEA', homeScore: 6, awayScore: 3 },
            { week: 17, date: '2024-12-29 13:00:00', home: 'CIN', away: 'DEN', homeScore: 30, awayScore: 24 },
            { week: 17, date: '2024-12-29 13:00:00', home: 'CLE', away: 'MIA', homeScore: 20, awayScore: 3 },
            { week: 17, date: '2024-12-29 13:00:00', home: 'GB', away: 'MIN', homeScore: 33, awayScore: 10 },
            { week: 17, date: '2024-12-29 13:00:00', home: 'HOU', away: 'BAL', homeScore: 2, awayScore: 31 },
            { week: 17, date: '2024-12-29 13:00:00', home: 'IND', away: 'NYG', homeScore: 45, awayScore: 33 },
            { week: 17, date: '2024-12-29 13:00:00', home: 'JAX', away: 'CAR', homeScore: 26, awayScore: 0 },
            { week: 17, date: '2024-12-29 13:00:00', home: 'NE', away: 'BUF', homeScore: 23, awayScore: 16 },
            { week: 17, date: '2024-12-29 13:00:00', home: 'NO', away: 'LV', homeScore: 25, awayScore: 10 },
            { week: 17, date: '2024-12-29 13:00:00', home: 'NYJ', away: 'CLE', homeScore: 15, awayScore: 20 },
            { week: 17, date: '2024-12-29 13:00:00', home: 'TEN', away: 'HOU', homeScore: 23, awayScore: 14 },
            { week: 17, date: '2024-12-29 16:05:00', home: 'LAC', away: 'NE', homeScore: 40, awayScore: 7 },
            { week: 17, date: '2024-12-29 16:25:00', home: 'ARI', away: 'LAR', homeScore: 13, awayScore: 9 },
            { week: 17, date: '2024-12-29 16:25:00', home: 'SF', away: 'DET', homeScore: 40, awayScore: 34 },
            { week: 17, date: '2024-12-29 20:20:00', home: 'DAL', away: 'WAS', homeScore: 38, awayScore: 10 },
            { week: 17, date: '2024-12-30 20:15:00', home: 'ATL', away: 'WAS', homeScore: 30, awayScore: 24 },

            // Week 18 (Final Week)
            { week: 18, date: '2025-01-05 13:00:00', home: 'ARI', away: 'SF', homeScore: 47, awayScore: 24 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'ATL', away: 'CAR', homeScore: 44, awayScore: 38 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'BAL', away: 'CLE', homeScore: 35, awayScore: 10 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'BUF', away: 'MIA', homeScore: 21, awayScore: 14 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'CHI', away: 'GB', homeScore: 24, awayScore: 22 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'CIN', away: 'PIT', homeScore: 19, awayScore: 17 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'DAL', away: 'WAS', homeScore: 26, awayScore: 24 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'DET', away: 'MIN', homeScore: 31, awayScore: 9 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'HOU', away: 'TEN', homeScore: 32, awayScore: 27 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'IND', away: 'JAX', homeScore: 28, awayScore: 20 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'KC', away: 'DEN', homeScore: 38, awayScore: 0 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'LAR', away: 'SEA', homeScore: 30, awayScore: 25 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'LV', away: 'LAC', homeScore: 35, awayScore: 32 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'NO', away: 'TB', homeScore: 27, awayScore: 19 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'NYG', away: 'PHI', homeScore: 20, awayScore: 33 },
            { week: 18, date: '2025-01-05 13:00:00', home: 'NYJ', away: 'NE', homeScore: 40, awayScore: 23 }
        ];

        let gamesInserted = 0;

        for (const game of games2024) {
            try {
                // Get team IDs
                const homeTeam = await this.pool.query('SELECT teamid FROM public.teams WHERE alias = $1', [game.home]);
                const awayTeam = await this.pool.query('SELECT teamid FROM public.teams WHERE alias = $1', [game.away]);

                if (homeTeam.rows.length === 0 || awayTeam.rows.length === 0) {
                    logger.warn(`Skipping game: ${game.away} @ ${game.home} - teams not found`);
                    continue;
                }

                const homeTeamId = homeTeam.rows[0].teamid;
                const awayTeamId = awayTeam.rows[0].teamid;

                // Generate a unique SportRadar-style game ID
                const gameDate = new Date(game.date);
                const sportRadarId = `sr:match:${gameDate.getFullYear()}-${(gameDate.getMonth() + 1).toString().padStart(2, '0')}-${gameDate.getDate().toString().padStart(2, '0')}-${game.home}-${game.away}`;

                // Insert game (removed venue column - doesn't exist in schema)
                await this.pool.query(`
                    INSERT INTO public.games (
                        sportradarid, week, season, gamedate, hometeamid, awayteamid,
                        hometeamscore, awayteamscore, status, iscomplete
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (sportradarid) DO UPDATE SET
                        hometeamscore = $7,
                        awayteamscore = $8,
                        status = $9,
                        iscomplete = $10
                `, [
                    sportRadarId,
                    game.week,
                    2024,
                    gameDate,
                    homeTeamId,
                    awayTeamId,
                    game.homeScore,
                    game.awayScore,
                    'closed',
                    true
                ]);

                gamesInserted++;

            } catch (error) {
                logger.error(`Failed to insert game ${game.away} @ ${game.home}:`, error);
            }
        }

        logger.info(`Successfully loaded ${gamesInserted} games from 2024 NFL season`);
    }

    /**
     * Get games for a specific week
     */
    async getWeekGames(week, season = 2024) {
        try {
            const query = `
                SELECT
                    g.gameid,
                    g.sportradarid,
                    g.week,
                    g.season,
                    g.gamedate,
                    g.hometeamscore,
                    g.awayteamscore,
                    g.status,
                    g.iscomplete,
                    ht.teamid as hometeamid,
                    ht.name as hometeamname,
                    ht.alias as hometeamalias,
                    ht.market as hometeammarket,
                    ht.fullname as hometeamfullname,
                    at.teamid as awayteamid,
                    at.name as awayteamname,
                    at.alias as awayteamalias,
                    at.market as awayteammarket,
                    at.fullname as awayteamfullname
                FROM public.games g
                INNER JOIN public.teams ht ON g.hometeamid = ht.teamid
                INNER JOIN public.teams at ON g.awayteamid = at.teamid
                WHERE g.week = $1 AND g.season = $2
                ORDER BY g.gamedate ASC
            `;

            const result = await this.pool.query(query, [week, season]);

            return result.rows.map(row => ({
                gameId: row.gameid,
                sportRadarId: row.sportradarid,
                week: row.week,
                season: row.season,
                gameDate: row.gamedate,
                status: row.status,
                isComplete: row.iscomplete,
                venue: null, // Venue column doesn't exist in PostgreSQL schema
                homeTeam: {
                    id: row.hometeamid,
                    name: row.hometeamname,
                    alias: row.hometeamalias,
                    market: row.hometeammarket,
                    fullName: row.hometeamfullname,
                    score: row.hometeamscore
                },
                awayTeam: {
                    id: row.awayteamid,
                    name: row.awayteamname,
                    alias: row.awayteamalias,
                    market: row.awayteammarket,
                    fullName: row.awayteamfullname,
                    score: row.awayteamscore
                },
                winner: this.determineWinner(row.hometeamid, row.awayteamid, row.hometeamscore, row.awayteamscore)
            }));

        } catch (error) {
            logger.error(`Failed to get week ${week} games:`, error);
            throw new Error(`Failed to retrieve week ${week} games`);
        }
    }

    /**
     * Determine game winner
     */
    determineWinner(homeTeamId, awayTeamId, homeScore, awayScore) {
        if (homeScore > awayScore) {
            return {
                result: 'home_win',
                winnerId: homeTeamId,
                winnerScore: homeScore,
                loserScore: awayScore
            };
        } else if (awayScore > homeScore) {
            return {
                result: 'away_win',
                winnerId: awayTeamId,
                winnerScore: awayScore,
                loserScore: homeScore
            };
        } else {
            return {
                result: 'tie',
                winnerId: null,
                winnerScore: homeScore,
                loserScore: awayScore
            };
        }
    }

    /**
     * Get database statistics
     */
    async getStats() {
        try {
            const teamsCount = await this.pool.query('SELECT COUNT(*) FROM public.teams');
            const gamesCount = await this.pool.query('SELECT COUNT(*) FROM public.games WHERE season = 2024');
            const weeksWithGames = await this.pool.query('SELECT DISTINCT week FROM public.games WHERE season = 2024 ORDER BY week');

            return {
                totalTeams: parseInt(teamsCount.rows[0].count),
                totalGames2024: parseInt(gamesCount.rows[0].count),
                weeksWithGames: weeksWithGames.rows.map(row => row.week)
            };
        } catch (error) {
            logger.error('Failed to get database stats:', error);
            throw new Error('Failed to retrieve database statistics');
        }
    }

    /**
     * Load 2024 NFL games from ArangoDB analytics database
     */
    async loadFromArangoDB() {
        try {
            logger.info('Loading 2024 NFL season data from ArangoDB...');
            
            // Test ArangoDB connection
            const connectionTest = await arangoDbService.testConnection();
            if (!connectionTest.success) {
                throw new Error(`ArangoDB connection failed: ${connectionTest.message}`);
            }

            // Get NFL 2024 games from ArangoDB
            const arangoGames = await arangoDbService.getNFL2024Games();
            if (!arangoGames || arangoGames.length === 0) {
                throw new Error('No NFL 2024 games found in ArangoDB');
            }

            logger.info(`Retrieved ${arangoGames.length} games from ArangoDB, loading into PostgreSQL...`);

            // First, load team mappings (if not already done)
            await this.loadTeamMappings();

            // Load ArangoDB games into PostgreSQL
            let gamesInserted = 0;
            for (const game of arangoGames) {
                try {
                    await this.insertArangoGame(game);
                    gamesInserted++;
                } catch (error) {
                    logger.warn(`Failed to insert game ${game.away} @ ${game.home}:`, error.message);
                }
            }

            logger.info(`Successfully loaded ${gamesInserted} games from ArangoDB`);
            return { success: true, message: `Loaded ${gamesInserted} games from ArangoDB`, source: 'arango' };

        } catch (error) {
            logger.error('Failed to load from ArangoDB, falling back to static data:', error.message);
            
            // Fallback to static data loading
            await this.load2024Games();
            return { success: true, message: 'Loaded static fallback data', source: 'static' };
        }
    }

    /**
     * Insert an ArangoDB game into PostgreSQL
     */
    async insertArangoGame(game) {
        // Normalize team codes
        const homeTeam = this.normalizeTeamCode(game.home);
        const awayTeam = this.normalizeTeamCode(game.away);

        // Get team IDs
        const homeTeamQuery = await this.pool.query('SELECT teamid FROM public.teams WHERE alias = $1', [homeTeam]);
        const awayTeamQuery = await this.pool.query('SELECT teamid FROM public.teams WHERE alias = $1', [awayTeam]);

        if (homeTeamQuery.rows.length === 0 || awayTeamQuery.rows.length === 0) {
            throw new Error(`Teams not found: ${awayTeam} @ ${homeTeam}`);
        }

        const homeTeamId = homeTeamQuery.rows[0].teamid;
        const awayTeamId = awayTeamQuery.rows[0].teamid;

        // Format date
        const gameDate = new Date(game.date);
        
        // Generate SportRadar-style ID if not provided
        let sportRadarId = game.gameId;
        if (!sportRadarId) {
            sportRadarId = `sr:match:${gameDate.getFullYear()}-${(gameDate.getMonth() + 1).toString().padStart(2, '0')}-${gameDate.getDate().toString().padStart(2, '0')}-${homeTeam}-${awayTeam}`;
        }

        // Insert game (removed venue column - doesn't exist in schema)
        // Use the actual season from the original source, not hardcoded 2024
        const actualSeason = game.season || 2024; // Default to 2024 only if not provided
        await this.pool.query(`
            INSERT INTO public.games (
                sportradarid, week, season, gamedate, hometeamid, awayteamid,
                hometeamscore, awayteamscore, status, iscomplete
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (sportradarid) DO UPDATE SET
                hometeamscore = $7,
                awayteamscore = $8,
                status = $9,
                iscomplete = $10
        `, [
            sportRadarId,
            game.week,
            actualSeason,
            gameDate,
            homeTeamId,
            awayTeamId,
            game.homeScore || 0,
            game.awayScore || 0,
            game.finished ? 'closed' : 'scheduled',
            game.finished || false
        ]);
    }

    /**
     * Normalize team codes to match PostgreSQL schema
     */
    normalizeTeamCode(teamCode) {
        if (!teamCode) return teamCode;
        
        const teamMap = {
            // ArangoDB -> PostgreSQL mappings
            'LA': 'LAR',    // Los Angeles Rams
            'LVR': 'LV',    // Las Vegas Raiders
            'WSH': 'WAS',   // Washington Commanders
            'JAC': 'JAX',   // Jacksonville Jaguars
            'TB': 'TB',     // Tampa Bay (keep as is)
            'NE': 'NE',     // New England (keep as is)
            'ARZ': 'ARI',   // Arizona Cardinals
            'HST': 'HOU',   // Houston Texans
            'BLT': 'BAL',   // Baltimore Ravens
            'CLV': 'CLE',   // Cleveland Browns
            'GNB': 'GB',    // Green Bay Packers
            'KCC': 'KC',    // Kansas City Chiefs
            'LAC': 'LAC',   // Los Angeles Chargers (keep as is)
            'LVR': 'LV',    // Las Vegas Raiders
            'NWE': 'NE',    // New England Patriots
            'NYG': 'NYG',   // New York Giants (keep as is)
            'NYJ': 'NYJ',   // New York Jets (keep as is)
            'SFO': 'SF',    // San Francisco 49ers
            'TAM': 'TB',    // Tampa Bay Buccaneers
            'WAS': 'WAS',   // Washington (keep as is)
            // Add more mappings as discovered from ArangoDB data
        };
        
        return teamMap[teamCode?.toUpperCase()] || teamCode?.toUpperCase();
    }

    /**
     * Get ArangoDB games for a specific week (direct from ArangoDB)
     */
    async getArangoWeekGames(week) {
        try {
            if (!arangoDbService.isConnected()) {
                await arangoDbService.connect();
            }
            
            const games = await arangoDbService.getNFL2024GamesByWeek(week);
            return games.map(game => ({
                week: game.week,
                date: game.date,
                home: this.normalizeTeamCode(game.home),
                away: this.normalizeTeamCode(game.away),
                homeScore: game.homeScore || 0,
                awayScore: game.awayScore || 0,
                gameId: game.gameId,
                finished: game.finished || false
            }));
        } catch (error) {
            logger.error(`Failed to get week ${week} from ArangoDB:`, error.message);
            throw error;
        }
    }

    /**
     * Test ArangoDB connection and schema
     */
    async testArangoConnection() {
        try {
            const result = await arangoDbService.testConnection();
            if (result.success && result.hasPffGames) {
                // Try to get sample games to verify schema
                const sampleGames = await arangoDbService.explorePffGamesSchema();
                return {
                    ...result,
                    sampleData: sampleGames?.slice(0, 2) // First 2 games as examples
                };
            }
            return result;
        } catch (error) {
            logger.error('ArangoDB connection test failed:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Enhanced load method with ArangoDB priority
     */
    async loadEnhanced2024SeasonData() {
        try {
            logger.info('Loading 2024 NFL season data with ArangoDB integration...');
            
            // Try ArangoDB first
            const arangoResult = await this.loadFromArangoDB();
            
            return {
                success: true,
                message: `2024 NFL season data loaded successfully from ${arangoResult.source}`,
                source: arangoResult.source,
                details: arangoResult.message
            };
        } catch (error) {
            logger.error('Enhanced data loading failed:', error.message);
            
            // Final fallback to original static method
            return await this.load2024SeasonData();
        }
    }
}

module.exports = new NFL2024DataService();