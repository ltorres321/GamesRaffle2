const { Database } = require('arangojs');
const logger = require('../utils/logger');

class ArangoDbService {
    constructor() {
        this.db = null;
        this.connected = false;
        this.connectionString = process.env.ARANGO_URL || 'http://20.51.130.15:8529';
        this.databaseName = process.env.ARANGO_DATABASE || 'sports_analytics';
        this.username = process.env.ARANGO_USERNAME || 'ltorres';
        this.password = process.env.ARANGO_PASSWORD || 'Leonl213';
    }

    async connect() {
        try {
            this.db = new Database({
                url: this.connectionString,
                databaseName: this.databaseName,
                auth: {
                    username: this.username,
                    password: this.password
                }
            });

            // Test connection
            await this.db.version();
            this.connected = true;
            logger.info(`Successfully connected to ArangoDB at ${this.connectionString}/${this.databaseName}`);
            return true;
        } catch (error) {
            logger.error('Failed to connect to ArangoDB:', error.message);
            this.connected = false;
            return false;
        }
    }

    async disconnect() {
        if (this.db) {
            try {
                await this.db.close();
                this.connected = false;
                logger.info('Disconnected from ArangoDB');
            } catch (error) {
                logger.error('Error disconnecting from ArangoDB:', error.message);
            }
        }
    }

    async getNFL2024Games() {
        if (!this.connected) {
            await this.connect();
        }

        if (!this.connected) {
            throw new Error('Not connected to ArangoDB');
        }

        try {
            const collection = this.db.collection('pff_games');
            
            // Query for NFL 2024 games - adjust based on actual schema
            const cursor = await this.db.query(`
                FOR game IN pff_games
                FILTER game.season == 2024 
                AND game.league == "NFL"
                AND game.season_type == "REG"
                SORT game.week ASC, game.game_date ASC
                RETURN {
                    week: game.week,
                    date: game.game_date,
                    home: game.home_team,
                    away: game.away_team,
                    homeScore: game.home_score,
                    awayScore: game.away_score,
                    gameId: game._key,
                    finished: game.finished || false
                }
            `);

            const games = await cursor.all();
            logger.info(`Retrieved ${games.length} NFL 2024 games from ArangoDB`);
            return games;
        } catch (error) {
            logger.error('Error fetching NFL 2024 games from ArangoDB:', error.message);
            throw error;
        }
    }

    async getNFL2024GamesByWeek(week) {
        if (!this.connected) {
            await this.connect();
        }

        if (!this.connected) {
            throw new Error('Not connected to ArangoDB');
        }

        try {
            const collection = this.db.collection('pff_games');
            
            const cursor = await this.db.query(`
                FOR game IN pff_games
                FILTER game.season == 2024 
                AND game.league == "NFL"
                AND game.season_type == "REG"
                AND game.week == @week
                SORT game.game_date ASC
                RETURN {
                    week: game.week,
                    date: game.game_date,
                    home: game.home_team,
                    away: game.away_team,
                    homeScore: game.home_score,
                    awayScore: game.away_score,
                    gameId: game._key,
                    finished: game.finished || false
                }
            `, { week: parseInt(week) });

            const games = await cursor.all();
            logger.info(`Retrieved ${games.length} NFL 2024 week ${week} games from ArangoDB`);
            return games;
        } catch (error) {
            logger.error(`Error fetching NFL 2024 week ${week} games from ArangoDB:`, error.message);
            throw error;
        }
    }

    async testConnection() {
        try {
            if (!this.connected) {
                await this.connect();
            }
            
            if (!this.connected) {
                return { success: false, message: 'Failed to connect to ArangoDB' };
            }

            // Test query to get database info
            const version = await this.db.version();
            const collections = await this.db.listCollections();
            
            const hasPffGames = collections.some(col => col.name === 'pff_games');
            
            return {
                success: true,
                version: version.version,
                server: version.server,
                database: this.databaseName,
                collections: collections.length,
                hasPffGames,
                connectionUrl: this.connectionString
            };
        } catch (error) {
            logger.error('ArangoDB connection test failed:', error.message);
            return {
                success: false,
                message: error.message,
                connectionUrl: this.connectionString
            };
        }
    }

    // Utility method to explore pff_games schema
    async explorePffGamesSchema() {
        if (!this.connected) {
            await this.connect();
        }

        if (!this.connected) {
            throw new Error('Not connected to ArangoDB');
        }

        try {
            const cursor = await this.db.query(`
                FOR game IN pff_games
                LIMIT 5
                RETURN game
            `);

            const sampleGames = await cursor.all();
            logger.info('Sample pff_games documents:', JSON.stringify(sampleGames, null, 2));
            return sampleGames;
        } catch (error) {
            logger.error('Error exploring pff_games schema:', error.message);
            throw error;
        }
    }

    isConnected() {
        return this.connected;
    }
}

module.exports = new ArangoDbService();