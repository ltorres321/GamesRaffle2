const cron = require('node-cron');
const gameService = require('./gameService');
const sportRadarService = require('./sportRadarService');
const logger = require('../utils/logger');

class ScheduledJobService {
    constructor() {
        this.jobs = new Map();
        this.isInitialized = false;
        
        // Get cron expressions from environment
        this.scoreCheckCron = process.env.SCORE_CHECK_CRON || '0 3 * * 2'; // Tuesday 3 AM
        this.scheduleUpdateCron = process.env.SCHEDULE_UPDATE_CRON || '0 2 * * *'; // Daily 2 AM
        this.gameProcessingCron = process.env.GAME_PROCESSING_CRON || '*/15 * * * *'; // Every 15 minutes
        this.timezone = process.env.CRON_TIMEZONE || 'America/New_York';
    }

    /**
     * Initialize all scheduled jobs
     */
    initialize() {
        if (this.isInitialized) {
            logger.warn('Scheduled jobs already initialized');
            return;
        }

        try {
            // Score checking job (Tuesday 3 AM)
            this.scheduleScoreCheck();
            
            // Schedule update job (Daily 2 AM)
            this.scheduleUpdate();
            
            // Game processing job (Every 15 minutes during game days)
            this.scheduleGameProcessing();
            
            this.isInitialized = true;
            logger.info('All scheduled jobs initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize scheduled jobs:', error.message);
            throw error;
        }
    }

    /**
     * Schedule automatic score checking (Tuesday 3 AM)
     */
    scheduleScoreCheck() {
        const job = cron.schedule(this.scoreCheckCron, async () => {
            try {
                logger.info('Starting scheduled score check job');
                await this.runScoreCheck();
                logger.info('Scheduled score check job completed');
            } catch (error) {
                logger.error('Scheduled score check job failed:', error.message);
            }
        }, {
            scheduled: true,
            timezone: this.timezone
        });

        this.jobs.set('scoreCheck', job);
        logger.info(`Score check job scheduled: ${this.scoreCheckCron} (${this.timezone})`);
    }

    /**
     * Schedule daily updates (Daily 2 AM)
     */
    scheduleUpdate() {
        const job = cron.schedule(this.scheduleUpdateCron, async () => {
            try {
                logger.info('Starting scheduled update job');
                await this.runScheduleUpdate();
                logger.info('Scheduled update job completed');
            } catch (error) {
                logger.error('Scheduled update job failed:', error.message);
            }
        }, {
            scheduled: true,
            timezone: this.timezone
        });

        this.jobs.set('scheduleUpdate', job);
        logger.info(`Schedule update job scheduled: ${this.scheduleUpdateCron} (${this.timezone})`);
    }

    /**
     * Schedule game processing (Every 15 minutes)
     */
    scheduleGameProcessing() {
        const job = cron.schedule(this.gameProcessingCron, async () => {
            try {
                // Only run during NFL season and on game days
                if (await this.shouldProcessGames()) {
                    logger.info('Starting scheduled game processing job');
                    await this.runGameProcessing();
                    logger.info('Scheduled game processing job completed');
                }
            } catch (error) {
                logger.error('Scheduled game processing job failed:', error.message);
            }
        }, {
            scheduled: true,
            timezone: this.timezone
        });

        this.jobs.set('gameProcessing', job);
        logger.info(`Game processing job scheduled: ${this.gameProcessingCron} (${this.timezone})`);
    }

    /**
     * Run comprehensive score check
     */
    async runScoreCheck() {
        try {
            logger.info('=== Starting Weekly Score Check ===');
            
            // 1. Sync teams first
            logger.info('Step 1: Syncing NFL teams');
            await gameService.syncNFLTeams();
            
            // 2. Sync current week games
            logger.info('Step 2: Syncing current week games');
            await gameService.syncCurrentWeekGames();
            
            // 3. Update all game scores
            logger.info('Step 3: Updating game scores');
            const scoreResults = await gameService.updateGameScores();
            
            // 4. Log summary
            logger.info('=== Weekly Score Check Summary ===');
            logger.info(`Games Updated: ${scoreResults.gamesUpdated}`);
            logger.info(`Games Finalized: ${scoreResults.gamesFinalized}`);
            logger.info(`Errors: ${scoreResults.errors}`);
            
            return scoreResults;
        } catch (error) {
            logger.error('Weekly score check failed:', error.message);
            throw error;
        }
    }

    /**
     * Run schedule update
     */
    async runScheduleUpdate() {
        try {
            logger.info('=== Starting Schedule Update ===');
            
            // 1. Sync teams
            const teamResults = await gameService.syncNFLTeams();
            logger.info(`Teams synced: ${teamResults.teamsProcessed}`);
            
            // 2. Sync current week games
            const gameResults = await gameService.syncCurrentWeekGames();
            logger.info(`Games processed: ${gameResults.gamesProcessed}`);
            logger.info(`Games created: ${gameResults.gamesCreated}`);
            logger.info(`Games updated: ${gameResults.gamesUpdated}`);
            
            return { teamResults, gameResults };
        } catch (error) {
            logger.error('Schedule update failed:', error.message);
            throw error;
        }
    }

    /**
     * Run game processing (live score updates)
     */
    async runGameProcessing() {
        try {
            logger.debug('Starting game processing');
            
            // Update scores for games in progress
            const results = await gameService.updateGameScores();
            
            if (results.gamesUpdated > 0) {
                logger.info(`Game processing: ${results.gamesUpdated} games updated, ${results.gamesFinalized} finalized`);
            }
            
            return results;
        } catch (error) {
            logger.error('Game processing failed:', error.message);
            throw error;
        }
    }

    /**
     * Check if we should process games (NFL season and game days)
     */
    async shouldProcessGames() {
        try {
            const now = new Date();
            const currentMonth = now.getMonth() + 1; // 1-12
            const currentDay = now.getDay(); // 0-6 (Sunday-Saturday)
            
            // NFL season typically runs September through February
            const isNFLSeason = currentMonth >= 9 || currentMonth <= 2;
            
            // Games typically on Thursday (4), Sunday (0), Monday (1), and sometimes Saturday (6)
            const isGameDay = [0, 1, 4, 6].includes(currentDay);
            
            // Also check if there are any games today
            const todayGames = await gameService.getWeekGames(await gameService.getCurrentWeek());
            const hasGamesToday = todayGames.some(game => {
                const gameDate = new Date(game.GameDate);
                return gameDate.toDateString() === now.toDateString();
            });
            
            return isNFLSeason && (isGameDay || hasGamesToday);
        } catch (error) {
            logger.error('Failed to check if should process games:', error.message);
            return false; // Default to not processing on error
        }
    }

    /**
     * Start all jobs
     */
    start() {
        if (!this.isInitialized) {
            this.initialize();
        }

        this.jobs.forEach((job, name) => {
            job.start();
            logger.info(`Started job: ${name}`);
        });

        logger.info('All scheduled jobs started');
    }

    /**
     * Stop all jobs
     */
    stop() {
        this.jobs.forEach((job, name) => {
            job.stop();
            logger.info(`Stopped job: ${name}`);
        });

        logger.info('All scheduled jobs stopped');
    }

    /**
     * Get job status
     */
    getStatus() {
        const status = {};
        
        this.jobs.forEach((job, name) => {
            status[name] = {
                running: job.running,
                scheduled: job.scheduled
            };
        });

        return {
            initialized: this.isInitialized,
            jobs: status,
            config: {
                scoreCheckCron: this.scoreCheckCron,
                scheduleUpdateCron: this.scheduleUpdateCron,
                gameProcessingCron: this.gameProcessingCron,
                timezone: this.timezone
            }
        };
    }

    /**
     * Manually trigger a job
     */
    async triggerJob(jobName) {
        switch (jobName) {
            case 'scoreCheck':
                return await this.runScoreCheck();
            case 'scheduleUpdate':
                return await this.runScheduleUpdate();
            case 'gameProcessing':
                return await this.runGameProcessing();
            default:
                throw new Error(`Unknown job: ${jobName}`);
        }
    }

    /**
     * Update job schedule
     */
    updateJobSchedule(jobName, cronExpression) {
        if (!this.jobs.has(jobName)) {
            throw new Error(`Job not found: ${jobName}`);
        }

        // Stop existing job
        const existingJob = this.jobs.get(jobName);
        existingJob.stop();
        existingJob.destroy();

        // Create new job with updated schedule
        let newJob;
        switch (jobName) {
            case 'scoreCheck':
                this.scoreCheckCron = cronExpression;
                this.scheduleScoreCheck();
                break;
            case 'scheduleUpdate':
                this.scheduleUpdateCron = cronExpression;
                this.scheduleUpdate();
                break;
            case 'gameProcessing':
                this.gameProcessingCron = cronExpression;
                this.scheduleGameProcessing();
                break;
            default:
                throw new Error(`Cannot update schedule for job: ${jobName}`);
        }

        logger.info(`Updated schedule for job ${jobName}: ${cronExpression}`);
    }

    /**
     * Get next run times for all jobs
     */
    getNextRunTimes() {
        const nextRuns = {};
        
        this.jobs.forEach((job, name) => {
            try {
                nextRuns[name] = job.nextDate().toISO();
            } catch (error) {
                nextRuns[name] = null;
            }
        });

        return nextRuns;
    }
}

module.exports = new ScheduledJobService();