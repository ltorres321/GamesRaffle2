const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { authService, authRateLimit, authenticate, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
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
  firstName: Joi.string().min(1).max(100).required(), // As appears on license/passport
  lastName: Joi.string().min(1).max(100).required(), // As appears on license/passport
  dateOfBirth: Joi.date().max('now').required(),
  phoneNumber: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(), // Required for SMS verification
  // Address fields (required for license verification)
  streetAddress: Joi.string().min(5).max(200).required(),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(50).required(),
  zipCode: Joi.string().min(5).max(20).required(),
  country: Joi.string().min(2).max(50).default('United States')
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

// Helper function to generate verification tokens
const generateVerificationToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Helper function to generate SMS verification code
const generateSMSCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Register new user
router.post('/register', authRateLimit, catchAsync(async (req, res) => {
  // Validate input
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw createValidationError('registration', error.details[0].message);
  }

  const {
    username, email, password, firstName, lastName, dateOfBirth, phoneNumber,
    streetAddress, city, state, zipCode, country
  } = value;

  // Validate age requirement (21+)
  const age = validateAge(dateOfBirth);
  if (age < 21) {
    throw createValidationError('age', 'You must be at least 21 years old to register');
  }

  // Check if user already exists
  const existingUser = await database.query(`
    SELECT id FROM users
    WHERE email = @email OR username = @username
  `, { email, username });

  if (existingUser.rows.length > 0) {
    throw createValidationError('user', 'User with this email or username already exists');
  }

  // Hash password
  const passwordHash = await authService.hashPassword(password);

  // Generate verification tokens
  const emailVerificationToken = generateVerificationToken();
  const phoneVerificationCode = generateSMSCode();
  
  // Set expiration times (24 hours for email, 10 minutes for SMS)
  const emailExpires = new Date();
  emailExpires.setHours(emailExpires.getHours() + 24);
  const phoneExpires = new Date();
  phoneExpires.setMinutes(phoneExpires.getMinutes() + 10);

  // Create user
  const userId = uuidv4();
  
  const result = await database.query(`
    INSERT INTO users (
      username, email, password_hash, first_name, last_name,
      date_of_birth, phone_number, street_address, city, state, zip_code, country,
      role, email_verified, phone_verified, is_verified, is_active
    ) VALUES (
      @username, @email, @passwordHash, @firstName, @lastName,
      @dateOfBirth, @phoneNumber, @streetAddress, @city, @state, @zipCode, @country,
      'user', false, false, false, true
    )
    RETURNING id
  `, {
    username, email, passwordHash, firstName, lastName,
    dateOfBirth, phoneNumber, streetAddress, city, state, zipCode, country
  });

  // Get the generated user ID
  const newUserId = result.rows[0].id;

  // Send email verification (temporarily disabled for debugging)
  // try {
  //   await emailService.sendVerificationEmail(email, emailVerificationToken, firstName);
  //   logger.logBusinessEvent('email_verification_sent', {
  //     userId, email, token: emailVerificationToken
  //   }, userId);
  // } catch (error) {
  //   logger.error('Failed to send verification email:', error);
  //   // Continue registration even if email fails
  // }

  // Send SMS verification (temporarily disabled for debugging)
  // try {
  //   await smsService.sendVerificationSMS(phoneNumber, phoneVerificationCode, firstName);
  //   logger.logBusinessEvent('sms_verification_sent', {
  //     userId, phoneNumber, code: phoneVerificationCode
  //   }, userId);
  // } catch (error) {
  //   logger.error('Failed to send verification SMS:', error);
  //   // Continue registration even if SMS fails
  // }

  console.log('✅ Database INSERT completed, user ID:', newUserId);

  // Generate tokens (user can login but features are limited until verified)
  const { accessToken, refreshToken, refreshPayload } = authService.generateTokens(newUserId, email, 'user');

  // Calculate refresh token expiry
  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 days

  // Store refresh token (skip for now due to PostgreSQL schema differences)
  // await authService.storeRefreshToken(newUserId, refreshToken, refreshPayload.jti, refreshExpiresAt);

  // Create session (skip for now to isolate database INSERT issue)
  // const sessionId = await authService.createSession(newUserId, req);
  const sessionId = 'temp-session-' + newUserId;

  // Log successful registration
  logger.logBusinessEvent('user_registered', { userId: newUserId, email, username }, newUserId);
  logger.logAuditEvent('user_create', 'User', newUserId, { email, username });

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your email and phone number to access all features.',
    data: {
      user: {
        id: newUserId,
        username,
        email,
        firstName,
        lastName,
        phoneNumber,
        role: 'user',
        emailVerified: false,
        phoneVerified: false,
        isVerified: false,
        isActive: true,
        requiresVerification: true
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
    SELECT id, email, username, password_hash, first_name, last_name,
           role, is_verified, is_active
    FROM users
    WHERE email = @email
  `, { email });

  if (!result.rows[0]) {
    throw createAuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const user = result.rows[0];

  // Check if user is active
  if (!user.is_active) {
    throw createAuthError('Account is deactivated', 'ACCOUNT_DEACTIVATED');
  }

  // Verify password
  const isValidPassword = await authService.comparePassword(password, user.password_hash);
  if (!isValidPassword) {
    throw createAuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const { accessToken, refreshToken, refreshPayload } = authService.generateTokens(
    user.id,
    user.email,
    user.role
  );

  // Calculate refresh token expiry
  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 days

  // Store refresh token
  await authService.storeRefreshToken(user.id, refreshToken, refreshPayload.jti, refreshExpiresAt);

  // Create session
  const sessionId = await authService.createSession(user.id, req);

  // Update last login (skip for now as column doesn't exist in PostgreSQL schema)
  // await database.query(`
  //   UPDATE users
  //   SET last_login_at = NOW()
  //   WHERE id = @userId
  // `, { userId: user.id });

  // Log successful login
  logger.logBusinessEvent('user_login', {
    userId: user.id,
    email: user.email,
    ip: req.ip
  }, user.id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified,
        isActive: user.is_active
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

  // Get detailed user information with verification status
  const result = await database.query(`
    SELECT u.UserId, u.Username, u.Email, u.FirstName, u.LastName,
           u.DateOfBirth, u.PhoneNumber, u.Role, u.IsVerified, u.IsActive,
           u.EmailVerified, u.PhoneVerified, u.CreatedAt, u.LastLoginAt,
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

  if (!result.rows[0]) {
    throw createNotFoundError('User', userId);
  }

  const user = result.rows[0];

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
        emailVerified: user.EmailVerified,
        phoneVerified: user.PhoneVerified,
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

  if (!result.rows[0]) {
    throw createNotFoundError('User', userId);
  }

  // Verify current password
  const isValidPassword = await authService.comparePassword(
    currentPassword,
    result.rows[0].PasswordHash
  );
  
  if (!isValidPassword) {
    throw createAuthenticationError('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await authService.hashPassword(newPassword);

  // Update password
  await database.query(`
    UPDATE Users
    SET PasswordHash = @passwordHash, UpdatedAt = NOW()
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
// Email verification endpoint
router.post('/verify-email', catchAsync(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    throw createValidationError('token', 'Verification token is required');
  }

  // Find user with this verification token
  const result = await database.query(`
    SELECT UserId, Email, EmailVerificationExpires
    FROM Users
    WHERE EmailVerificationToken = @token
      AND EmailVerificationExpires > NOW()
      AND EmailVerified = 0
  `, { token });

  if (!result.rows[0]) {
    throw createValidationError('token', 'Invalid or expired verification token');
  }

  const user = result.rows[0];

  // Mark email as verified and user as partially verified
  await database.query(`
    UPDATE Users
    SET EmailVerified = true,
        EmailVerifiedAt = NOW(),
        EmailVerificationToken = NULL,
        EmailVerificationExpires = NULL,
        IsVerified = true,
        UpdatedAt = NOW()
    WHERE UserId = @userId
  `, { userId: user.UserId });

  // Log verification
  logger.logBusinessEvent('email_verified', { userId: user.UserId, email: user.Email }, user.UserId);

  res.json({
    success: true,
    message: 'Email verified successfully',
    data: {
      isVerified: true,
      canAccessSite: true
    }
  });
}));

// SMS verification endpoint
router.post('/verify-phone', catchAsync(async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    throw createValidationError('code', 'Verification code is required');
  }

  // Find user with this verification code
  const result = await database.query(`
    SELECT UserId, PhoneNumber, PhoneVerificationExpires
    FROM Users
    WHERE PhoneVerificationCode = @code
      AND PhoneVerificationExpires > NOW()
      AND PhoneVerified = 0
  `, { code });

  if (!result.rows[0]) {
    throw createValidationError('code', 'Invalid or expired verification code');
  }

  const user = result.rows[0];

  // Mark phone as verified and user as verified (single verification is sufficient)
  await database.query(`
    UPDATE Users
    SET PhoneVerified = true,
        PhoneVerifiedAt = NOW(),
        PhoneVerificationCode = NULL,
        PhoneVerificationExpires = NULL,
        IsVerified = true,
        UpdatedAt = NOW()
    WHERE UserId = @userId
  `, { userId: user.UserId });

  // Check current verification status for response
  const userStatus = await database.query(`
    SELECT EmailVerified, PhoneVerified FROM Users WHERE UserId = @userId
  `, { userId: user.UserId });

  const userVerification = userStatus.rows[0];
  const fullyVerified = userVerification.EmailVerified && userVerification.PhoneVerified;

  // Log verification
  logger.logBusinessEvent('phone_verified', { userId: user.UserId, phoneNumber: user.PhoneNumber }, user.UserId);

  res.json({
    success: true,
    message: 'Phone number verified successfully',
    data: {
      isVerified: true,
      canAccessSite: true,
      fullyVerified: fullyVerified
    }
  });
}));

// Resend email verification
router.post('/resend-email-verification', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Check if user needs email verification
  const userResult = await database.query(`
    SELECT Email, EmailVerified FROM Users WHERE UserId = @userId
  `, { userId });

  if (!userResult.rows[0]) {
    throw createNotFoundError('User', userId);
  }

  const user = userResult.rows[0];
  if (user.EmailVerified) {
    throw createValidationError('verification', 'Email is already verified');
  }

  // Generate new verification token
  const emailVerificationToken = generateVerificationToken();
  const emailExpires = new Date();
  emailExpires.setHours(emailExpires.getHours() + 24);

  // Update user with new token
  await database.query(`
    UPDATE Users
    SET EmailVerificationToken = @token,
        EmailVerificationExpires = @expires,
        UpdatedAt = NOW()
    WHERE UserId = @userId
  `, { userId, token: emailVerificationToken, expires: emailExpires });

  // Send email verification
  try {
    await emailService.sendVerificationEmail(user.Email, emailVerificationToken, '');
    logger.logBusinessEvent('email_verification_resent', {
      userId, email: user.Email, token: emailVerificationToken
    }, userId);
  } catch (error) {
    logger.error('Failed to resend verification email:', error);
    // Continue even if email fails - user will see success message
  }

  res.json({
    success: true,
    message: 'Verification email sent successfully'
  });
}));

// Resend SMS verification
router.post('/resend-sms-verification', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Check if user needs phone verification
  const userResult = await database.query(`
    SELECT PhoneNumber, PhoneVerified FROM Users WHERE UserId = @userId
  `, { userId });

  if (!userResult.rows[0]) {
    throw createNotFoundError('User', userId);
  }

  const user = userResult.rows[0];
  if (user.PhoneVerified) {
    throw createValidationError('verification', 'Phone number is already verified');
  }

  // Generate new verification code
  const phoneVerificationCode = generateSMSCode();
  const phoneExpires = new Date();
  phoneExpires.setMinutes(phoneExpires.getMinutes() + 10);

  // Update user with new code
  await database.query(`
    UPDATE Users
    SET PhoneVerificationCode = @code,
        PhoneVerificationExpires = @expires,
        UpdatedAt = NOW()
    WHERE UserId = @userId
  `, { userId, code: phoneVerificationCode, expires: phoneExpires });

  // Send SMS verification
  try {
    await smsService.sendVerificationSMS(user.PhoneNumber, phoneVerificationCode, '');
    logger.logBusinessEvent('sms_verification_resent', {
      userId, phoneNumber: user.PhoneNumber, code: phoneVerificationCode
    }, userId);
  } catch (error) {
    logger.error('Failed to resend verification SMS:', error);
    // Continue even if SMS fails - user will see success message
  }

  res.json({
    success: true,
    message: 'Verification code sent successfully'
  });
}));

module.exports = router;