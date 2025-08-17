const config = require('./config');
const logger = require('../utils/logger');

// Auto-detect database type and load appropriate module
function createDatabase() {
  const connectionString = config.database.connectionString;
  
  if (!connectionString) {
    throw new Error('Database connection string is not configured');
  }
  
  // Check if it's PostgreSQL or SQL Server
  if (connectionString.includes('postgresql://') || connectionString.includes('postgres://')) {
    logger.info('Using PostgreSQL database (Supabase)');
    const PostgreSQLDatabase = require('./supabase');
    return new PostgreSQLDatabase();
  } else {
    logger.info('Using SQL Server database (Azure)');
    const SqlServerDatabase = require('./sqlserver');
    return new SqlServerDatabase();
  }
}

// Create and export singleton instance
const database = createDatabase();
module.exports = database;