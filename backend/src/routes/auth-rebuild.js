const express = require('express');
const bcrypt = require('bcrypt');
const database = require('../config/database');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const router = express.Router();

console.log('🔧 Auth-rebuild: Starting module load');

// Test progressive INSERT to isolate field issues
router.post('/test-insert-progressive', async (req, res) => {
  try {
    console.log('🧪 Testing progressive INSERT...');
    
    // Test with additional fields step by step
    const result = await database.query(`
      INSERT INTO users (
        username, email, passwordhash, firstname, lastname, role, isactive
      ) VALUES (
        'testuser2', 'test2@example.com', 'hashedpassword123',
        'Test', 'User', 'user', true
      )
      RETURNING userid
    `);
    
    console.log('✅ Progressive insert result:', result);
    
    res.status(200).json({
      success: true,
      message: 'Progressive insert successful',
      result: result
    });
  } catch (error) {
    console.error('❌ Progressive insert error:', error);
    res.status(500).json({
      success: false,
      message: 'Progressive insert failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Test minimal INSERT
router.post('/test-insert', async (req, res) => {
  try {
    console.log('🧪 Testing minimal INSERT...');
    
    // Try the simplest possible insert with userid (which has auto-generation)
    const result = await database.query(`
      INSERT INTO users (username, email, passwordhash)
      VALUES ('testuser', 'test@example.com', 'hashedpassword123')
      RETURNING userid
    `);
    
    console.log('✅ Minimal insert result:', result);
    
    res.status(200).json({
      success: true,
      message: 'Minimal insert successful',
      result: result
    });
  } catch (error) {
    console.error('❌ Minimal insert error:', error);
    res.status(500).json({
      success: false,
      message: 'Minimal insert failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Test users table structure
router.post('/test-users-table', async (req, res) => {
  try {
    console.log('🧪 Testing users table structure...');
    
    // Check table structure
    const tableInfo = await database.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('📋 Users table structure:', tableInfo.rows);
    
    // Test if table exists and has data
    const countQuery = await database.query('SELECT COUNT(*) as total FROM users');
    console.log('📊 Current user count:', countQuery.rows[0].total);
    
    res.status(200).json({
      success: true,
      message: 'Users table test successful',
      tableStructure: tableInfo.rows,
      userCount: countQuery.rows[0].total
    });
  } catch (error) {
    console.error('❌ Users table test error:', error);
    res.status(500).json({
      success: false,
      message: 'Users table test failed',
      error: error.message
    });
  }
});

// Simple database test endpoint
router.post('/test-db', async (req, res) => {
  try {
    console.log('🧪 Testing database connection...');
    
    // Simple SELECT query
    const testQuery = await database.query('SELECT 1 as test');
    console.log('✅ Basic query result:', testQuery);
    
    res.status(200).json({
      success: true,
      message: 'Database test successful',
      result: testQuery
    });
  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
});

// Test parameterized INSERT with same parameter names as registration
router.post('/test-parameterized-insert', async (req, res) => {
  try {
    console.log('🧪 Testing parameterized INSERT with registration parameter names...');
    
    // Test with exact same parameter names as registration
    const testParams = {
      username: 'paramtest',
      email: 'paramtest@example.com',
      passwordHash: '$2b$10$hashedpassword123',
      firstName: 'Param',
      lastName: 'Test',
      dateOfBirth: '1990-01-01',
      phoneNumber: '+1-555-123-4567',
      streetAddress: '123 Param St',
      city: 'Param City',
      state: 'TX',
      zipCode: '12345',
      country: 'US'
    };
    
    console.log('📝 Test parameters:', Object.keys(testParams));
    
    const result = await database.query(`
      INSERT INTO users (
        username, email, passwordhash, firstname, lastname,
        dateofbirth, phonenumber, streetaddress, city, state, zipcode, country,
        role, emailverified, phoneverified, isverified, isactive
      ) VALUES (
        @username, @email, @passwordHash, @firstName, @lastName,
        @dateOfBirth, @phoneNumber, @streetAddress, @city, @state, @zipCode, @country,
        'user', false, false, false, true
      )
      RETURNING userid
    `, testParams);
    
    console.log('✅ Parameterized insert result:', result);
    
    res.status(200).json({
      success: true,
      message: 'Parameterized insert successful',
      result: result,
      params: Object.keys(testParams)
    });
  } catch (error) {
    console.error('❌ Parameterized insert error:', error);
    res.status(500).json({
      success: false,
      message: 'Parameterized insert failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Debug registration INSERT to isolate parameter issue
router.post('/debug-registration-insert', async (req, res) => {
  try {
    console.log('🧪 Testing exact registration INSERT...');
    
    // Test the exact INSERT with hardcoded values
    const result = await database.query(`
      INSERT INTO users (
        username, email, passwordhash, firstname, lastname,
        dateofbirth, phonenumber, streetaddress, city, state, zipcode, country,
        role, emailverified, phoneverified, isverified, isactive
      ) VALUES (
        'debuguser', 'debug@example.com', '$2b$10$hashedpassword123',
        'Debug', 'User', '1990-01-01', '+1-555-123-4567',
        '123 Debug St', 'Debug City', 'TX', '12345', 'US',
        'user', false, false, false, true
      )
      RETURNING userid
    `);
    
    console.log('✅ Debug registration insert result:', result);
    
    res.status(200).json({
      success: true,
      message: 'Debug registration insert successful',
      result: result
    });
  } catch (error) {
    console.error('❌ Debug registration insert error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug registration insert failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Simplified registration endpoint to isolate the issue
router.post('/register-simple', async (req, res) => {
  const requestId = crypto.randomUUID();
  
  try {
    console.log('🚀 Simple registration endpoint hit, requestId:', requestId);
    
    const { username, email, password, firstName, lastName } = req.body;
    console.log('📝 Simple request data:', { username, email, firstName, lastName });

    // Minimal validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        requestId
      });
    }

    console.log('✅ Basic validation passed');

    // Hash password
    console.log('🔒 Hashing password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully');

    // Simple insert
    console.log('💾 Creating user...');
    const result = await database.query(`
      INSERT INTO users (username, email, passwordhash, firstname, lastname, role, isactive)
      VALUES (@username, @email, @passwordHash, @firstName, @lastName, 'user', true)
      RETURNING userid
    `, {
      username: username + '_simple_' + Date.now(), // Make unique
      email: email.replace('@', '_simple_' + Date.now() + '@'), // Make unique
      passwordHash,
      firstName,
      lastName
    });

    const newUserId = result.rows[0].userid;
    console.log('✅ User created successfully with ID:', newUserId);

    console.log('📤 Sending success response...');
    res.status(201).json({
      success: true,
      message: 'Simple registration successful',
      userId: newUserId,
      requestId
    });
    console.log('✅ Response sent successfully');

  } catch (error) {
    console.error('❌ Simple registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Simple registration failed',
      error: error.message,
      requestId
    });
  }
});

// Full registration endpoint with database integration
router.post('/register', async (req, res) => {
  const requestId = crypto.randomUUID();
  
  try {
    console.log('🚀 Auth-rebuild: Registration endpoint hit, requestId:', requestId);
    
    const {
      username, email, password, confirmPassword, firstName, lastName,
      dateOfBirth, phoneNumber, streetAddress, city, state, zipCode, country = 'US'
    } = req.body;

    console.log('📝 Request data received for user:', username);

    // Basic validation
    if (!username || !email || !password || !firstName || !lastName) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
        code: 'MISSING_FIELDS',
        requestId
      });
    }

    if (password !== confirmPassword) {
      console.log('❌ Password mismatch');
      return res.status(400).json({
        status: 'error',
        message: 'Passwords do not match',
        code: 'PASSWORD_MISMATCH',
        requestId
      });
    }

    console.log('✅ Basic validation passed');

    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    const existingUser = await database.query(`
      SELECT userid FROM users
      WHERE email = @email OR username = @username
    `, { email, username });

    console.log('✅ Database query completed, found:', existingUser.rows ? existingUser.rows.length : 0);

    if (existingUser.rows && existingUser.rows.length > 0) {
      console.log('❌ User already exists');
      return res.status(400).json({
        status: 'error',
        message: 'Username or email already exists',
        code: 'USER_EXISTS',
        requestId
      });
    }

    console.log('✅ No existing user found');

    // Hash password
    console.log('🔒 Hashing password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully');

    // Insert with correct PostgreSQL schema column names
    console.log('💾 Creating user with correct column names...');
    const result = await database.query(`
      INSERT INTO users (
        username, email, passwordhash, firstname, lastname,
        dateofbirth, phonenumber, streetaddress, city, state, zipcode, country,
        role, emailverified, phoneverified, isverified, isactive
      ) VALUES (
        @username, @email, @passwordHash, @firstName, @lastName,
        @dateOfBirth, @phoneNumber, @streetAddress, @city, @state, @zipCode, @country,
        'user', false, false, false, true
      )
      RETURNING userid
    `, {
      username, email, passwordHash, firstName, lastName,
      dateOfBirth, phoneNumber, streetAddress, city, state, zipCode, country
    });

    const newUserId = result.rows[0].userid;
    console.log('✅ User created successfully with ID:', newUserId);

    // Generate JWT tokens for immediate authentication
    console.log('🔐 Generating authentication tokens...');
    const jwt = require('jsonwebtoken');
    
    const tokenPayload = {
      userId: newUserId,
      username,
      email,
      role: 'user'
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '30d' });
    const sessionId = crypto.randomUUID();

    console.log('✅ Tokens generated successfully');

    console.log('📤 Sending success response with tokens...');
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUserId,
          username,
          email,
          firstName,
          lastName,
          role: 'user',
          isActive: true,
          emailVerified: false,
          phoneVerified: false,
          isVerified: false
        },
        tokens: {
          accessToken,
          refreshToken,
          sessionId
        }
      },
      requestId
    });
    console.log('✅ Response sent successfully with tokens');

  } catch (error) {
    console.error('❌ Auth-rebuild registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong during registration!',
      code: 'INTERNAL_ERROR',
      requestId
    });
  }
});

// JWT Token verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      authenticated: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      authenticated: false,
      message: 'Invalid or expired token'
    });
  }
};

// GET /api/auth/verify - Verify JWT token (used by AuthContext)
router.get('/verify', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Token verification for user:', req.user.userId);

    // Get user details from database
    const userResult = await database.query(`
      SELECT userid, username, email, firstname, lastname, role,
             emailverified, phoneverified, isverified, isactive
      FROM users
      WHERE userid = @userId
    `, { userId: req.user.userId });

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(401).json({
        authenticated: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    res.status(200).json({
      authenticated: true,
      data: {
        user: {
          id: user.userid,
          username: user.username,
          email: user.email,
          firstName: user.firstname,
          lastName: user.lastname,
          role: user.role,
          emailVerified: user.emailverified,
          phoneVerified: user.phoneverified,
          isVerified: user.isverified,
          isActive: user.isactive
        }
      }
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(401).json({
      authenticated: false,
      message: 'Token verification failed'
    });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    console.log('👤 Get user profile for:', req.user.userId);

    const userResult = await database.query(`
      SELECT userid, username, email, firstname, lastname, phonenumber,
             dateofbirth, streetaddress, city, state, zipcode, country,
             role, emailverified, phoneverified, isverified, isactive,
             createdat
      FROM users
      WHERE userid = @userId
    `, { userId: req.user.userId });

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.userid,
          username: user.username,
          email: user.email,
          firstName: user.firstname,
          lastName: user.lastname,
          phoneNumber: user.phonenumber,
          dateOfBirth: user.dateofbirth,
          streetAddress: user.streetaddress,
          city: user.city,
          state: user.state,
          zipCode: user.zipcode,
          country: user.country,
          role: user.role,
          emailVerified: user.emailverified,
          phoneVerified: user.phoneverified,
          isVerified: user.isverified,
          isActive: user.isactive,
          createdAt: user.createdat
        }
      }
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  const requestId = crypto.randomUUID();
  
  try {
    console.log('🔐 Login attempt, requestId:', requestId);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required',
        requestId
      });
    }

    // Find user by email
    const userResult = await database.query(`
      SELECT userid, username, email, passwordhash, firstname, lastname,
             role, emailverified, phoneverified, isverified, isactive
      FROM users
      WHERE email = @email
    `, { email });

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        requestId
      });
    }

    const user = userResult.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordhash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        requestId
      });
    }

    // Check if user is active
    if (!user.isactive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        requestId
      });
    }

    // Generate JWT tokens
    const tokenPayload = {
      userId: user.userid,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '30d' });
    const sessionId = crypto.randomUUID();

    console.log('✅ Login successful for user:', user.username);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.userid,
          username: user.username,
          email: user.email,
          firstName: user.firstname,
          lastName: user.lastname,
          role: user.role,
          emailVerified: user.emailverified,
          phoneVerified: user.phoneverified,
          isVerified: user.isverified,
          isActive: user.isactive
        },
        tokens: {
          accessToken,
          refreshToken,
          sessionId
        }
      },
      requestId
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      requestId
    });
  }
});

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Token refresh request');
    
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      // Generate new tokens
      const tokenPayload = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      };

      const newAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '15m' });
      const newRefreshToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '30d' });

      console.log('✅ Token refresh successful for user:', decoded.username);

      res.status(200).json({
        success: true,
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          }
        }
      });

    } catch (jwtError) {
      console.log('❌ Invalid refresh token:', jwtError.message);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', async (req, res) => {
  try {
    console.log('👋 Logout request');
    
    // For now, just return success since we're using stateless JWT
    // In a full implementation, you might want to blacklist the token
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// POST /api/auth/verify-email - Verify email with code
router.post('/verify-email', async (req, res) => {
  try {
    console.log('📧 Email verification request');
    
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token required'
      });
    }

    // For development: accept "test123" as valid code for any user
    if (token === 'test123') {
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {
          isVerified: true,
          canAccessSite: true
        }
      });
    }

    // TODO: Implement real email verification lookup
    // For now, return error for invalid codes
    res.status(400).json({
      success: false,
      message: 'Invalid verification code'
    });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
});

// POST /api/auth/verify-phone - Verify phone with code
router.post('/verify-phone', async (req, res) => {
  try {
    console.log('📱 Phone verification request');
    
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code required'
      });
    }

    // For development: accept "123456" as valid code for any user
    if (code === '123456') {
      return res.status(200).json({
        success: true,
        message: 'Phone verified successfully',
        data: {
          isVerified: true,
          canAccessSite: true,
          fullyVerified: true
        }
      });
    }

    // TODO: Implement real SMS verification lookup
    // For now, return error for invalid codes
    res.status(400).json({
      success: false,
      message: 'Invalid verification code'
    });

  } catch (error) {
    console.error('❌ Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Phone verification failed'
    });
  }
});

// POST /api/auth/resend-email-verification - Resend email verification
router.post('/resend-email-verification', async (req, res) => {
  try {
    console.log('🔄 Resend email verification request');
    
    // For development: simulate email sent
    res.status(200).json({
      success: true,
      message: 'Verification email sent (Development: use code "test123")'
    });

  } catch (error) {
    console.error('❌ Resend email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
});

// POST /api/auth/resend-sms-verification - Resend SMS verification
router.post('/resend-sms-verification', async (req, res) => {
  try {
    console.log('🔄 Resend SMS verification request');
    
    // For development: simulate SMS sent
    res.status(200).json({
      success: true,
      message: 'Verification SMS sent (Development: use code "123456")'
    });

  } catch (error) {
    console.error('❌ Resend SMS verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification SMS'
    });
  }
});

console.log('✅ Auth-rebuild: Module loaded successfully');
module.exports = router;