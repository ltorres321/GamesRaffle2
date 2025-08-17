const express = require('express');
const bcrypt = require('bcrypt');
const database = require('../config/database');
const crypto = require('crypto');
const router = express.Router();

console.log('🔧 Auth-rebuild: Starting module load');

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

    // Insert user into database with PostgreSQL compatible syntax
    console.log('💾 Creating user in database...');
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