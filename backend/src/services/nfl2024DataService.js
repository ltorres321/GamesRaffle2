const { Pool } = require('pg');
const logger = require('../utils/logger');

/**
 * Service for loading 2024 NFL season historical data for testing
 * Since SportRadar has rate limits, we'll use static 2024 season data
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

            // Week 3 (add more weeks as needed)
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
            { week: 3, date: '2024-09-23 20:15:00', home: 'KC', away: 'CIN', homeScore: 26, awayScore: 25 }
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

                // Insert game
                await this.pool.query(`
                    INSERT INTO public.games (
                        sportradarid, week, season, gamedate, hometeamid, awayteamid,
                        hometeamscore, awayteamscore, status, iscomplete, venue
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
                    true,
                    `${game.home} Stadium`
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
                    g.venue,
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
                venue: row.venue,
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
}

module.exports = new NFL2024DataService();