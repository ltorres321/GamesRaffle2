#!/usr/bin/env node

/**
 * Add Credits to User - For Testing Game Play
 * Usage: node scripts/addUserCredits.js <email> <amount>
 * Example: node scripts/addUserCredits.js ltorres321@gmail.com 1000
 */

require('dotenv').config({ path: '.env.local', override: true });
require('dotenv').config();

const database = require('../src/config/database');

async function addUserCredits(email, creditAmount) {
  if (!email || !creditAmount) {
    console.error('❌ Error: Email and credit amount are required');
    console.log('Usage: node scripts/addUserCredits.js <email> <amount>');
    console.log('Example: node scripts/addUserCredits.js ltorres321@gmail.com 1000');
    process.exit(1);
  }

  try {
    // Initialize database connection
    console.log('🔌 Connecting to database...');
    await database.initialize();

    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Check if user exists
    const userResult = await database.query(`
      SELECT UserId, Username, Email, FirstName, LastName, CreatedAt
      FROM Users 
      WHERE Email = @email
    `, { email });

    if (userResult.recordset.length === 0) {
      console.log(`❌ No user found with email: ${email}`);
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

    // Add Credits column to Users table if it doesn't exist
    try {
      await database.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                      WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'Credits')
        BEGIN
          ALTER TABLE Users ADD Credits DECIMAL(10,2) NOT NULL DEFAULT 0.00
        END
      `);
      console.log('✅ Credits column verified/added to Users table');
    } catch (error) {
      console.log('ℹ️  Credits column may already exist:', error.message);
    }

    // Update user credits
    console.log(`💰 Adding $${creditAmount} credits to user...`);
    
    const updateResult = await database.query(`
      UPDATE Users 
      SET Credits = Credits + @creditAmount,
          UpdatedAt = GETUTCDATE()
      OUTPUT INSERTED.Credits
      WHERE UserId = @userId
    `, { 
      userId: user.UserId, 
      creditAmount: parseFloat(creditAmount) 
    });

    const newBalance = updateResult.recordset[0].Credits;
    
    console.log(`✅ Successfully added $${creditAmount} to ${user.Email}`);
    console.log(`💰 New balance: $${newBalance}`);
    console.log(`🎮 User is now ready to play games!`);
    
  } catch (error) {
    console.error('❌ Error adding credits:', error.message);
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
const creditAmount = process.argv[3];
addUserCredits(email, creditAmount);