#!/usr/bin/env node

/**
 * Debug Login Issues - Check user existence and password verification
 * Usage: node scripts/debugLogin.js <email> <password>
 * Example: node scripts/debugLogin.js ltorres321@gmail.com mypassword123
 */

require('dotenv').config({ path: '.env.local', override: true });
require('dotenv').config();

const database = require('../src/config/database');
const { authService } = require('../src/middleware/auth');

async function debugLogin(email, password) {
  if (!email || !password) {
    console.error('❌ Error: Email and password are required');
    console.log('Usage: node scripts/debugLogin.js <email> <password>');
    console.log('Example: node scripts/debugLogin.js ltorres321@gmail.com mypassword123');
    process.exit(1);
  }

  try {
    // Initialize database connection
    console.log('🔌 Connecting to database...');
    await database.initialize();

    console.log(`🔍 Debugging login for: ${email}`);
    console.log(`📝 Password provided: ${password.replace(/./g, '*')}`);
    console.log('');

    // Step 1: Check if user exists
    console.log('Step 1: Checking if user exists...');
    const userResult = await database.query(`
      SELECT UserId, Email, Username, PasswordHash, FirstName, LastName, 
             Role, IsVerified, IsActive, CreatedAt, LastLoginAt,
             EmailVerified, PhoneVerified
      FROM Users 
      WHERE Email = @email
    `, { email });

    if (userResult.recordset.length === 0) {
      console.log('❌ USER NOT FOUND');
      console.log('   This email is not registered in the database.');
      console.log('   Please check the email or register a new account.');
      process.exit(0);
    }

    const user = userResult.recordset[0];
    console.log('✅ USER FOUND');
    console.log(`   User ID: ${user.UserId}`);
    console.log(`   Username: ${user.Username}`);
    console.log(`   Email: ${user.Email}`);
    console.log(`   Name: ${user.FirstName} ${user.LastName}`);
    console.log(`   Role: ${user.Role}`);
    console.log(`   Account Active: ${user.IsActive ? 'Yes' : 'No'}`);
    console.log(`   Email Verified: ${user.EmailVerified ? 'Yes' : 'No'}`);
    console.log(`   Phone Verified: ${user.PhoneVerified ? 'Yes' : 'No'}`);
    console.log(`   Fully Verified: ${user.IsVerified ? 'Yes' : 'No'}`);
    console.log(`   Created: ${user.CreatedAt}`);
    console.log(`   Last Login: ${user.LastLoginAt || 'Never'}`);
    console.log('');

    // Step 2: Check if account is active
    console.log('Step 2: Checking account status...');
    if (!user.IsActive) {
      console.log('❌ ACCOUNT DEACTIVATED');
      console.log('   This account has been deactivated.');
      process.exit(0);
    }
    console.log('✅ ACCOUNT IS ACTIVE');
    console.log('');

    // Step 3: Check password hash format
    console.log('Step 3: Checking password hash...');
    if (!user.PasswordHash) {
      console.log('❌ NO PASSWORD HASH');
      console.log('   User has no password set.');
      process.exit(0);
    }
    
    console.log('✅ PASSWORD HASH EXISTS');
    console.log(`   Hash length: ${user.PasswordHash.length} characters`);
    console.log(`   Hash format: ${user.PasswordHash.substring(0, 7)}... (bcrypt format)`);
    console.log('');

    // Step 4: Test password verification
    console.log('Step 4: Testing password verification...');
    try {
      const isValidPassword = await authService.comparePassword(password, user.PasswordHash);
      
      if (isValidPassword) {
        console.log('✅ PASSWORD MATCHES');
        console.log('   The provided password is correct!');
        console.log('   Login should work. If it doesn\'t, check:');
        console.log('   - Frontend/backend connectivity');
        console.log('   - CORS configuration');
        console.log('   - API endpoint URL');
      } else {
        console.log('❌ PASSWORD DOES NOT MATCH');
        console.log('   The provided password is incorrect.');
        console.log('   Possible solutions:');
        console.log('   - Double-check the password you\'re typing');
        console.log('   - Try resetting the password');
        console.log('   - Check if caps lock is on');
        console.log('   - Verify there are no extra spaces');
      }
    } catch (error) {
      console.log('❌ PASSWORD VERIFICATION ERROR');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');

    // Step 5: Additional debugging info
    console.log('Step 5: Additional debugging info...');
    
    // Check for refresh tokens
    if (user.RefreshToken) {
      console.log('ℹ️  User has active refresh token (previous login session exists)');
    }
    
    // Show verification status
    if (!user.EmailVerified || !user.PhoneVerified) {
      console.log('⚠️  User is not fully verified but can still login with limited access');
    }

    console.log('');
    console.log('🔧 DEBUG SUMMARY:');
    console.log(`   Email exists: ${userResult.recordset.length > 0 ? 'Yes' : 'No'}`);
    console.log(`   Account active: ${user.IsActive ? 'Yes' : 'No'}`);
    console.log(`   Password hash exists: ${user.PasswordHash ? 'Yes' : 'No'}`);
    
    const passwordValid = await authService.comparePassword(password, user.PasswordHash);
    console.log(`   Password matches: ${passwordValid ? 'Yes' : 'No'}`);
    
    if (userResult.recordset.length > 0 && user.IsActive && user.PasswordHash && passwordValid) {
      console.log('');
      console.log('✅ LOGIN SHOULD WORK');
      console.log('   All conditions are met for successful login.');
      console.log('   If login still fails, check frontend/backend connectivity.');
    } else {
      console.log('');
      console.log('❌ LOGIN WILL FAIL');
      console.log('   One or more conditions are not met.');
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await database.close();
    } catch (err) {
      // Ignore close errors
    }
  }
}

// Get parameters from command line arguments
const email = process.argv[2];
const password = process.argv[3];
debugLogin(email, password);