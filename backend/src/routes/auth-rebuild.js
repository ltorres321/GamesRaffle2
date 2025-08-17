const express = require('express');
const bcrypt = require('bcrypt');
const database = require('../config/database');
const crypto = require('crypto');
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

console.log('✅ Auth-rebuild: Module loaded successfully');
module.exports = router;