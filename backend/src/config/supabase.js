const { Pool } = require('pg');
const config = require('./config');
const logger = require('../utils/logger');

class PostgreSQLDatabase {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      console.log('🔌 Initializing PostgreSQL database connection...');
      logger.info('Initializing PostgreSQL database connection...');
      
      if (!config.database.connectionString) {
        throw new Error('Database connection string is not configured');
      }

      // Use connection pooling mode for better compatibility with cloud providers
      let connectionString = config.database.connectionString;
      
      // Convert direct connection (port 5432) to pooling mode (port 6543) for Supabase
      if (connectionString.includes(':5432/')) {
        connectionString = connectionString.replace(':5432/', ':6543/');
        console.log('🔄 Using Supabase connection pooling mode (port 6543)');
        logger.info('Using Supabase connection pooling mode for better cloud compatibility');
      }

      console.log('🌐 Connection string pattern:', connectionString.replace(/:[^:@]*@/, ':****@'));

      // Create PostgreSQL connection pool with robust settings for Supabase
      this.pool = new Pool({
        connectionString: connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: config.database.pool.max || 5, // Reduced for free tier
        min: config.database.pool.min || 0,
        idleTimeoutMillis: config.database.pool.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: 30000, // 30 seconds timeout
        acquireTimeoutMillis: 60000, // 60 seconds to acquire connection
        statement_timeout: 30000, // 30 seconds statement timeout
        query_timeout: 30000, // 30 seconds query timeout
      });

      // Handle pool events
      this.pool.on('connect', () => {
        logger.info('PostgreSQL client connected');
        this.isConnected = true;
      });

      this.pool.on('error', (err) => {
        logger.error('PostgreSQL pool error:', err);
        this.isConnected = false;
      });

      // Test the connection
      await this.testConnection();
      
      this.isConnected = true;
      logger.info('PostgreSQL database connection established successfully');
      
    } catch (error) {
      logger.error('Failed to initialize PostgreSQL database connection:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT 1 as test');
      client.release();
      
      if (result.rows[0].test === 1) {
        logger.info('PostgreSQL database connection test passed');
        return true;
      } else {
        throw new Error('PostgreSQL database connection test failed');
      }
    } catch (error) {
      logger.error('PostgreSQL database connection test failed:', error);
      throw error;
    }
  }

  async query(queryText, params = []) {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    try {
      // Convert named parameters to positional parameters for PostgreSQL
      let pgQuery = queryText;
      let pgParams = [];
      
      if (typeof params === 'object' && !Array.isArray(params)) {
        let paramIndex = 1;
        const paramMap = {};
        
        // Replace @paramName with $1, $2, etc.
        pgQuery = queryText.replace(/@(\w+)/g, (match, paramName) => {
          if (!paramMap[paramName]) {
            paramMap[paramName] = paramIndex++;
            pgParams.push(params[paramName]);
          }
          return `$${paramMap[paramName]}`;
        });
      } else {
        pgParams = params;
      }
      
      const result = await this.pool.query(pgQuery, pgParams);
      
      // Return normalized result that matches SQL Server format
      return {
        rows: result.rows,
        rowCount: result.rowCount
      };
    } catch (error) {
      logger.error('PostgreSQL database query error:', { query: queryText, params, error: error.message });
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create a transaction context with normalized query method
      const transactionContext = {
        query: async (queryText, params = []) => {
          // Convert named parameters to positional parameters for PostgreSQL
          let pgQuery = queryText;
          let pgParams = [];
          
          if (typeof params === 'object' && !Array.isArray(params)) {
            let paramIndex = 1;
            const paramMap = {};
            
            // Replace @paramName with $1, $2, etc.
            pgQuery = queryText.replace(/@(\w+)/g, (match, paramName) => {
              if (!paramMap[paramName]) {
                paramMap[paramName] = paramIndex++;
                pgParams.push(params[paramName]);
              }
              return `$${paramMap[paramName]}`;
            });
          } else {
            pgParams = params;
          }
          
          const result = await client.query(pgQuery, pgParams);
          return {
            rows: result.rows,
            rowCount: result.rowCount
          };
        }
      };
      
      const result = await callback(transactionContext);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      logger.error('PostgreSQL database transaction error:', error);
      
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        logger.error('PostgreSQL database transaction rollback error:', rollbackError);
      }
      
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
      logger.error('PostgreSQL database health check failed:', error);
      return false;
    }
  }

  getPool() {
    if (!this.pool) {
      throw new Error('Database not connected. Call initialize() first.');
    }
    return this.pool;
  }

  async close() {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        this.isConnected = false;
        logger.info('PostgreSQL database connection closed');
      }
    } catch (error) {
      logger.error('Error closing PostgreSQL database connection:', error);
      throw error;
    }
  }

  // Helper methods for common queries (PostgreSQL versions)
  async findById(tableName, id, idColumn = 'id') {
    const query = `SELECT * FROM ${tableName} WHERE ${idColumn} = @id`;
    const result = await this.query(query, { id });
    return result.rows[0] || null;
  }

  async findAll(tableName, whereClause = '', params = {}) {
    const query = `SELECT * FROM ${tableName} ${whereClause ? 'WHERE ' + whereClause : ''}`;
    const result = await this.query(query, params);
    return result.rows;
  }

  async insert(tableName, data) {
    const columns = Object.keys(data);
    const values = columns.map(col => `@${col}`);
    
    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')}) 
      VALUES (${values.join(', ')})
      RETURNING *
    `;
    
    const result = await this.query(query, data);
    return result.rows[0];
  }

  async update(tableName, id, data, idColumn = 'id') {
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = @${col}`).join(', ');
    
    const query = `
      UPDATE ${tableName} 
      SET ${setClause}
      WHERE ${idColumn} = @id
      RETURNING *
    `;
    
    const params = { ...data, id };
    const result = await this.query(query, params);
    return result.rows[0];
  }

  async delete(tableName, id, idColumn = 'id') {
    const query = `DELETE FROM ${tableName} WHERE ${idColumn} = @id`;
    const result = await this.query(query, { id });
    return result.rowCount > 0;
  }

  // Pagination helper (PostgreSQL version)
  async paginate(tableName, options = {}) {
    const {
      page = 1,
      limit = 10,
      orderBy = 'created_at',
      orderDirection = 'DESC',
      whereClause = '',
      params = {}
    } = options;
    
    const offset = (page - 1) * limit;
    
    const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause ? 'WHERE ' + whereClause : ''}`;
    const dataQuery = `
      SELECT * FROM ${tableName} 
      ${whereClause ? 'WHERE ' + whereClause : ''}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT @limit OFFSET @offset
    `;
    
    const [countResult, dataResult] = await Promise.all([
      this.query(countQuery, params),
      this.query(dataQuery, { ...params, offset, limit })
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}

module.exports = PostgreSQLDatabase;