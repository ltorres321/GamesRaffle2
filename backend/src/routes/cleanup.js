const express = require('express');
const database = require('../config/database');
const router = express.Router();

console.log('🧹 Cleanup: Starting module load');

// Admin cleanup endpoint - removes all test users and dependent records
router.post('/cleanup-test-users', async (req, res) => {
  try {
    console.log('🧹 Starting test users cleanup...');
    
    // First, get count of test users before cleanup
    const beforeCount = await database.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE username LIKE 'testuser%' 
         OR username LIKE 'simpletest%' 
         OR username LIKE 'paramtest%' 
         OR username LIKE 'debuguser%' 
         OR username LIKE 'tokentest%' 
         OR username LIKE 'fulltest%'
         OR email LIKE '%@example.com'
         OR email LIKE '%test%@%'
    `);

    const testUsersCount = parseInt(beforeCount.rows[0].count);
    console.log(`📊 Found ${testUsersCount} test users to clean up`);

    if (testUsersCount === 0) {
      return res.status(200).json({
        success: true,
        message: 'No test users found to clean up',
        cleaned: 0
      });
    }

    // Step 1: Delete verification codes for test users
    console.log('🗑️ Deleting verification codes...');
    const cleanupVerification = await database.query(`
      DELETE FROM verification_codes 
      WHERE user_id IN (
          SELECT userid FROM users 
          WHERE username LIKE 'testuser%' 
             OR username LIKE 'simpletest%' 
             OR username LIKE 'paramtest%' 
             OR username LIKE 'debuguser%' 
             OR username LIKE 'tokentest%' 
             OR username LIKE 'fulltest%'
             OR email LIKE '%@example.com'
             OR email LIKE '%test%@%'
      )
    `);
    console.log(`✅ Deleted ${cleanupVerification.rowCount} verification codes`);

    // Step 2: Delete user sessions for test users
    console.log('🗑️ Deleting user sessions...');
    const cleanupSessions = await database.query(`
      DELETE FROM user_sessions 
      WHERE user_id IN (
          SELECT userid FROM users 
          WHERE username LIKE 'testuser%' 
             OR username LIKE 'simpletest%' 
             OR username LIKE 'paramtest%' 
             OR username LIKE 'debuguser%' 
             OR username LIKE 'tokentest%' 
             OR username LIKE 'fulltest%'
             OR email LIKE '%@example.com'
             OR email LIKE '%test%@%'
      )
    `);
    console.log(`✅ Deleted ${cleanupSessions.rowCount} user sessions`);

    // Step 3: Delete user picks for test users
    console.log('🗑️ Deleting user picks...');
    const cleanupPicks = await database.query(`
      DELETE FROM user_picks 
      WHERE user_id IN (
          SELECT userid FROM users 
          WHERE username LIKE 'testuser%' 
             OR username LIKE 'simpletest%' 
             OR username LIKE 'paramtest%' 
             OR username LIKE 'debuguser%' 
             OR username LIKE 'tokentest%' 
             OR username LIKE 'fulltest%'
             OR email LIKE '%@example.com'
             OR email LIKE '%test%@%'
      )
    `);
    console.log(`✅ Deleted ${cleanupPicks.rowCount} user picks`);

    // Step 4: Delete contest participants for test users
    console.log('🗑️ Deleting contest participants...');
    const cleanupParticipants = await database.query(`
      DELETE FROM contest_participants 
      WHERE user_id IN (
          SELECT userid FROM users 
          WHERE username LIKE 'testuser%' 
             OR username LIKE 'simpletest%' 
             OR username LIKE 'paramtest%' 
             OR username LIKE 'debuguser%' 
             OR username LIKE 'tokentest%' 
             OR username LIKE 'fulltest%'
             OR email LIKE '%@example.com'
             OR email LIKE '%test%@%'
      )
    `);
    console.log(`✅ Deleted ${cleanupParticipants.rowCount} contest participants`);

    // Step 5: Delete contests created by test users
    console.log('🗑️ Deleting contests created by test users...');
    const cleanupContests = await database.query(`
      DELETE FROM contests 
      WHERE commissioner_id IN (
          SELECT userid FROM users 
          WHERE username LIKE 'testuser%' 
             OR username LIKE 'simpletest%' 
             OR username LIKE 'paramtest%' 
             OR username LIKE 'debuguser%' 
             OR username LIKE 'tokentest%' 
             OR username LIKE 'fulltest%'
             OR email LIKE '%@example.com'
             OR email LIKE '%test%@%'
      )
    `);
    console.log(`✅ Deleted ${cleanupContests.rowCount} contests`);

    // Step 6: Finally, delete the test users themselves
    console.log('🗑️ Deleting test users...');
    const cleanupUsers = await database.query(`
      DELETE FROM users 
      WHERE username LIKE 'testuser%' 
         OR username LIKE 'simpletest%' 
         OR username LIKE 'paramtest%' 
         OR username LIKE 'debuguser%' 
         OR username LIKE 'tokentest%' 
         OR username LIKE 'fulltest%'
         OR email LIKE '%@example.com'
         OR email LIKE '%test%@%'
    `);
    console.log(`✅ Deleted ${cleanupUsers.rowCount} test users`);

    // Get final count
    const afterCount = await database.query('SELECT COUNT(*) as count FROM users');
    const remainingUsers = parseInt(afterCount.rows[0].count);

    console.log('🎉 Cleanup completed successfully!');
    
    res.status(200).json({
      success: true,
      message: 'Test users cleanup completed successfully',
      details: {
        testUsersDeleted: cleanupUsers.rowCount,
        verificationCodesDeleted: cleanupVerification.rowCount,
        sessionsDeleted: cleanupSessions.rowCount,
        picksDeleted: cleanupPicks.rowCount,
        participantsDeleted: cleanupParticipants.rowCount,
        contestsDeleted: cleanupContests.rowCount,
        remainingUsers: remainingUsers
      }
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    });
  }
});

// List test users endpoint (for verification before cleanup)
router.get('/list-test-users', async (req, res) => {
  try {
    console.log('📋 Listing test users...');
    
    const testUsers = await database.query(`
      SELECT userid, username, email, createdat 
      FROM users 
      WHERE username LIKE 'testuser%' 
         OR username LIKE 'simpletest%' 
         OR username LIKE 'paramtest%' 
         OR username LIKE 'debuguser%' 
         OR username LIKE 'tokentest%' 
         OR username LIKE 'fulltest%'
         OR email LIKE '%@example.com'
         OR email LIKE '%test%@%'
      ORDER BY createdat DESC
    `);

    res.status(200).json({
      success: true,
      message: `Found ${testUsers.rows.length} test users`,
      testUsers: testUsers.rows
    });

  } catch (error) {
    console.error('❌ List test users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list test users',
      error: error.message
    });
  }
});

console.log('✅ Cleanup: Module loaded successfully');
module.exports = router;