-- Cleanup Script: Remove All Test Users and Dependent Records
-- This script safely removes test users created during migration testing
-- Run this in Supabase SQL Editor or via database admin tools

BEGIN;

-- Step 1: Identify test users (created during our testing)
-- Test users have patterns like: testuser%, simpletest%, paramtest%, debuguser%, tokentest%, fulltest%

-- Step 2: Delete dependent records first (to avoid foreign key constraint errors)

-- Delete verification codes for test users
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
);

-- Delete user sessions for test users
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
);

-- Delete user picks for test users
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
);

-- Delete contest participants for test users
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
);

-- Delete contests created by test users (as commissioners)
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
);

-- Step 3: Finally, delete the test users themselves
DELETE FROM users 
WHERE username LIKE 'testuser%' 
   OR username LIKE 'simpletest%' 
   OR username LIKE 'paramtest%' 
   OR username LIKE 'debuguser%' 
   OR username LIKE 'tokentest%' 
   OR username LIKE 'fulltest%'
   OR email LIKE '%@example.com'
   OR email LIKE '%test%@%';

-- Get count of affected records
SELECT 
    (SELECT COUNT(*) FROM users) as remaining_users,
    'Test users and dependent records cleaned up successfully!' as status;

COMMIT;

-- Optional: Show remaining users to verify cleanup
-- SELECT username, email, createdat FROM users ORDER BY createdat DESC LIMIT 10;