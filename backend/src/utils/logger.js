const winston = require('winston');
const config = require('../config/config');

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(logColors);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    const argsStr = Object.keys(args).length ? JSON.stringify(args, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${argsStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [
  // Console transport
  new winston.transports.Console({
    level: config.logging.level,
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true
  })
];

// Add file transport if enabled
if (config.logging.file.enabled) {
  transports.push(
    new winston.transports.File({
      filename: config.logging.file.filename,
      level: config.logging.level,
      format: fileFormat,
      maxsize: config.logging.file.maxsize,
      maxFiles: config.logging.file.maxFiles,
      handleExceptions: true,
      handleRejections: true
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  levels: logLevels,
  transports,
  exitOnError: false
});

// Add Application Insights if enabled
if (config.logging.applicationInsights.enabled) {
  const appInsights = require('applicationinsights');
  
  appInsights.setup(config.logging.applicationInsights.instrumentationKey)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(false)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .start();

  // Custom transport for Application Insights
  class ApplicationInsightsTransport extends winston.Transport {
    constructor(options = {}) {
      super(options);
      this.name = 'applicationInsights';
      this.client = appInsights.defaultClient;
    }

    log(info, callback) {
      const { level, message, ...meta } = info;
      
      try {
        switch (level) {
          case 'error':
            if (meta.error instanceof Error) {
              this.client.trackException({ exception: meta.error, properties: meta });
            } else {
              this.client.trackTrace({ message, severity: 3, properties: meta });
            }
            break;
          case 'warn':
            this.client.trackTrace({ message, severity: 2, properties: meta });
            break;
          case 'info':
            this.client.trackTrace({ message, severity: 1, properties: meta });
            break;
          case 'debug':
            this.client.trackTrace({ message, severity: 0, properties: meta });
            break;
          default:
            this.client.trackTrace({ message, severity: 1, properties: meta });
        }
      } catch (error) {
        // Fallback to avoid logging errors in logger
        console.error('Application Insights logging error:', error);
      }
      
      callback();
    }
  }

  logger.add(new ApplicationInsightsTransport());
}

// Helper methods for structured logging
const createLoggerWithContext = (context) => {
  return {
    error: (message, meta = {}) => logger.error(message, { ...meta, context }),
    warn: (message, meta = {}) => logger.warn(message, { ...meta, context }),
    info: (message, meta = {}) => logger.info(message, { ...meta, context }),
    http: (message, meta = {}) => logger.http(message, { ...meta, context }),
    debug: (message, meta = {}) => logger.debug(message, { ...meta, context })
  };
};

// Request logging helper
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.id
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    const logLevel = statusCode >= 400 ? 'warn' : 'http';
    
    logger[logLevel]('Request completed', {
      method: req.method,
      url: req.url,
      statusCode,
      duration: `${duration}ms`,
      requestId: req.id
    });
  });
  
  next();
};

// Database query logging helper
const logDatabaseQuery = (query, params = {}, duration = 0, error = null) => {
  const logData = {
    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
    paramCount: Object.keys(params).length,
    duration: `${duration}ms`
  };
  
  if (error) {
    logger.error('Database query failed', { ...logData, error: error.message });
  } else {
    logger.debug('Database query executed', logData);
  }
};

// Redis operation logging helper
const logRedisOperation = (operation, key, duration = 0, error = null) => {
  const logData = {
    operation,
    key,
    duration: `${duration}ms`
  };
  
  if (error) {
    logger.error('Redis operation failed', { ...logData, error: error.message });
  } else {
    logger.debug('Redis operation completed', logData);
  }
};

// API error logging helper
const logAPIError = (error, req = null, additionalContext = {}) => {
  const logData = {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    ...additionalContext
  };
  
  if (req) {
    logData.request = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.id,
      userId: req.user?.id
    };
  }
  
  logger.error('API Error', logData);
};

// Business logic logging helper
const logBusinessEvent = (event, data = {}, userId = null) => {
  logger.info('Business event', {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Performance monitoring helper
const logPerformance = (operation, duration, metadata = {}) => {
  const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
  
  logger[level]('Performance metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Security event logging helper
const logSecurityEvent = (event, details = {}, userId = null, ip = null) => {
  logger.warn('Security event', {
    event,
    userId,
    ip,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Audit logging helper
const logAuditEvent = (action, resource, userId, details = {}) => {
  logger.info('Audit event', {
    action,
    resource,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Export logger with helper methods
module.exports = {
  // Core logging methods
  error: (message, meta) => logger.error(message, meta),
  warn: (message, meta) => logger.warn(message, meta),
  info: (message, meta) => logger.info(message, meta),
  http: (message, meta) => logger.http(message, meta),
  debug: (message, meta) => logger.debug(message, meta),
  
  // Helper methods
  createLoggerWithContext,
  logRequest,
  logDatabaseQuery,
  logRedisOperation,
  logAPIError,
  logBusinessEvent,
  logPerformance,
  logSecurityEvent,
  logAuditEvent,
  
  // Convenience methods for common patterns
  child: createLoggerWithContext,
  
  // Method to update log level at runtime
  setLevel: (level) => {
    logger.transports.forEach(transport => {
      transport.level = level;
    });
  },
  
  // Method to get current configuration
  getConfig: () => ({
    level: config.logging.level,
    transports: logger.transports.length,
    fileEnabled: config.logging.file.enabled,
    appInsightsEnabled: config.logging.applicationInsights.enabled
  })
};