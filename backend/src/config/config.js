// Load environment variables from multiple files
// Load .env.local first (highest priority), then .env (fallback)
require('dotenv').config({ path: '.env.local', override: true });
require('dotenv').config(); // Fallback to .env for missing variables

const config = {
  app: {
    name: 'Survivor Sports API',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 8000,
    host: process.env.HOST || '0.0.0.0'
  },
  
  database: {
    connectionString: process.env.DATABASE_URL || process.env.SQL_CONNECTION_STRING,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
      createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT) || 30000,
      destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT) || 5000,
      reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL) || 1000,
      createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL) || 200,
    },
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true,
      requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 30000,
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
      parseJSON: true
    }
  },
  
  redis: {
    connectionString: process.env.REDIS_CONNECTION_STRING,
    options: {
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT) || 5000,
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 100,
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
      lazyConnect: true,
      keepAlive: true
    },
    keyPrefixes: {
      session: 'sess:',
      cache: 'cache:',
      lock: 'lock:',
      temp: 'temp:'
    },
    ttl: {
      session: parseInt(process.env.SESSION_TTL) || 30 * 24 * 60 * 60, // 30 days
      cache: parseInt(process.env.CACHE_TTL) || 60 * 60, // 1 hour
      temp: parseInt(process.env.TEMP_TTL) || 10 * 60, // 10 minutes
      espnData: parseInt(process.env.ESPN_CACHE_TTL) || 5 * 60, // 5 minutes
      gameData: parseInt(process.env.GAME_CACHE_TTL) || 60 * 60 // 1 hour
    }
  },
  
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || 'default-jwt-secret-for-development-only-not-secure',
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
      issuer: process.env.JWT_ISSUER || 'survivor-sports-api',
      audience: process.env.JWT_AUDIENCE || 'survivor-sports-app'
    },
    session: {
      secret: process.env.SESSION_SECRET || 'default-session-secret-for-development-only-not-secure',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 30 * 24 * 60 * 60 * 1000 // 30 days
    },
    bcrypt: {
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5 // Login attempts
    }
  },
  
  cors: {
    allowedOrigins: process.env.CORS_ORIGINS ?
      process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) :
      ['http://localhost:3000', 'http://localhost:3001', 'https://localhost:3000', 'https://*.netlify.app']
  },
  
  storage: {
    azure: {
      connectionString: process.env.STORAGE_CONNECTION_STRING,
      containerNames: {
        idVerification: 'id-verification',
        gameLogos: 'game-logos',
        teamLogos: 'team-logos'
      },
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf'
      ]
    }
  },
  
  espn: {
    apiKey: process.env.ESPN_API_KEY,
    baseUrl: process.env.ESPN_BASE_URL || 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
    timeout: parseInt(process.env.ESPN_TIMEOUT) || 10000,
    retryAttempts: parseInt(process.env.ESPN_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.ESPN_RETRY_DELAY) || 1000,
    endpoints: {
      scoreboard: '/scoreboard',
      teams: '/teams',
      schedule: '/schedule',
      standings: '/standings'
    }
  },
  
  games: {
    defaultSettings: {
      maxParticipants: parseInt(process.env.DEFAULT_MAX_PARTICIPANTS) || 100,
      entryFee: parseFloat(process.env.DEFAULT_ENTRY_FEE) || 25.00,
      startWeek: parseInt(process.env.DEFAULT_START_WEEK) || 1,
      endWeek: parseInt(process.env.DEFAULT_END_WEEK) || 18,
      requireTwoPicksFromWeek: parseInt(process.env.DEFAULT_TWO_PICKS_WEEK) || 12,
      currentSeason: parseInt(process.env.CURRENT_NFL_SEASON) || 2024
    },
    pickDeadlines: {
      defaultHour: parseInt(process.env.PICK_DEADLINE_HOUR) || 20, // 8 PM ET
      defaultMinute: parseInt(process.env.PICK_DEADLINE_MINUTE) || 0,
      timezone: process.env.PICK_DEADLINE_TIMEZONE || 'America/New_York'
    }
  },
  
  scheduling: {
    scoreCheckCron: process.env.SCORE_CHECK_CRON || '0 3 * * 2', // Tuesday 3 AM
    scheduleUpdateCron: process.env.SCHEDULE_UPDATE_CRON || '0 2 * * *', // Daily at 2 AM
    gameProcessingCron: process.env.GAME_PROCESSING_CRON || '*/15 * * * *', // Every 15 minutes
    timezone: process.env.CRON_TIMEZONE || 'America/New_York'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      filename: process.env.LOG_FILENAME || 'survivor-api.log',
      maxsize: parseInt(process.env.LOG_MAX_SIZE) || 5242880, // 5MB
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
    },
    applicationInsights: {
      enabled: process.env.NODE_ENV === 'production' && process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
      instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY
    }
  },
  
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    provider: process.env.EMAIL_PROVIDER || 'gmail',
    gmail: {
      user: process.env.GMAIL_USER,
      appPassword: process.env.GMAIL_APP_PASSWORD
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.FROM_EMAIL || 'noreply@gamesraffle.com',
      fromName: process.env.FROM_NAME || 'Games Raffle'
    },
    templates: {
      welcome: process.env.WELCOME_TEMPLATE_ID,
      verification: process.env.VERIFICATION_TEMPLATE_ID,
      gameResult: process.env.GAME_RESULT_TEMPLATE_ID,
      elimination: process.env.ELIMINATION_TEMPLATE_ID
    }
  },

  sms: {
    enabled: process.env.SMS_ENABLED === 'true',
    provider: process.env.SMS_PROVIDER || 'twilio',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      testPhone: process.env.TWILIO_TEST_PHONE
    }
  },
  
  monitoring: {
    healthCheck: {
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000 // 5 seconds
    },
    metrics: {
      enabled: process.env.METRICS_ENABLED === 'true',
      endpoint: process.env.METRICS_ENDPOINT || '/metrics'
    }
  }
};

// Validation (more lenient for deployment)
function validateConfig() {
  // Check if we have either DATABASE_URL or SQL_CONNECTION_STRING
  if (!process.env.DATABASE_URL && !process.env.SQL_CONNECTION_STRING) {
    console.warn('⚠️  No database connection string found. Server may not connect to database.');
  }
  
  // Only require Redis if explicitly using Redis (not memory cache fallback)
  if (process.env.USE_REDIS === 'true' || (process.env.NODE_ENV === 'production' && process.env.USE_MEMORY_CACHE !== 'true')) {
    if (!process.env.REDIS_CONNECTION_STRING) {
      console.warn('⚠️  Redis connection string missing but Redis is required.');
    }
  }
  
  // Warn about weak secrets but don't fail
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET is shorter than recommended 32 characters');
  }
  
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    console.warn('⚠️  SESSION_SECRET is shorter than recommended 32 characters');
  }
  
  // Only fail in production if critical secrets are completely missing
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || !process.env.SESSION_SECRET) {
      throw new Error('JWT_SECRET and SESSION_SECRET are required in production');
    }
    if (!process.env.DATABASE_URL && !process.env.SQL_CONNECTION_STRING) {
      throw new Error('Database connection string is required in production');
    }
  }
}

// Always run validation (but it's more lenient now)
validateConfig();

module.exports = config;