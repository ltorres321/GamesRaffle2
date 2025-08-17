const express = require('express');
const bcrypt = require('bcrypt');
const database = require('../config/database');
const crypto = require('crypto');
const router = express.Router();

console.log('🔧 Auth-rebuild: Starting module load');

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

// Registration endpoint with database integration
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
      SELECT id FROM users
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

    // Test database schema first
    console.log('🔍 Testing database schema...');
    
    try {
      const schemaTest = await database.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users'
        LIMIT 5
      `);
      console.log('📋 Database schema sample:', schemaTest.rows);
    } catch (schemaError) {
      console.log('⚠️ Schema check failed:', schemaError.message);
    }

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
      RETURNING id
    `, {
      username, email, passwordHash, firstName, lastName,
      dateOfBirth, phoneNumber, streetAddress, city, state, zipCode, country
    });

    const newUserId = result.rows[0].id;
    console.log('✅ User created successfully with ID:', newUserId);

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
          isActive: true
        }
      },
      requestId
    });

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