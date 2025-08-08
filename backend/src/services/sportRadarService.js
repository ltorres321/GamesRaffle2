const axios = require('axios');
const memoryCache = require('../config/memoryCache');
const logger = require('../utils/logger');

class SportRadarService {
    constructor() {
        this.apiKey = process.env.SPORTRADAR_API_KEY;
        this.baseUrl = process.env.SPORTRADAR_BASE_URL || 'https://api.sportradar.com/nfl/official';
        this.accessLevel = process.env.SPORTRADAR_ACCESS_LEVEL || 'trial';
        this.language = process.env.SPORTRADAR_LANGUAGE || 'en';
        this.timeout = parseInt(process.env.SPORTRADAR_TIMEOUT) || 15000;
        this.retryAttempts = parseInt(process.env.SPORTRADAR_RETRY_ATTEMPTS) || 3;
        this.retryDelay = parseInt(process.env.SPORTRADAR_RETRY_DELAY) || 2000;
        this.cacheTTL = parseInt(process.env.SPORTRADAR_CACHE_TTL) || 600;
        this.scheduleCacheTTL = parseInt(process.env.SPORTRADAR_SCHEDULE_CACHE_TTL) || 86400;
        this.scoreCacheTTL = parseInt(process.env.SPORTRADAR_SCORE_CACHE_TTL) || 300;

        if (!this.apiKey) {
            throw new Error('SPORTRADAR_API_KEY is required');
        }

        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SurvivorSports/1.0'
            }
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            response => response,
            error => {
                logger.error('SportRadar API Error:', {
                    url: error.config?.url,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Build API URL with parameters
     */
    buildApiUrl(endpoint) {
        return `/${this.accessLevel}/v7/${this.language}/${endpoint}.json?api_key=${this.apiKey}`;
    }

    /**
     * Make API request with retry logic
     */
    async makeRequest(url, cacheKey, cacheTTL = this.cacheTTL) {
        // Try to get from cache first
        if (cacheKey) {
            try {
                const cached = await memoryCache.get(cacheKey);
                if (cached) {
                    logger.debug(`Cache hit for ${cacheKey}`);
                    return JSON.parse(cached);
                }
            } catch (error) {
                logger.warn('Cache read error:', error.message);
            }
        }

        let lastError;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                logger.debug(`SportRadar API request attempt ${attempt}: ${url}`);
                const response = await this.client.get(url);
                
                // Cache successful response
                if (cacheKey && response.data) {
                    try {
                        await memoryCache.setex(cacheKey, cacheTTL, JSON.stringify(response.data));
                        logger.debug(`Cached response for ${cacheKey} (TTL: ${cacheTTL}s)`);
                    } catch (error) {
                        logger.warn('Cache write error:', error.message);
                    }
                }

                return response.data;
            } catch (error) {
                lastError = error;
                
                if (attempt < this.retryAttempts) {
                    const delay = this.retryDelay * attempt;
                    logger.warn(`SportRadar API request failed (attempt ${attempt}), retrying in ${delay}ms:`, error.message);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    logger.error(`SportRadar API request failed after ${this.retryAttempts} attempts:`, error.message);
                }
            }
        }

        throw lastError;
    }

    /**
     * Get current NFL season year
     */
    getCurrentSeason() {
        const now = new Date();
        const currentYear = now.getFullYear();
        // NFL season starts in September, so if we're before March, use previous year
        return now.getMonth() < 3 ? currentYear - 1 : currentYear;
    }

    /**
     * Get current week schedule
     */
    async getCurrentWeekSchedule() {
        const url = this.buildApiUrl('games/current_week/schedule');
        const cacheKey = `sportradar:schedule:current_week:${this.getCurrentSeason()}`;
        
        try {
            const data = await this.makeRequest(url, cacheKey, this.scheduleCacheTTL);
            logger.info('Successfully fetched current week schedule');
            return this.transformScheduleData(data);
        } catch (error) {
            logger.error('Failed to fetch current week schedule:', error.message);
            throw new Error('Unable to fetch current week schedule');
        }
    }

    /**
     * Get current season schedule
     */
    async getCurrentSeasonSchedule() {
        const url = this.buildApiUrl('games/current_season/schedule');
        const cacheKey = `sportradar:schedule:current_season:${this.getCurrentSeason()}`;
        
        try {
            const data = await this.makeRequest(url, cacheKey, this.scheduleCacheTTL);
            logger.info('Successfully fetched current season schedule');
            return this.transformScheduleData(data);
        } catch (error) {
            logger.error('Failed to fetch current season schedule:', error.message);
            throw new Error('Unable to fetch current season schedule');
        }
    }

    /**
     * Get game boxscore by game ID
     */
    async getGameBoxscore(gameId) {
        if (!gameId) {
            throw new Error('Game ID is required');
        }

        const url = this.buildApiUrl(`games/${gameId}/boxscore`);
        const cacheKey = `sportradar:boxscore:${gameId}`;
        
        try {
            const data = await this.makeRequest(url, cacheKey, this.scoreCacheTTL);
            logger.info(`Successfully fetched boxscore for game ${gameId}`);
            return this.transformBoxscoreData(data);
        } catch (error) {
            logger.error(`Failed to fetch boxscore for game ${gameId}:`, error.message);
            throw new Error(`Unable to fetch boxscore for game ${gameId}`);
        }
    }

    /**
     * Get multiple game boxscores
     */
    async getMultipleBoxscores(gameIds) {
        if (!Array.isArray(gameIds) || gameIds.length === 0) {
            throw new Error('Game IDs array is required');
        }

        const boxscores = [];
        const errors = [];

        // Process games in parallel but with rate limiting
        const batchSize = 5; // Process 5 games at a time to respect rate limits
        for (let i = 0; i < gameIds.length; i += batchSize) {
            const batch = gameIds.slice(i, i + batchSize);
            const promises = batch.map(async gameId => {
                try {
                    const boxscore = await this.getGameBoxscore(gameId);
                    return { gameId, boxscore, success: true };
                } catch (error) {
                    errors.push({ gameId, error: error.message });
                    return { gameId, error: error.message, success: false };
                }
            });

            const results = await Promise.all(promises);
            boxscores.push(...results);

            // Add delay between batches to respect rate limits
            if (i + batchSize < gameIds.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return { boxscores, errors };
    }

    /**
     * Transform schedule data to our format
     */
    transformScheduleData(data) {
        if (!data || !data.games) {
            return [];
        }

        return data.games.map(game => ({
            gameId: game.id,
            status: game.status,
            scheduled: game.scheduled,
            week: data.week?.number || null,
            season: data.season?.year || this.getCurrentSeason(),
            homeTeam: {
                id: game.home?.id,
                name: game.home?.name,
                alias: game.home?.alias,
                market: game.home?.market
            },
            awayTeam: {
                id: game.away?.id,
                name: game.away?.name,
                alias: game.away?.alias,
                market: game.away?.market
            },
            venue: {
                id: game.venue?.id,
                name: game.venue?.name,
                city: game.venue?.city,
                state: game.venue?.state
            }
        }));
    }

    /**
     * Transform boxscore data to our format
     */
    transformBoxscoreData(data) {
        if (!data) {
            return null;
        }

        const homeScore = data.summary?.home?.points || 0;
        const awayScore = data.summary?.away?.points || 0;
        const status = data.status;
        const isComplete = status === 'closed';

        let winner = null;
        if (isComplete) {
            if (homeScore > awayScore) {
                winner = 'home';
            } else if (awayScore > homeScore) {
                winner = 'away';
            } else {
                winner = 'tie';
            }
        }

        return {
            gameId: data.id,
            status: status,
            scheduled: data.scheduled,
            isComplete: isComplete,
            homeTeam: {
                id: data.summary?.home?.id,
                name: data.summary?.home?.name,
                alias: data.summary?.home?.alias,
                market: data.summary?.home?.market,
                points: homeScore
            },
            awayTeam: {
                id: data.summary?.away?.id,
                name: data.summary?.away?.name,
                alias: data.summary?.away?.alias,
                market: data.summary?.away?.market,
                points: awayScore
            },
            winner: winner,
            scoring: {
                quarters: data.scoring?.quarters || [],
                overtime: data.scoring?.overtime || []
            },
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Determine game winner from team IDs and scores
     */
    determineWinner(homeTeamId, awayTeamId, homeScore, awayScore) {
        if (homeScore > awayScore) {
            return {
                result: 'home_win',
                winnerId: homeTeamId,
                loserId: awayTeamId,
                winnerScore: homeScore,
                loserScore: awayScore
            };
        } else if (awayScore > homeScore) {
            return {
                result: 'away_win',
                winnerId: awayTeamId,
                loserId: homeTeamId,
                winnerScore: awayScore,
                loserScore: homeScore
            };
        } else {
            return {
                result: 'tie',
                winnerId: null,
                loserId: null,
                winnerScore: homeScore,
                loserScore: awayScore
            };
        }
    }

    /**
     * Check if pick is correct
     */
    isPickCorrect(pickedTeamId, gameResult) {
        if (!gameResult || !gameResult.winnerId) {
            return null; // Game not complete or tie
        }
        return pickedTeamId === gameResult.winnerId;
    }

    /**
     * Get API usage statistics
     */
    async getApiStats() {
        try {
            const statsKey = 'sportradar:api_stats';
            const stats = await memoryCache.get(statsKey);
            return stats ? JSON.parse(stats) : {
                requestCount: 0,
                errorCount: 0,
                lastRequest: null,
                cacheHits: 0,
                cacheMisses: 0
            };
        } catch (error) {
            logger.warn('Failed to get API stats:', error.message);
            return null;
        }
    }

    /**
     * Update API usage statistics
     */
    async updateApiStats(type) {
        try {
            const statsKey = 'sportradar:api_stats';
            const stats = await this.getApiStats() || {};
            
            if (type === 'request') {
                stats.requestCount = (stats.requestCount || 0) + 1;
                stats.lastRequest = new Date().toISOString();
            } else if (type === 'error') {
                stats.errorCount = (stats.errorCount || 0) + 1;
            } else if (type === 'cache_hit') {
                stats.cacheHits = (stats.cacheHits || 0) + 1;
            } else if (type === 'cache_miss') {
                stats.cacheMisses = (stats.cacheMisses || 0) + 1;
            }

            await memoryCache.setex(statsKey, 86400, JSON.stringify(stats)); // 24 hour TTL
        } catch (error) {
            logger.warn('Failed to update API stats:', error.message);
        }
    }
}

module.exports = new SportRadarService();