const axios = require('axios');
const logger = require('../utils/logger');

/**
 * ESPN API Service for NFL Schedule and Scores
 * Free, reliable, and comprehensive NFL data source
 */
class EspnApiService {
    constructor() {
        this.baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
        
        // ESPN team code mapping to your database codes
        this.teamMapping = {
            'ARI': 'ARI', 'ATL': 'ATL', 'BAL': 'BAL', 'BUF': 'BUF',
            'CAR': 'CAR', 'CHI': 'CHI', 'CIN': 'CIN', 'CLE': 'CLE',
            'DAL': 'DAL', 'DEN': 'DEN', 'DET': 'DET', 'GB': 'GB',
            'HOU': 'HOU', 'IND': 'IND', 'JAX': 'JAX', 'JAC': 'JAX',
            'KC': 'KC', 'LAC': 'LAC', 'LAR': 'LAR', 'LV': 'LV',
            'MIA': 'MIA', 'MIN': 'MIN', 'NE': 'NE', 'NO': 'NO',
            'NYG': 'NYG', 'NYJ': 'NYJ', 'PHI': 'PHI', 'PIT': 'PIT',
            'SEA': 'SEA', 'SF': 'SF', 'TB': 'TB', 'TEN': 'TEN', 'WAS': 'WAS'
        };
    }

    /**
     * Get cached data or fetch from API
     */
    async getCachedData(key, fetchFunction) {
        const cachedData = this.cache.get(key);
        if (cachedData && Date.now() - cachedData.timestamp < this.cacheTimeout) {
            logger.info(`📋 ESPN Cache hit for ${key}`);
            return cachedData.data;
        }

        const data = await fetchFunction();
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        return data;
    }

    /**
     * Get current season schedule from ESPN
     */
    async getCurrentSeasonSchedule(season = 2025) {
        const cacheKey = `espn_schedule_${season}`;
        
        return await this.getCachedData(cacheKey, async () => {
            logger.info(`🌐 ESPN API Request: Getting ${season} season schedule...`);
            
            const allGames = [];
            
            // ESPN organizes by week, get all 18 weeks
            for (let week = 1; week <= 18; week++) {
                try {
                    const response = await axios.get(`${this.baseUrl}/scoreboard`, {
                        params: {
                            seasontype: 2, // Regular season
                            week: week,
                            year: season
                        },
                        timeout: 10000
                    });

                    if (response.data?.events) {
                        const weekGames = this.transformESPNGames(response.data.events, week, season);
                        allGames.push(...weekGames);
                        logger.info(`✅ ESPN Week ${week}: ${weekGames.length} games`);
                    }
                } catch (error) {
                    logger.warn(`Failed to get ESPN week ${week}:`, error.message);
                }

                // Rate limiting - be nice to ESPN
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            logger.info(`✅ ESPN Total: ${allGames.length} games for ${season} season`);
            return allGames;
        });
    }

    /**
     * Get current week games from ESPN
     */
    async getCurrentWeekGames() {
        const currentWeek = this.getCurrentWeekNumber();
        const cacheKey = `espn_current_week_${currentWeek}`;
        
        return await this.getCachedData(cacheKey, async () => {
            logger.info(`🌐 ESPN API Request: Getting current week ${currentWeek}...`);
            
            const response = await axios.get(`${this.baseUrl}/scoreboard`, {
                timeout: 10000
            });

            if (!response.data?.events) {
                throw new Error('No games data from ESPN');
            }

            const games = this.transformESPNGames(response.data.events, currentWeek, 2025);
            logger.info(`✅ ESPN Current Week: ${games.length} games`);
            return games;
        });
    }

    /**
     * Get live scores from ESPN
     */
    async getLiveScores() {
        const cacheKey = 'espn_live_scores';
        
        return await this.getCachedData(cacheKey, async () => {
            logger.info('🌐 ESPN API Request: Getting live scores...');
            
            const response = await axios.get(`${this.baseUrl}/scoreboard`, {
                timeout: 10000
            });

            if (!response.data?.events) {
                return [];
            }

            // Filter for in-progress or recently completed games
            const liveGames = response.data.events.filter(event => {
                const status = event.status?.type?.name;
                return status === 'STATUS_IN_PROGRESS' || 
                       status === 'STATUS_FINAL' || 
                       status === 'STATUS_END_PERIOD';
            });

            const scores = liveGames.map(event => this.transformESPNScore(event));
            logger.info(`✅ ESPN Live Scores: ${scores.length} games`);
            return scores;
        });
    }

    /**
     * Transform ESPN game data to our format
     */
    transformESPNGames(events, week, season) {
        return events.map(event => {
            const homeTeam = event.competitions[0].competitors.find(c => c.homeAway === 'home');
            const awayTeam = event.competitions[0].competitors.find(c => c.homeAway === 'away');
            
            return {
                id: event.id,
                espn_id: event.id,
                week: week,
                season: season,
                commence_time: event.date,
                home_team: this.teamMapping[homeTeam?.team?.abbreviation] || homeTeam?.team?.abbreviation,
                away_team: this.teamMapping[awayTeam?.team?.abbreviation] || awayTeam?.team?.abbreviation,
                completed: event.status?.type?.name === 'STATUS_FINAL',
                home_score: parseInt(homeTeam?.score) || 0,
                away_score: parseInt(awayTeam?.score) || 0,
                status: this.mapESPNStatus(event.status?.type?.name),
                venue: {
                    name: event.competitions[0]?.venue?.fullName,
                    city: event.competitions[0]?.venue?.address?.city,
                    state: event.competitions[0]?.venue?.address?.state
                }
            };
        });
    }

    /**
     * Transform ESPN score data for live updates
     */
    transformESPNScore(event) {
        const homeTeam = event.competitions[0].competitors.find(c => c.homeAway === 'home');
        const awayTeam = event.competitions[0].competitors.find(c => c.homeAway === 'away');
        
        return {
            id: event.id,
            home_team: this.teamMapping[homeTeam?.team?.abbreviation] || homeTeam?.team?.abbreviation,
            away_team: this.teamMapping[awayTeam?.team?.abbreviation] || awayTeam?.team?.abbreviation,
            completed: event.status?.type?.name === 'STATUS_FINAL',
            scores: [
                {
                    name: this.teamMapping[homeTeam?.team?.abbreviation] || homeTeam?.team?.abbreviation,
                    score: parseInt(homeTeam?.score) || 0
                },
                {
                    name: this.teamMapping[awayTeam?.team?.abbreviation] || awayTeam?.team?.abbreviation,
                    score: parseInt(awayTeam?.score) || 0
                }
            ],
            status: this.mapESPNStatus(event.status?.type?.name),
            clock: event.status?.displayClock,
            period: event.status?.period
        };
    }

    /**
     * Map ESPN status to our status format
     */
    mapESPNStatus(espnStatus) {
        const statusMap = {
            'STATUS_SCHEDULED': 'scheduled',
            'STATUS_IN_PROGRESS': 'in_progress',
            'STATUS_FINAL': 'closed',
            'STATUS_END_PERIOD': 'in_progress',
            'STATUS_HALFTIME': 'in_progress',
            'STATUS_DELAYED': 'delayed',
            'STATUS_POSTPONED': 'postponed'
        };
        return statusMap[espnStatus] || 'scheduled';
    }

    /**
     * Get current NFL week number
     */
    getCurrentWeekNumber() {
        const now = new Date();
        const seasonStart = new Date('2025-09-05'); // 2025 NFL season start
        
        if (now < seasonStart) {
            return 1; // Pre-season, default to week 1
        }
        
        const weeksSinceStart = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
        return Math.min(Math.max(weeksSinceStart, 1), 18); // Clamp between 1 and 18
    }

    /**
     * Health check for ESPN API
     */
    async healthCheck() {
        const startTime = Date.now();
        
        try {
            const response = await axios.get(`${this.baseUrl}/teams`, {
                timeout: 5000
            });
            
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200 && response.data?.sports) {
                return {
                    success: true,
                    message: `ESPN API healthy - ${response.data.sports[0].leagues[0].teams.length} teams available`,
                    responseTime: `${responseTime}ms`,
                    endpoint: 'ESPN NFL API'
                };
            } else {
                throw new Error('Invalid ESPN API response structure');
            }
        } catch (error) {
            return {
                success: false,
                message: `ESPN API error: ${error.message}`,
                responseTime: `${Date.now() - startTime}ms`,
                endpoint: 'ESPN NFL API'
            };
        }
    }

    /**
     * Get specific game details by ESPN ID
     */
    async getGameDetails(espnGameId) {
        try {
            logger.info(`🌐 ESPN API Request: Getting game details for ${espnGameId}...`);
            
            const response = await axios.get(`${this.baseUrl}/summary`, {
                params: { event: espnGameId },
                timeout: 10000
            });

            if (!response.data?.header?.competitions?.[0]) {
                throw new Error('Game not found');
            }

            return this.transformESPNGames([response.data.header], null, null)[0];
        } catch (error) {
            logger.error(`Failed to get ESPN game details for ${espnGameId}:`, error.message);
            throw error;
        }
    }

    /**
     * Clear cache (for testing or manual refresh)
     */
    clearCache() {
        this.cache.clear();
        logger.info('ESPN API cache cleared');
    }
}

module.exports = EspnApiService;