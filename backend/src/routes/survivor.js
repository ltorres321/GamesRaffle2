const express = require('express');
const router = express.Router();
const nfl2024DataService = require('../services/nfl2024DataService');
const survivorGameService = require('../services/survivorGameService');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * NFL Survivor Game API Routes
 */

// ================================
// ADMIN ROUTES (Data Management)
// ================================

/**
 * Load 2024 NFL season data
 * POST /api/survivor/admin/load-2024-data
 */
router.post('/admin/load-2024-data', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const result = await nfl2024DataService.load2024SeasonData();
        
        res.json({
            success: true,
            message: '2024 NFL season data loaded successfully',
            data: result
        });

    } catch (error) {
        logger.error('Load 2024 data error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get database statistics
 * GET /api/survivor/admin/stats
 */
router.get('/admin/stats', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const stats = await nfl2024DataService.getStats();
        
        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Process weekly results (batch job)
 * POST /api/survivor/admin/process-week/:gameId/:week
 */
router.post('/admin/process-week/:gameId/:week', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { gameId, week } = req.params;
        const result = await survivorGameService.processWeeklyResults(gameId, parseInt(week));
        
        res.json({
            success: true,
            message: `Week ${week} results processed successfully`,
            data: result
        });

    } catch (error) {
        logger.error('Process week error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================================
// GAME MANAGEMENT ROUTES
// ================================

/**
 * Create a new survivor game
 * POST /api/survivor/games
 */
router.post('/games', auth, async (req, res) => {
    try {
        const gameData = {
            gameName: req.body.gameName,
            description: req.body.description,
            entryFee: req.body.entryFee,
            prizePool: req.body.prizePool,
            maxParticipants: req.body.maxParticipants,
            startWeek: req.body.startWeek,
            endWeek: req.body.endWeek,
            requireTwoPicksFromWeek: req.body.requireTwoPicksFromWeek,
            season: req.body.season || 2024
        };

        const result = await survivorGameService.createSurvivorGame(gameData, req.user.userId);
        
        res.status(201).json({
            success: true,
            message: 'Survivor game created successfully',
            data: result
        });

    } catch (error) {
        logger.error('Create survivor game error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get survivor game details
 * GET /api/survivor/games/:gameId
 */
router.get('/games/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const result = await survivorGameService.getSurvivorGame(gameId);
        
        res.json({
            success: true,
            data: result.game
        });

    } catch (error) {
        logger.error('Get survivor game error:', error);
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Join a survivor game
 * POST /api/survivor/games/:gameId/join
 */
router.post('/games/:gameId/join', auth, async (req, res) => {
    try {
        const { gameId } = req.params;
        const result = await survivorGameService.joinSurvivorGame(gameId, req.user.userId);
        
        res.json({
            success: true,
            message: 'Successfully joined survivor game',
            data: result
        });

    } catch (error) {
        logger.error('Join survivor game error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// ================================
// GAME DATA ROUTES
// ================================

/**
 * Get NFL games for a specific week
 * GET /api/survivor/nfl/week/:week?season=2024
 */
router.get('/nfl/week/:week', async (req, res) => {
    try {
        const { week } = req.params;
        const season = req.query.season || 2024;
        
        const games = await nfl2024DataService.getWeekGames(parseInt(week), parseInt(season));
        
        res.json({
            success: true,
            data: {
                week: parseInt(week),
                season: parseInt(season),
                games: games
            }
        });

    } catch (error) {
        logger.error('Get week games error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get all teams
 * GET /api/survivor/nfl/teams
 */
router.get('/nfl/teams', async (req, res) => {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        const result = await pool.query(`
            SELECT teamid, name, alias, market, fullname, conference, division, primarycolor, secondarycolor
            FROM public.teams 
            ORDER BY conference, division, name
        `);

        const teams = result.rows.map(team => ({
            teamId: team.teamid,
            name: team.name,
            alias: team.alias,
            market: team.market,
            fullName: team.fullname,
            conference: team.conference,
            division: team.division,
            primaryColor: team.primarycolor,
            secondaryColor: team.secondarycolor
        }));

        res.json({
            success: true,
            data: teams
        });

    } catch (error) {
        logger.error('Get teams error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================================
// PLAYER PICK ROUTES
// ================================

/**
 * Submit a pick
 * POST /api/survivor/picks
 */
router.post('/picks', auth, async (req, res) => {
    try {
        const {
            gameId,        // Survivor game ID
            week,
            teamId,
            nflGameId,     // NFL game ID
            pickNumber = 1
        } = req.body;

        if (!gameId || !week || !teamId || !nflGameId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: gameId, week, teamId, nflGameId'
            });
        }

        const result = await survivorGameService.submitPick(
            gameId, 
            req.user.userId, 
            parseInt(week), 
            parseInt(teamId), 
            nflGameId, 
            parseInt(pickNumber)
        );
        
        res.json({
            success: true,
            message: 'Pick submitted successfully',
            data: result
        });

    } catch (error) {
        logger.error('Submit pick error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get player's picks for a survivor game
 * GET /api/survivor/picks/:gameId?season=2024
 */
router.get('/picks/:gameId', auth, async (req, res) => {
    try {
        const { gameId } = req.params;
        const season = req.query.season || 2024;
        
        const result = await survivorGameService.getPlayerPicks(gameId, req.user.userId, parseInt(season));
        
        res.json({
            success: true,
            data: result.picks
        });

    } catch (error) {
        logger.error('Get player picks error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get available teams for pick (teams not yet used by player)
 * GET /api/survivor/picks/:gameId/available-teams?season=2024
 */
router.get('/picks/:gameId/available-teams', auth, async (req, res) => {
    try {
        const { gameId } = req.params;
        const season = req.query.season || 2024;

        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Get teams already used by this player
        const usedTeamsQuery = `
            SELECT DISTINCT pp.teamid 
            FROM public.playerpicks pp
            INNER JOIN public.games g ON pp.gameid = g.gameid
            WHERE pp.playerid = $1 AND g.season = $2
            AND pp.playerid IN (
                SELECT playerid FROM public.survivorgameplayers WHERE survivorgameid = $3
            )
        `;

        const usedResult = await pool.query(usedTeamsQuery, [req.user.userId, parseInt(season), gameId]);
        const usedTeamIds = usedResult.rows.map(row => row.teamid);

        // Get all teams
        const allTeamsQuery = `
            SELECT teamid, name, alias, market, fullname, conference, division
            FROM public.teams 
            ORDER BY conference, division, name
        `;

        const allTeamsResult = await pool.query(allTeamsQuery);
        
        // Filter out used teams
        const availableTeams = allTeamsResult.rows
            .filter(team => !usedTeamIds.includes(team.teamid))
            .map(team => ({
                teamId: team.teamid,
                name: team.name,
                alias: team.alias,
                market: team.market,
                fullName: team.fullname,
                conference: team.conference,
                division: team.division
            }));

        res.json({
            success: true,
            data: {
                availableTeams,
                usedTeamIds,
                totalAvailable: availableTeams.length,
                totalUsed: usedTeamIds.length
            }
        });

    } catch (error) {
        logger.error('Get available teams error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================================
// LEADERBOARD & STATUS ROUTES
// ================================

/**
 * Get survivor game leaderboard
 * GET /api/survivor/games/:gameId/leaderboard
 */
router.get('/games/:gameId/leaderboard', async (req, res) => {
    try {
        const { gameId } = req.params;

        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        const leaderboardQuery = `
            SELECT 
                sgp.playerid,
                sgp.status,
                sgp.eliminatedweek,
                sgp.eliminatedreason,
                sgp.joinedat,
                u.username,
                u.firstname,
                u.lastname,
                COUNT(CASE WHEN gh.survived = true THEN 1 END) as weeks_survived
            FROM public.survivorgameplayers sgp
            INNER JOIN public.users u ON sgp.playerid = u.userid
            LEFT JOIN public.gamehistory gh ON sgp.survivorgameid = gh.survivorgameid AND sgp.playerid = gh.playerid
            WHERE sgp.survivorgameid = $1
            GROUP BY sgp.playerid, sgp.status, sgp.eliminatedweek, sgp.eliminatedreason, sgp.joinedat,
                     u.username, u.firstname, u.lastname
            ORDER BY sgp.status DESC, weeks_survived DESC, sgp.eliminatedweek DESC NULLS FIRST
        `;

        const result = await pool.query(leaderboardQuery, [gameId]);

        const leaderboard = result.rows.map((row, index) => ({
            rank: index + 1,
            playerId: row.playerid,
            username: row.username,
            playerName: row.firstname && row.lastname ? `${row.firstname} ${row.lastname}` : row.username,
            status: row.status,
            weeksSurvived: parseInt(row.weeks_survived || 0),
            eliminatedWeek: row.eliminatedweek,
            eliminatedReason: row.eliminatedreason,
            joinedAt: row.joinedat
        }));

        res.json({
            success: true,
            data: leaderboard
        });

    } catch (error) {
        logger.error('Get leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Get player's game status
 * GET /api/survivor/games/:gameId/my-status
 */
router.get('/games/:gameId/my-status', auth, async (req, res) => {
    try {
        const { gameId } = req.params;

        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Get player's participation status
        const participantQuery = `
            SELECT * FROM public.survivorgameplayers 
            WHERE survivorgameid = $1 AND playerid = $2
        `;

        const participantResult = await pool.query(participantQuery, [gameId, req.user.userId]);

        if (participantResult.rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    isParticipant: false,
                    status: null
                }
            });
        }

        const participant = participantResult.rows[0];

        // Get pick history
        const picksResult = await survivorGameService.getPlayerPicks(gameId, req.user.userId);

        res.json({
            success: true,
            data: {
                isParticipant: true,
                status: participant.status,
                eliminatedWeek: participant.eliminatedweek,
                eliminatedReason: participant.eliminatedreason,
                joinedAt: participant.joinedat,
                eliminatedAt: participant.eliminatedat,
                picks: picksResult.picks
            }
        });

    } catch (error) {
        logger.error('Get my status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================================
// HEALTH CHECK
// ================================

/**
 * Health check endpoint
 * GET /api/survivor/health
 */
router.get('/health', async (req, res) => {
    try {
        const stats = await nfl2024DataService.getStats();
        
        res.json({
            success: true,
            service: 'NFL Survivor Game API',
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                stats: stats
            }
        });

    } catch (error) {
        logger.error('Health check error:', error);
        res.status(500).json({
            success: false,
            service: 'NFL Survivor Game API',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

module.exports = router;