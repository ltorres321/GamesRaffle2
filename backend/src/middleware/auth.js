const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const database = require('../config/database');
const memoryCache = require('../config/memoryCache');
const logger = require('../utils/logger');
const { 
  createAuthenticationError, 
  createAuthError, 
  createValidationError,
  catchAsync 
} = require('./errorHandler');

class AuthService {
  // Generate JWT tokens
  generateTokens(userId, email, role) {
    const payload = {
      userId,
      email,
      role,
      type: 'access'
    };

    const accessToken = jwt.sign(payload, config.auth.jwt.secret, {
      expiresIn: config.auth.jwt.accessTokenExpiry,
      issuer: config.auth.jwt.issuer,
      audience: config.auth.jwt.audience
    });

    const refreshPayload = {
      userId,
      type: 'refresh',
      jti: uuidv4() // Unique identifier for this refresh token
    };

    const refreshToken = jwt.sign(refreshPayload, config.auth.jwt.secret, {
      expiresIn: config.auth.jwt.refreshTokenExpiry,
      issuer: config.auth.jwt.issuer,
      audience: config.auth.jwt.audience
    });

    return { accessToken, refreshToken, refreshPayload };
  }

  // Verify JWT token
  async verifyToken(token, type = 'access') {
    try {
      const decoded = jwt.verify(token, config.auth.jwt.secret, {
        issuer: config.auth.jwt.issuer,
        audience: config.auth.jwt.audience
      });

      if (decoded.type !== type) {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw createAuthenticationError('Token has expired', 'TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw createAuthenticationError('Invalid token', 'INVALID_TOKEN');
      }
      throw error;
    }
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, config.auth.bcrypt.saltRounds);
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Store refresh token in database and Redis
  async storeRefreshToken(userId, refreshToken, jti, expiresAt) {
    try {
      // Store in database (skip for now as these columns don't exist in PostgreSQL schema)
      // await database.query(`
      //   UPDATE users
      //   SET refresh_token = @refreshToken, refresh_token_expires_at = @expiresAt
      //   WHERE id = @userId
      // `, {
      //   userId,
      //   refreshToken,
      //   expiresAt
      // });

      // Store in Redis for fast lookup
      const sessionKey = `refresh:${jti}`;
      const sessionData = {
        userId,
        refreshToken,
        expiresAt: expiresAt.toISOString()
      };

      await memoryCache.setSession(sessionKey, sessionData, config.redis.ttl.session);

      logger.info('Refresh token stored', { userId, jti });
    } catch (error) {
      logger.error('Failed to store refresh token', { userId, error: error.message });
      throw error;
    }
  }

  // Validate refresh token
  async validateRefreshToken(refreshToken) {
    try {
      const decoded = await this.verifyToken(refreshToken, 'refresh');
      
      // Check if token exists in Redis
      const sessionKey = `refresh:${decoded.jti}`;
      const sessionData = await memoryCache.getSession(sessionKey);
      
      if (!sessionData || sessionData.refreshToken !== refreshToken) {
        throw createAuthenticationError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }

      // Verify user still exists and token matches
      const user = await database.query(`
        SELECT id, email, role, is_active
        FROM users
        WHERE id = $1
      `, [decoded.userId]);

      if (!user.rows[0]) {
        throw createAuthenticationError('User not found', 'USER_NOT_FOUND');
      }

      const userData = user.rows[0];

      if (!userData.is_active) {
        throw createAuthError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
      }

      // Skip token validation for now since we're not storing it in PostgreSQL
      // if (userData.refresh_token !== refreshToken) {
      //   throw createAuthenticationError('Token mismatch', 'TOKEN_MISMATCH');
      // }

      return {
        userId: userData.id,
        email: userData.email,
        role: userData.role
      };
    } catch (error) {
      logger.error('Refresh token validation failed', { error: error.message });
      throw error;
    }
  }

  // Revoke refresh token
  async revokeRefreshToken(userId, jti = null) {
    try {
      // Clear from database (skip for now as these columns don't exist)
      // await database.query(`
      //   UPDATE users
      //   SET refresh_token = NULL, refresh_token_expires_at = NULL
      //   WHERE id = @userId
      // `, { userId });

      // Clear from Redis
      if (jti) {
        const sessionKey = `refresh:${jti}`;
        await memoryCache.deleteSession(sessionKey);
      }

      // Clear all user sessions
      // Clear user sessions from memory cache (simplified for memory cache)
await memoryCache.keys(`session:*`).then(keys => {
  keys.forEach(key => {
    if (key.includes(userId)) {
      memoryCache.del(key);
    }
  });
});

      logger.info('Refresh token revoked', { userId, jti });
    } catch (error) {
      logger.error('Failed to revoke refresh token', { userId, error: error.message });
      throw error;
    }
  }

  // Create user session
  async createSession(userId, req) {
    const sessionId = uuidv4();
    const sessionData = {
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    await memoryCache.setSession(`${sessionId}:${userId}`, sessionData);
    
    logger.info('User session created', { userId, sessionId, ip: req.ip });
    return sessionId;
  }

  // Validate session
  async validateSession(sessionId, userId) {
    const sessionData = await memoryCache.getSession(`${sessionId}:${userId}`);
    
    if (!sessionData) {
      return false;
    }

    // Update last activity
    sessionData.lastActivity = new Date().toISOString();
    await memoryCache.setSession(`${sessionId}:${userId}`, sessionData);
    
    return true;
  }

  // Destroy session
  async destroySession(sessionId, userId) {
    await memoryCache.deleteSession(`${sessionId}:${userId}`);
    logger.info('User session destroyed', { userId, sessionId });
  }
}

const authService = new AuthService();

// Middleware to authenticate requests
const authenticate = catchAsync(async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw createAuthenticationError('Access token required');
  }

  // Verify token
  const decoded = await authService.verifyToken(token, 'access');

  // Get user from database
  const result = await database.query(`
    SELECT userid, email, username, firstname, lastname, role, isverified, isactive
    FROM users
    WHERE userid = $1
  `, [decoded.userId]);

  if (!result.rows[0]) {
    throw createAuthenticationError('User not found');
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw createAuthError('Account is deactivated');
  }

  // Attach user to request
  req.user = {
    id: user.userid,
    userId: user.userid,  // Add userId for compatibility with survivor routes
    email: user.email,
    username: user.username,
    firstName: user.firstname,
    lastName: user.lastname,
    role: user.role,
    isVerified: user.isverified,
    isActive: user.isactive
  };

  // Log successful authentication
  logger.debug('User authenticated', {
    userId: user.userid,
    email: user.email,
    role: user.role
  });

  next();
});

// Middleware to authorize based on roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw createAuthenticationError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw createAuthError(`Access denied. Required roles: ${roles.join(', ')}`);
    }

    next();
  };
};

// Middleware to require verified users
const requireVerified = (req, res, next) => {
  if (!req.user) {
    throw createAuthenticationError('Authentication required');
  }

  if (!req.user.isVerified) {
    throw createAuthError('Account verification required', 'VERIFICATION_REQUIRED');
  }

  next();
};

// Optional authentication (doesn't throw error if no token)
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = await authService.verifyToken(token, 'access');
      
      const result = await database.query(`
        SELECT userid, email, username, firstname, lastname, role, isverified, isactive
        FROM users
        WHERE userid = $1 AND isactive = true
      `, [decoded.userId]);

      if (result.rows[0]) {
        const user = result.rows[0];
        req.user = {
          id: user.userid,
          userId: user.userid,  // Add userId for compatibility with survivor routes
          email: user.email,
          username: user.username,
          firstName: user.firstname,
          lastName: user.lastname,
          role: user.role,
          isVerified: user.isverified,
          isActive: user.isactive
        };
      }
    } catch (error) {
      // Ignore authentication errors for optional auth
      logger.debug('Optional auth failed', { error: error.message });
    }
  }

  next();
});

// Rate limiting for authentication endpoints
const authRateLimit = catchAsync(async (req, res, next) => {
  const identifier = `auth:${req.ip}`;
  const attempts = await memoryCache.incrementRateLimit(identifier, 15 * 60 * 1000); // 15 minutes
  
  if (attempts > config.auth.rateLimit.authMax) {
    throw createAuthenticationError(
      `Too many authentication attempts. Try again in 15 minutes.`,
      'AUTH_RATE_LIMIT'
    );
  }

  // Add attempt count to response headers
  res.setHeader('X-RateLimit-Limit', config.auth.rateLimit.authMax);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, config.auth.rateLimit.authMax - attempts));
  res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 15 * 60 * 1000).toISOString());

  next();
});

module.exports = {
  authService,
  authenticate,
  authorize,
  requireVerified,
  optionalAuth,
  authRateLimit
};