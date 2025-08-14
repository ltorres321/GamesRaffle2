const { Pool } = require('pg');
const config = require('./config');
const logger = require('../utils/logger');

class SupabaseDatabase {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      logger.info('Initializing PostgreSQL connection to Supabase...');
      
      if (!config.database.connectionString) {
        throw new Error('Database connection string is not configured');
      }

      // Create PostgreSQL connection pool
      this.pool = new Pool({
        connectionString: config.database.connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: config.database.pool.max || 10,
        min: config.database.pool.min || 0,
        idleTimeoutMillis: config.database.pool.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: config.database.pool.acquireTimeoutMillis || 60000,
      });

      // Handle pool events
      this.pool.on('connect', () => {
        logger.info('New PostgreSQL client connected');
      });

      this.pool.on('error', (err) => {
        logger.error('PostgreSQL pool error:', err);
        this.isConnected = false;
      });

      // Test the connection
      await this.testConnection();
      
      this.isConnected = true;
      logger.info('PostgreSQL connection established successfully');
      
    } catch (error) {
      logger.error('Failed to initialize PostgreSQL connection:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      logger.info('PostgreSQL connection test successful:', result.rows[0]);
      return true;
    } catch (error) {
      logger.error('PostgreSQL connection test failed:', error);
      throw error;
    }
  }

  async query(text, params = []) {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const client = await this.pool.connect();
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Database query error:', { text, params, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  async isHealthy() {
    try {
      if (!this.pool || !this.isConnected) {
        return false;
      }
      
      const result = await this.query('SELECT 1 as health_check');
      return result.rows.length > 0 && result.rows[0].health_check === 1;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  async close() {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        this.isConnected = false;
        logger.info('PostgreSQL connection pool closed');
      }
    } catch (error) {
      logger.error('Error closing PostgreSQL connection:', error);
      throw error;
    }
  }

  // Helper method to handle transactions
  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Create singleton instance
const supabaseDb = new SupabaseDatabase();

module.exports = supabaseDb;