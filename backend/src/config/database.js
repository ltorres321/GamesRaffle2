const sql = require('mssql');
const config = require('./config');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.pool = null;
    this.config = {
      connectionString: config.database.connectionString,
      pool: config.database.pool,
      options: config.database.options
    };
  }

  async initialize() {
    try {
      logger.info('Initializing database connection...');
      
      if (!this.config.connectionString) {
        throw new Error('Database connection string is not configured');
      }

      // Create connection pool
      this.pool = new sql.ConnectionPool(this.config.connectionString);
      
      // Handle pool errors
      this.pool.on('error', (error) => {
        logger.error('Database pool error:', error);
      });

      // Connect to database
      await this.pool.connect();
      
      logger.info('Database connection established successfully');
      
      // Test the connection
      await this.testConnection();
      
    } catch (error) {
      logger.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const request = this.pool.request();
      const result = await request.query('SELECT 1 as test');
      
      if (result.recordset[0].test === 1) {
        logger.info('Database connection test passed');
        return true;
      } else {
        throw new Error('Database connection test failed');
      }
    } catch (error) {
      logger.error('Database connection test failed:', error);
      throw error;
    }
  }

  async isHealthy() {
    try {
      if (!this.pool || !this.pool.connected) {
        return false;
      }
      
      await this.testConnection();
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  getPool() {
    if (!this.pool || !this.pool.connected) {
      throw new Error('Database not connected. Call initialize() first.');
    }
    return this.pool;
  }

  async query(queryText, params = {}) {
    try {
      const request = this.pool.request();
      
      // Add parameters to request
      Object.keys(params).forEach(key => {
        const value = params[key];
        const sqlType = this.getSqlType(value);
        request.input(key, sqlType, value);
      });
      
      const result = await request.query(queryText);
      return result;
    } catch (error) {
      logger.error('Database query error:', { query: queryText, params, error: error.message });
      throw error;
    }
  }

  async execute(procedureName, params = {}) {
    try {
      const request = this.pool.request();
      
      // Add parameters to request
      Object.keys(params).forEach(key => {
        const value = params[key];
        const sqlType = this.getSqlType(value);
        request.input(key, sqlType, value);
      });
      
      const result = await request.execute(procedureName);
      return result;
    } catch (error) {
      logger.error('Database procedure execution error:', { procedure: procedureName, params, error: error.message });
      throw error;
    }
  }

  async transaction(callback) {
    const transaction = new sql.Transaction(this.pool);
    
    try {
      await transaction.begin();
      
      const result = await callback(transaction);
      
      await transaction.commit();
      return result;
    } catch (error) {
      logger.error('Database transaction error:', error);
      
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        logger.error('Database transaction rollback error:', rollbackError);
      }
      
      throw error;
    }
  }

  getSqlType(value) {
    if (value === null || value === undefined) {
      return sql.NVarChar;
    }
    
    switch (typeof value) {
      case 'string':
        return value.length > 4000 ? sql.NText : sql.NVarChar;
      case 'number':
        return Number.isInteger(value) ? sql.Int : sql.Decimal(18, 2);
      case 'boolean':
        return sql.Bit;
      case 'object':
        if (value instanceof Date) {
          return sql.DateTime2;
        }
        if (Buffer.isBuffer(value)) {
          return sql.VarBinary;
        }
        return sql.NVarChar; // JSON will be stringified
      default:
        return sql.NVarChar;
    }
  }

  async close() {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
        logger.info('Database connection closed');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  // Helper methods for common queries
  async findById(tableName, id, idColumn = 'Id') {
    const query = `SELECT * FROM ${tableName} WHERE ${idColumn} = @id`;
    const result = await this.query(query, { id });
    return result.recordset[0] || null;
  }

  async findAll(tableName, whereClause = '', params = {}) {
    const query = `SELECT * FROM ${tableName} ${whereClause ? 'WHERE ' + whereClause : ''}`;
    const result = await this.query(query, params);
    return result.recordset;
  }

  async insert(tableName, data) {
    const columns = Object.keys(data);
    const values = columns.map(col => `@${col}`);
    
    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')}) 
      OUTPUT INSERTED.*
      VALUES (${values.join(', ')})
    `;
    
    const result = await this.query(query, data);
    return result.recordset[0];
  }

  async update(tableName, id, data, idColumn = 'Id') {
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = @${col}`).join(', ');
    
    const query = `
      UPDATE ${tableName} 
      SET ${setClause}
      OUTPUT INSERTED.*
      WHERE ${idColumn} = @id
    `;
    
    const params = { ...data, id };
    const result = await this.query(query, params);
    return result.recordset[0];
  }

  async delete(tableName, id, idColumn = 'Id') {
    const query = `DELETE FROM ${tableName} WHERE ${idColumn} = @id`;
    const result = await this.query(query, { id });
    return result.rowsAffected[0] > 0;
  }

  // Pagination helper
  async paginate(tableName, options = {}) {
    const {
      page = 1,
      limit = 10,
      orderBy = 'CreatedAt',
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
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    const [countResult, dataResult] = await Promise.all([
      this.query(countQuery, params),
      this.query(dataQuery, { ...params, offset, limit })
    ]);
    
    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: dataResult.recordset,
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

// Create singleton instance
const database = new Database();

module.exports = database;