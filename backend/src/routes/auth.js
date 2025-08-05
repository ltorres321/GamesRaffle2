const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { authService, authRateLimit, authenticate, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');
const {
  catchAsync,
  createValidationError,
  createAuthenticationError,
  createAuthError,
  createNotFoundError
} = require('../middleware/errorHandler');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  dateOfBirth: Joi.date().max('now').required(),
  phoneNumber: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

// Helper function to validate age (21+)
const validateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  
  return age;
};

// Register new user
router.post('/register', authRateLimit, catchAsync(async (req, res) => {
  // Validate input
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw createValidationError('registration', error.details[0].message);
  }

  const { username, email, password, firstName, lastName, dateOfBirth, phoneNumber } = value;

  // Validate age requirement (21+)
  const age = validateAge(dateOfBirth);
  if (age < 21) {
    throw createValidationError('age', 'You must be at least 21 years old to register');
  }

  // Check if user already exists
  const existingUser = await database.query(`
    SELECT UserId FROM Users 
    WHERE Email = @email OR Username = @username
  `, { email, username });

  if (existingUser.recordset.length > 0) {
    throw createValidationError('user', 'User with this email or username already exists');
  }

  // Hash password
  const passwordHash = await authService.hashPassword(password);

  // Create user
  const userId = uuidv4();
  
  await database.query(`
    INSERT INTO Users (
      UserId, Username, Email, PasswordHash, FirstName, LastName, 
      DateOfBirth, PhoneNumber, Role, IsVerified, IsActive
    ) VALUES (
      @userId, @username, @email, @passwordHash, @firstName, @lastName,
      @dateOfBirth, @phoneNumber, 'Player', 0, 1
    )
  `, {
    userId,
    username,
    email,
    passwordHash,
    firstName,
    lastName,
    dateOfBirth,
    phoneNumber: phoneNumber || null
  });

  // Generate tokens
  const { accessToken, refreshToken, refreshPayload } = authService.generateTokens(userId, email, 'Player');

  // Calculate refresh token expiry
  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 days

  // Store refresh token
  await authService.storeRefreshToken(userId, refreshToken, refreshPayload.jti, refreshExpiresAt);

  // Create session
  const sessionId = await authService.createSession(userId, req);

  // Log successful registration
  logger.logBusinessEvent('user_registered', { userId, email, username }, userId);
  logger.logAuditEvent('user_create', 'User', userId, { email, username });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: userId,
        username,
        email,
        firstName,
        lastName,
        role: 'Player',
        isVerified: false,
        isActive: true
      },
      tokens: {
        accessToken,
        refreshToken,
        sessionId
      }
    }
  });
}));

// Login user
router.post('/login', authRateLimit, catchAsync(async (req, res) => {
  // Validate input
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw createValidationError('login', error.details[0].message);
  }

  const { email, password } = value;

  // Find user
  const result = await database.query(`
    SELECT UserId, Email, Username, PasswordHash, FirstName, LastName, 
           Role, IsVerified, IsActive
    FROM Users 
    WHERE Email = @email
  `, { email });

  if (!result.recordset[0]) {
    throw createAuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const user = result.recordset[0];

  // Check if user is active
  if (!user.IsActive) {
    throw createAuthError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
  }

  // Verify password
  const isValidPassword = await authService.comparePassword(password, user.PasswordHash);
  if (!isValidPassword) {
    throw createAuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const { accessToken, refreshToken, refreshPayload } = authService.generateTokens(
    user.UserId, 
    user.Email, 
    user.Role
  );

  // Calculate refresh token expiry
  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 days

  // Store refresh token
  await authService.storeRefreshToken(user.UserId, refreshToken, refreshPayload.jti, refreshExpiresAt);

  // Create session
  const sessionId = await authService.createSession(user.UserId, req);

  // Update last login
  await database.query(`
    UPDATE Users 
    SET LastLoginAt = GETUTCDATE() 
    WHERE UserId = @userId
  `, { userId: user.UserId });

  // Log successful login
  logger.logBusinessEvent('user_login', { 
    userId: user.UserId, 
    email: user.Email, 
    ip: req.ip 
  }, user.UserId);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.UserId,
        username: user.Username,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        role: user.Role,
        isVerified: user.IsVerified,
        isActive: user.IsActive
      },
      tokens: {
        accessToken,
        refreshToken,
        sessionId
      }
    }
  });
}));

// Refresh access token
router.post('/refresh', catchAsync(async (req, res) => {
  // Validate input
  const { error, value } = refreshTokenSchema.validate(req.body);
  if (error) {
    throw createValidationError('refresh', error.details[0].message);
  }

  const { refreshToken } = value;

  // Validate refresh token
  const userData = await authService.validateRefreshToken(refreshToken);

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken, refreshPayload } = authService.generateTokens(
    userData.userId,
    userData.email,
    userData.role
  );

  // Calculate refresh token expiry
  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 days

  // Store new refresh token
  await authService.storeRefreshToken(userData.userId, newRefreshToken, refreshPayload.jti, refreshExpiresAt);

  // Log token refresh
  logger.logBusinessEvent('token_refreshed', { userId: userData.userId }, userData.userId);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken
      }
    }
  });
}));

// Logout user
router.post('/logout', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.body;

  // Revoke refresh token
  await authService.revokeRefreshToken(userId);

  // Destroy session
  if (sessionId) {
    await authService.destroySession(sessionId, userId);
  }

  // Log logout
  logger.logBusinessEvent('user_logout', { userId }, userId);

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

// Get current user profile
router.get('/me', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get detailed user information
  const result = await database.query(`
    SELECT u.UserId, u.Username, u.Email, u.FirstName, u.LastName, 
           u.DateOfBirth, u.PhoneNumber, u.Role, u.IsVerified, u.IsActive,
           u.CreatedAt, u.LastLoginAt,
           uv.VerificationStatus
    FROM Users u
    LEFT JOIN UserVerification uv ON u.UserId = uv.UserId 
      AND uv.VerificationId = (
        SELECT TOP 1 VerificationId 
        FROM UserVerification 
        WHERE UserId = u.UserId 
        ORDER BY SubmittedAt DESC
      )
    WHERE u.UserId = @userId
  `, { userId });

  if (!result.recordset[0]) {
    throw createNotFoundError('User', userId);
  }

  const user = result.recordset[0];

  res.json({
    success: true,
    data: {
      user: {
        id: user.UserId,
        username: user.Username,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        dateOfBirth: user.DateOfBirth,
        phoneNumber: user.PhoneNumber,
        role: user.Role,
        isVerified: user.IsVerified,
        isActive: user.IsActive,
        verificationStatus: user.VerificationStatus || 'Pending',
        createdAt: user.CreatedAt,
        lastLoginAt: user.LastLoginAt
      }
    }
  });
}));

// Verify user session
router.get('/verify', optionalAuth, catchAsync(async (req, res) => {
  if (!req.user) {
    return res.json({
      success: false,
      authenticated: false,
      message: 'No valid session found'
    });
  }

  res.json({
    success: true,
    authenticated: true,
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        isVerified: req.user.isVerified,
        isActive: req.user.isActive
      }
    }
  });
}));

// Change password
router.put('/password', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const schema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    throw createValidationError('password', error.details[0].message);
  }

  const { currentPassword, newPassword } = value;

  // Get current password hash
  const result = await database.query(`
    SELECT PasswordHash FROM Users WHERE UserId = @userId
  `, { userId });

  if (!result.recordset[0]) {
    throw createNotFoundError('User', userId);
  }

  // Verify current password
  const isValidPassword = await authService.comparePassword(
    currentPassword, 
    result.recordset[0].PasswordHash
  );
  
  if (!isValidPassword) {
    throw createAuthenticationError('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await authService.hashPassword(newPassword);

  // Update password
  await database.query(`
    UPDATE Users 
    SET PasswordHash = @passwordHash, UpdatedAt = GETUTCDATE()
    WHERE UserId = @userId
  `, { userId, passwordHash: newPasswordHash });

  // Revoke all refresh tokens (force re-login on other devices)
  await authService.revokeRefreshToken(userId);

  // Log password change
  logger.logBusinessEvent('password_changed', { userId }, userId);
  logger.logAuditEvent('user_update', 'User', userId, { action: 'password_change' });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

module.exports = router;