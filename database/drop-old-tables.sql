-- Drop Old Tables Script - Handles Dependencies Correctly
-- Run this in Supabase SQL Editor to clean up old tables

-- Method 1: Drop with CASCADE (removes all dependencies automatically)
-- This is the easiest and safest approach

DROP TABLE IF EXISTS user_picks CASCADE;
DROP TABLE IF EXISTS contest_participants CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS contests CASCADE;
DROP TABLE IF EXISTS nfl_games CASCADE;
DROP TABLE IF EXISTS nfl_teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Alternative Method 2: Manual dependency order (if Method 1 doesn't work)
-- Uncomment these lines if you prefer manual control:

-- -- Drop dependent tables first (child tables)
-- DROP TABLE IF EXISTS user_picks;
-- DROP TABLE IF EXISTS contest_participants;
-- DROP TABLE IF EXISTS user_sessions;  
-- DROP TABLE IF EXISTS verification_codes;
-- 
-- -- Drop tables with fewer dependencies
-- DROP TABLE IF EXISTS nfl_games;
-- DROP TABLE IF EXISTS contests;
-- 
-- -- Drop parent tables last
-- DROP TABLE IF EXISTS nfl_teams;
-- DROP TABLE IF EXISTS users;

-- Drop any remaining sequences or other objects
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS contests_id_seq CASCADE;
DROP SEQUENCE IF EXISTS nfl_teams_id_seq CASCADE;
DROP SEQUENCE IF EXISTS nfl_games_id_seq CASCADE;

-- Clean up any remaining indexes (they should be dropped automatically, but just in case)
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_contests_commissioner;
DROP INDEX IF EXISTS idx_contest_participants_contest;
DROP INDEX IF EXISTS idx_contest_participants_user;
DROP INDEX IF EXISTS idx_nfl_games_week_season;
DROP INDEX IF EXISTS idx_nfl_games_date;
DROP INDEX IF EXISTS idx_user_picks_contest_user;
DROP INDEX IF EXISTS idx_user_picks_week_season;
DROP INDEX IF EXISTS idx_user_sessions_user;
DROP INDEX IF EXISTS idx_user_sessions_token;
DROP INDEX IF EXISTS idx_verification_codes_user;

SELECT 'Old tables dropped successfully! Ready for backend-compatible migration.' as status;