const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = require('./config/config');
const logger = require('./utils/logger');
const database = require('./config/database');
const memoryCache = require('./config/memoryCache');
const scheduledJobService = require('./services/scheduledJobService');
const { errorHandler } = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');
const pickRoutes = require('./routes/picks');
const teamRoutes = require('./routes/teams');
const scheduleRoutes = require('./routes/schedule');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

const app = express();

// Trust proxy (important for Azure App Service)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.sportradar.com"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.cors.allowedOrigins;
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Request ID middleware
app.use((req, res, next) => {
  req.id = require('uuid').v4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbHealthy = await database.isHealthy();
    
    // Check Memory cache
    const cacheHealthy = await memoryCache.ping() === 'PONG';
    
    const health = {
      status: dbHealthy && cacheHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: config.app.env,
      version: require('../package.json').version,
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        cache: cacheHealthy ? 'connected' : 'disconnected'
      }
    };
    
    res.status(dbHealthy && cacheHealthy ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Service temporarily unavailable'
    });
  }
});

// Handle favicon requests to avoid 404 errors in browser
app.get('/favicon.ico', (req, res) => res.status(204).end());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/picks', pickRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Survivor Sports Betting API',
    version: require('../package.json').version,
    environment: config.app.env,
    docs: '/api/docs',
    health: '/health'
  });
});

// API documentation endpoint (basic info)
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Survivor Sports Betting API',
    version: require('../package.json').version,
    description: 'REST API for the Survivor Sports Betting application',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      auth: '/api/auth - Authentication endpoints',
      users: '/api/users - User management',
      games: '/api/games - Game management',
      picks: '/api/picks - Player picks',
      teams: '/api/teams - NFL teams',
      schedule: '/api/schedule - NFL schedule',
      admin: '/api/admin - Admin functions',
      upload: '/api/upload - File uploads'
    },
    rateLimit: '100 requests per 15 minutes per IP',
    cors: 'Enabled for configured origins'
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Initialize database connection
async function initializeApp() {
  try {
    console.log('🚀 Starting Survivor Sports API server...');
    logger.info('Starting Survivor Sports API server...');
    
    // Start server FIRST so Render can detect the port immediately
    const port = config.app.port;
    const host = config.app.host;
    
    console.log(`🌐 Attempting to bind to ${host}:${port}`);
    console.log(`📊 Environment: ${config.app.env}`);
    console.log(`🔧 Process ENV PORT: ${process.env.PORT}`);
    
    const server = app.listen(port, host, () => {
      console.log(`✅ Server running on ${host}:${port} in ${config.app.env} mode`);
      logger.info(`Server running on ${host}:${port} in ${config.app.env} mode`);
      logger.info(`Health check available at: http://${host}:${port}/health`);
      logger.info(`API documentation at: http://${host}:${port}/api/docs`);
      
      // Initialize other services AFTER server is listening
      initializeServices();
    });
    
    server.on('error', (err) => {
      console.error('❌ Server failed to start:', err);
      logger.error('Server failed to start:', err);
      process.exit(1);
    });
    
    // Initialize other services after server is listening
    async function initializeServices() {
      try {
        console.log('🔌 Initializing database connection...');
        await database.initialize();
        console.log('✅ Database connected successfully');
        logger.info('Database connected successfully');
        
        console.log('💾 Initializing memory cache...');
        await memoryCache.connect();
        console.log('✅ Memory cache initialized successfully');
        logger.info('Memory cache initialized successfully');
        
        console.log('⏰ Starting scheduled jobs...');
        scheduledJobService.start();
        console.log('✅ Scheduled jobs initialized and started');
        logger.info('Scheduled jobs initialized and started');
        
        console.log('🎉 All services initialized successfully!');
      } catch (error) {
        console.error('❌ Failed to initialize services:', error);
        logger.error('Failed to initialize services:', error);
        // Don't exit - server is still running for health checks
      }
    }
    
    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`📴 Received ${signal}. Starting graceful shutdown...`);
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        logger.info('HTTP server closed');
        
        try {
          // Stop scheduled jobs
          scheduledJobService.stop();
          logger.info('Scheduled jobs stopped');
          
          await database.close();
          logger.info('Database connection closed');
          
          await memoryCache.quit();
          logger.info('Memory cache closed');
          
          console.log('✅ Graceful shutdown completed');
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown due to timeout');
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  initializeApp();
}

module.exports = app;