-- Corrected Cleanup Script: Remove All Test Users and Dependent Records
-- Based on actual database schema shown in Supabase
-- Run this in Supabase SQL Editor

BEGIN;

-- Step 1: Delete verification codes for test users
DELETE FROM verificationcodes 
WHERE userid IN (
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

-- Step 2: Delete user sessions for test users  
DELETE FROM usersessions 
WHERE userid IN (
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

-- Step 3: Delete player picks for test users
DELETE FROM playerpicks 
WHERE playerid IN (
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

-- Step 4: Delete survivor game players (participants) for test users
DELETE FROM survivorgameplayers 
WHERE playerid IN (
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

-- Step 5: Delete survivor games created by test users (as commissioners)
DELETE FROM survivorgames 
WHERE commissionerid IN (
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

-- Step 6: Finally, delete the test users themselves
DELETE FROM users 
WHERE username LIKE 'testuser%' 
   OR username LIKE 'simpletest%' 
   OR username LIKE 'paramtest%' 
   OR username LIKE 'debuguser%' 
   OR username LIKE 'tokentest%' 
   OR username LIKE 'fulltest%'
   OR email LIKE '%@example.com'
   OR email LIKE '%test%@%';

-- Show results
SELECT 
    (SELECT COUNT(*) FROM users) as remaining_users_total,
    'Test users and dependent records cleaned up successfully!' as status;

COMMIT;

-- Optional: Show remaining users to verify cleanup
-- SELECT username, email, createdat FROM users ORDER BY createdat DESC LIMIT 10;