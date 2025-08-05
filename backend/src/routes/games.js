const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const gameService = require('../services/gameService');
const sportRadarService = require('../services/sportRadarService');
const scheduledJobService = require('../services/scheduledJobService');
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

/**
 * @route GET /api/games/current-week
 * @desc Get current week NFL games
 * @access Public
 */
router.get('/current-week', async (req, res) => {
    try {
        logger.info('Fetching current week games');
        
        const currentWeek = await gameService.getCurrentWeek();
        const games = await gameService.getWeekGames(currentWeek);
        
        res.json({
            success: true,
            data: {
                week: currentWeek,
                season: gameService.currentSeason,
                games: games,
                count: games.length
            }
        });
    } catch (error) {
        logger.error('Failed to get current week games:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current week games',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route GET /api/games/week/:week
 * @desc Get games for specific week
 * @access Public
 */
router.get('/week/:week', [
    param('week').isInt({ min: 1, max: 18 }).withMessage('Week must be between 1 and 18'),
    query('season').optional().isInt({ min: 2020 }).withMessage('Season must be a valid year')
], handleValidationErrors, async (req, res) => {
    try {
        const { week } = req.params;
        const { season } = req.query;
        
        logger.info(`Fetching games for week ${week}, season ${season || 'current'}`);
        
        const games = await gameService.getWeekGames(parseInt(week), season ? parseInt(season) : null);
        
        res.json({
            success: true,
            data: {
                week: parseInt(week),
                season: season ? parseInt(season) : gameService.currentSeason,
                games: games,
                count: games.length
            }
        });
    } catch (error) {
        logger.error(`Failed to get games for week ${req.params.week}:`, error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch games for specified week',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route GET /api/games/:gameId/boxscore
 * @desc Get game boxscore from SportRadar
 * @access Public
 */
router.get('/:gameId/boxscore', [
    param('gameId').isUUID().withMessage('Game ID must be a valid UUID')
], handleValidationErrors, async (req, res) => {
    try {
        const { gameId } = req.params;
        
        logger.info(`Fetching boxscore for game ${gameId}`);
        
        const boxscore = await sportRadarService.getGameBoxscore(gameId);
        
        if (!boxscore) {
            return res.status(404).json({
                success: false,
                message: 'Game not found or boxscore not available'
            });
        }
        
        res.json({
            success: true,
            data: boxscore
        });
    } catch (error) {
        logger.error(`Failed to get boxscore for game ${req.params.gameId}:`, error.message);
        
        if (error.message.includes('404')) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to fetch game boxscore',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route GET /api/games/schedule/current-season  
 * @desc Get current season schedule from SportRadar
 * @access Public
 */
router.get('/schedule/current-season', async (req, res) => {
    try {
        logger.info('Fetching current season schedule');
        
        const schedule = await sportRadarService.getCurrentSeasonSchedule();
        
        res.json({
            success: true,
            data: {
                season: gameService.currentSeason,
                games: schedule,
                count: schedule.length
            }
        });
    } catch (error) {
        logger.error('Failed to get current season schedule:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current season schedule',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route POST /api/games/sync/teams
 * @desc Sync NFL teams from SportRadar (Admin only)
 * @access Private (Admin)
 */
router.post('/sync/teams', authenticate, authorize(['Admin', 'SuperAdmin']), async (req, res) => {
    try {
        logger.info(`Admin ${req.user.userId} initiated teams sync`);
        
        const result = await gameService.syncNFLTeams();
        
        res.json({
            success: true,
            message: 'NFL teams synced successfully',
            data: result
        });
    } catch (error) {
        logger.error('Failed to sync NFL teams:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to sync NFL teams',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route POST /api/games/sync/current-week
 * @desc Sync current week games from SportRadar (Admin only)
 * @access Private (Admin)
 */
router.post('/sync/current-week', authenticate, authorize(['Admin', 'SuperAdmin']), async (req, res) => {
    try {
        logger.info(`Admin ${req.user.userId} initiated current week games sync`);
        
        const result = await gameService.syncCurrentWeekGames();
        
        res.json({
            success: true,
            message: 'Current week games synced successfully',
            data: result
        });
    } catch (error) {
        logger.error('Failed to sync current week games:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to sync current week games',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route POST /api/games/update-scores
 * @desc Update game scores from SportRadar (Admin only)
 * @access Private (Admin)
 */
router.post('/update-scores', authenticate, authorize(['Admin', 'SuperAdmin']), [
    body('gameIds').optional().isArray().withMessage('Game IDs must be an array'),
    body('gameIds.*').optional().isUUID().withMessage('Each game ID must be a valid UUID')
], handleValidationErrors, async (req, res) => {
    try {
        const { gameIds } = req.body;
        
        logger.info(`Admin ${req.user.userId} initiated scores update${gameIds ? ` for ${gameIds.length} games` : ' for all games'}`);
        
        const result = await gameService.updateGameScores(gameIds);
        
        res.json({
            success: true,
            message: 'Game scores updated successfully',
            data: result
        });
    } catch (error) {
        logger.error('Failed to update game scores:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update game scores',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route GET /api/games/jobs/status
 * @desc Get scheduled jobs status (Admin only)
 * @access Private (Admin)
 */
router.get('/jobs/status', authenticate, authorize(['Admin', 'SuperAdmin']), async (req, res) => {
    try {
        const status = scheduledJobService.getStatus();
        const nextRuns = scheduledJobService.getNextRunTimes();
        const apiStats = await sportRadarService.getApiStats();
        
        res.json({
            success: true,
            data: {
                scheduledJobs: status,
                nextRunTimes: nextRuns,
                apiStats: apiStats
            }
        });
    } catch (error) {
        logger.error('Failed to get jobs status:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get jobs status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route POST /api/games/jobs/trigger/:jobName
 * @desc Manually trigger a scheduled job (Admin only)
 * @access Private (Admin)
 */
router.post('/jobs/trigger/:jobName', authenticate, authorize(['Admin', 'SuperAdmin']), [
    param('jobName').isIn(['scoreCheck', 'scheduleUpdate', 'gameProcessing']).withMessage('Invalid job name')
], handleValidationErrors, async (req, res) => {
    try {
        const { jobName } = req.params;
        
        logger.info(`Admin ${req.user.userId} manually triggered job: ${jobName}`);
        
        const result = await scheduledJobService.triggerJob(jobName);
        
        res.json({
            success: true,
            message: `Job ${jobName} completed successfully`,
            data: result
        });
    } catch (error) {
        logger.error(`Failed to trigger job ${req.params.jobName}:`, error.message);
        res.status(500).json({
            success: false,
            message: `Failed to trigger job ${req.params.jobName}`,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route GET /api/games/stats/api
 * @desc Get SportRadar API usage statistics
 * @access Private (Admin)
 */
router.get('/stats/api', authenticate, authorize(['Admin', 'SuperAdmin']), async (req, res) => {
    try {
        const stats = await sportRadarService.getApiStats();
        
        res.json({
            success: true,
            data: stats || {
                message: 'No API statistics available yet'
            }
        });
    } catch (error) {
        logger.error('Failed to get API stats:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get API statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route GET /api/games/health
 * @desc Check games service health
 * @access Public
 */
router.get('/health', async (req, res) => {
    try {
        const currentWeek = await gameService.getCurrentWeek();
        const apiStats = await sportRadarService.getApiStats();
        const jobsStatus = scheduledJobService.getStatus();
        
        res.json({
            success: true,
            data: {
                status: 'healthy',
                currentWeek: currentWeek,
                currentSeason: gameService.currentSeason,
                scheduledJobs: {
                    initialized: jobsStatus.initialized,
                    runningJobs: Object.keys(jobsStatus.jobs).length
                },
                sportRadarAPI: {
                    configured: !!process.env.SPORTRADAR_API_KEY,
                    requestCount: apiStats?.requestCount || 0,
                    lastRequest: apiStats?.lastRequest || null
                }
            }
        });
    } catch (error) {
        logger.error('Games health check failed:', error.message);
        res.status(503).json({
            success: false,
            data: {
                status: 'unhealthy',
                error: error.message
            }
        });
    }
});

module.exports = router;