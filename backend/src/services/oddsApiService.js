const axios = require('axios');

class OddsApiService {
    constructor() {
        this.baseURL = 'https://api.the-odds-api.com/v4';
        this.apiKey = process.env.ODDS_API_KEY || '07b8c3848b0d7f73e088fbcba091140d';
        this.sport = 'americanfootball_nfl';
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
        
        // Request configuration
        this.config = {
            timeout: 10000,
            headers: {
                'User-Agent': 'GamesRaffle2-Backend/1.0'
            }
        };
        
        console.log('🏈 OddsApiService initialized');
        console.log(`   API Key: ${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
    }

    /**
     * Generic API request with retry logic and caching
     */
    async makeRequest(endpoint, cacheKey = null, cacheDuration = this.cacheTimeout) {
        try {
            // Check cache first
            if (cacheKey && this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < cacheDuration) {
                    console.log(`📋 Cache hit for ${cacheKey}`);
                    return cached.data;
                }
            }

            const url = `${this.baseURL}${endpoint}`;
            console.log(`🌐 Odds API Request: ${endpoint}`);
            
            const response = await axios.get(url, this.config);
            
            // Log rate limit info
            const remaining = response.headers['x-requests-remaining'];
            if (remaining) {
                console.log(`📊 API Requests Remaining: ${remaining}`);
            }
            
            // Cache the response
            if (cacheKey) {
                this.cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });
            }
            
            return response.data;
            
        } catch (error) {
            console.error(`❌ Odds API Error for ${endpoint}:`, error.response?.status, error.response?.statusText);
            if (error.response?.data) {
                console.error(`   Details: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    /**
     * Get current season NFL schedule and odds
     */
    async getCurrentSeasonSchedule() {
        try {
            const endpoint = `/sports/${this.sport}/odds?regions=us&markets=h2h&dateFormat=iso&apiKey=${this.apiKey}`;
            const cacheKey = 'current_season_schedule';
            
            const data = await this.makeRequest(endpoint, cacheKey);
            
            if (!data || !Array.isArray(data)) {
                console.warn('⚠️ No schedule data received from Odds API');
                return [];
            }
            
            console.log(`✅ Retrieved ${data.length} games from Odds API`);
            
            // Transform to our internal format
            return data.map(game => this.transformGameData(game));
            
        } catch (error) {
            console.error('❌ Failed to get current season schedule from Odds API:', error.message);
            return [];
        }
    }

    /**
     * Get live scores and completed games
     */
    async getLiveScores(daysFrom = 3) {
        try {
            const endpoint = `/sports/${this.sport}/scores?daysFrom=${daysFrom}&apiKey=${this.apiKey}`;
            const cacheKey = `live_scores_${daysFrom}`;
            
            // Use shorter cache for live scores (5 minutes)
            const data = await this.makeRequest(endpoint, cacheKey, 5 * 60 * 1000);
            
            if (!data || !Array.isArray(data)) {
                console.warn('⚠️ No scores data received from Odds API');
                return [];
            }
            
            console.log(`✅ Retrieved ${data.length} game scores from Odds API`);
            
            // Transform and filter for completed games
            return data
                .map(game => this.transformGameData(game))
                .filter(game => game.completed || game.scores);
                
        } catch (error) {
            console.error('❌ Failed to get live scores from Odds API:', error.message);
            return [];
        }
    }

    /**
     * Get current week games
     */
    async getCurrentWeekGames() {
        try {
            const allGames = await this.getCurrentSeasonSchedule();
            
            if (!allGames.length) {
                return [];
            }
            
            // Find current week based on game dates
            const now = new Date();
            const currentWeekGames = allGames.filter(game => {
                const gameDate = new Date(game.commence_time);
                const daysDiff = Math.abs((gameDate - now) / (1000 * 60 * 60 * 24));
                return daysDiff <= 7; // Games within a week
            });
            
            console.log(`✅ Found ${currentWeekGames.length} games for current week`);
            return currentWeekGames;
            
        } catch (error) {
            console.error('❌ Failed to get current week games from Odds API:', error.message);
            return [];
        }
    }

    /**
     * Transform Odds API game data to our internal format
     */
    transformGameData(oddsGame) {
        try {
            // Extract game basic info
            const gameData = {
                id: oddsGame.id,
                external_id: oddsGame.id,
                odds_api_id: oddsGame.id,
                sport_key: oddsGame.sport_key,
                sport_title: oddsGame.sport_title || 'NFL',
                commence_time: oddsGame.commence_time,
                home_team: this.normalizeTeamName(oddsGame.home_team),
                away_team: this.normalizeTeamName(oddsGame.away_team),
                completed: oddsGame.completed || false,
                last_update: oddsGame.last_update || new Date().toISOString(),
                
                // Additional fields for NFL Survivor compatibility
                week: this.extractWeekFromDate(oddsGame.commence_time),
                season: this.extractSeasonFromDate(oddsGame.commence_time),
                game_type: 'REG', // Regular season default
                status: oddsGame.completed ? 'FINAL' : 'SCHEDULED',
                
                // Score information if available
                home_score: null,
                away_score: null,
                winner: null
            };
            
            // Extract scores if available
            if (oddsGame.scores && Array.isArray(oddsGame.scores)) {
                oddsGame.scores.forEach(score => {
                    if (score.name === gameData.home_team) {
                        gameData.home_score = score.score;
                    } else if (score.name === gameData.away_team) {
                        gameData.away_score = score.score;
                    }
                });
                
                // Determine winner
                if (gameData.home_score !== null && gameData.away_score !== null) {
                    if (gameData.home_score > gameData.away_score) {
                        gameData.winner = gameData.home_team;
                    } else if (gameData.away_score > gameData.home_score) {
                        gameData.winner = gameData.away_team;
                    }
                }
            }
            
            return gameData;
            
        } catch (error) {
            console.error('❌ Error transforming Odds API game data:', error);
            return null;
        }
    }

    /**
     * Normalize team names to match our database format
     */
    normalizeTeamName(teamName) {
        if (!teamName) return teamName;
        
        // Team name mapping for consistency
        const teamMappings = {
            'Los Angeles Rams': 'LAR',
            'Los Angeles Chargers': 'LAC',
            'Las Vegas Raiders': 'LV',
            'New York Giants': 'NYG',
            'New York Jets': 'NYJ',
            'New England Patriots': 'NE',
            'Green Bay Packers': 'GB',
            'Tampa Bay Buccaneers': 'TB',
            'Kansas City Chiefs': 'KC',
            'San Francisco 49ers': 'SF',
            'Arizona Cardinals': 'ARI',
            'Atlanta Falcons': 'ATL',
            'Baltimore Ravens': 'BAL',
            'Buffalo Bills': 'BUF',
            'Carolina Panthers': 'CAR',
            'Chicago Bears': 'CHI',
            'Cincinnati Bengals': 'CIN',
            'Cleveland Browns': 'CLE',
            'Dallas Cowboys': 'DAL',
            'Denver Broncos': 'DEN',
            'Detroit Lions': 'DET',
            'Houston Texans': 'HOU',
            'Indianapolis Colts': 'IND',
            'Jacksonville Jaguars': 'JAX',
            'Miami Dolphins': 'MIA',
            'Minnesota Vikings': 'MIN',
            'New Orleans Saints': 'NO',
            'Philadelphia Eagles': 'PHI',
            'Pittsburgh Steelers': 'PIT',
            'Seattle Seahawks': 'SEA',
            'Tennessee Titans': 'TEN',
            'Washington Commanders': 'WAS'
        };
        
        return teamMappings[teamName] || teamName;
    }

    /**
     * Extract week number from game date
     */
    extractWeekFromDate(commenceTime) {
        try {
            const gameDate = new Date(commenceTime);
            const seasonStart = new Date(gameDate.getFullYear(), 8, 1); // September 1st
            const weeksDiff = Math.floor((gameDate - seasonStart) / (7 * 24 * 60 * 60 * 1000));
            return Math.max(1, Math.min(18, weeksDiff + 1));
        } catch (error) {
            return 1;
        }
    }

    /**
     * Extract season year from game date
     */
    extractSeasonFromDate(commenceTime) {
        try {
            const gameDate = new Date(commenceTime);
            // NFL season spans two calendar years, use the year when season starts
            return gameDate.getMonth() >= 8 ? gameDate.getFullYear() : gameDate.getFullYear() - 1;
        } catch (error) {
            return new Date().getFullYear();
        }
    }

    /**
     * Health check for Odds API connectivity
     */
    async healthCheck() {
        try {
            const endpoint = `/sports?apiKey=${this.apiKey}`;
            const response = await this.makeRequest(endpoint);
            
            const nflSport = response.find(sport => sport.key === this.sport);
            
            return {
                status: 'healthy',
                api_accessible: true,
                nfl_available: !!nflSport,
                sports_count: response.length,
                rate_limit_remaining: 'Check headers in actual requests',
                cache_size: this.cache.size,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                status: 'unhealthy',
                api_accessible: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Odds API cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            oldest_entry: this.cache.size > 0 ? Math.min(...Array.from(this.cache.values()).map(v => v.timestamp)) : null
        };
    }
}

module.exports = OddsApiService;