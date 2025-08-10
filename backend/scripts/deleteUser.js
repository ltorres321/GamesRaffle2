#!/usr/bin/env node

/**
 * Delete User Script - For Testing Email Registration
 * Usage: node scripts/deleteUser.js <email>
 * Example: node scripts/deleteUser.js ltorres321@gmail.com
 */

require('dotenv').config({ path: '.env.local', override: true });
require('dotenv').config();

const database = require('../src/config/database');

async function deleteUser(email) {
  if (!email) {
    console.error('❌ Error: Email is required');
    console.log('Usage: node scripts/deleteUser.js <email>');
    console.log('Example: node scripts/deleteUser.js ltorres321@gmail.com');
    process.exit(1);
  }

  try {
    // Initialize database connection first
    console.log('🔌 Connecting to database...');
    await database.initialize();
    console.log('✅ Database connected successfully');

    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Check if user exists
    const userResult = await database.query(`
      SELECT UserId, Username, Email, FirstName, LastName, CreatedAt
      FROM Users 
      WHERE Email = @email
    `, { email });

    if (userResult.recordset.length === 0) {
      console.log(`ℹ️  No user found with email: ${email}`);
      process.exit(0);
    }

    const user = userResult.recordset[0];
    console.log(`📋 Found user:`, {
      id: user.UserId,
      username: user.Username,
      email: user.Email,
      name: `${user.FirstName} ${user.LastName}`,
      created: user.CreatedAt
    });

    // Delete related data first (foreign key constraints)
    // Based on actual database schema from create-schema-sportradar.sql
    
    console.log(`🗑️  Deleting user picks...`);
    await database.query(`
      DELETE FROM PlayerPicks WHERE PlayerId = @userId
    `, { userId: user.UserId });

    console.log(`🗑️  Deleting game participations...`);
    await database.query(`
      DELETE FROM SurvivorGamePlayers WHERE PlayerId = @userId
    `, { userId: user.UserId });

    console.log(`🗑️  Deleting game history...`);
    await database.query(`
      DELETE FROM GameHistory WHERE PlayerId = @userId
    `, { userId: user.UserId });

    console.log(`🗑️  Deleting user verifications...`);
    await database.query(`
      DELETE FROM UserVerification WHERE UserId = @userId
    `, { userId: user.UserId });

    console.log(`🗑️  Deleting survivor games created by user...`);
    await database.query(`
      DELETE FROM SurvivorGames WHERE CreatedByUserId = @userId
    `, { userId: user.UserId });

    // Finally delete the user
    console.log(`🗑️  Deleting user record...`);
    await database.query(`
      DELETE FROM Users WHERE UserId = @userId
    `, { userId: user.UserId });

    console.log(`✅ Successfully deleted user: ${email}`);
    console.log(`🎯 You can now register with this email again!`);
    
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
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

// Get email from command line arguments
const email = process.argv[2];
deleteUser(email);