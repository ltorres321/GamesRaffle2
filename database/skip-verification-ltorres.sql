-- Skip verification for user 'ltorres'
-- Run this directly in Supabase SQL Editor

-- First, check current user status
SELECT 
    userid, 
    username, 
    email, 
    emailverified, 
    phoneverified, 
    isverified,
    datecreated,
    datemodified
FROM public.users 
WHERE username = 'ltorres';

-- Update verification flags to true
UPDATE public.users 
SET 
    emailverified = true,
    phoneverified = true,
    isverified = true,
    datemodified = CURRENT_TIMESTAMP
WHERE username = 'ltorres';

-- Verify the update worked
SELECT 
    userid, 
    username, 
    email, 
    emailverified, 
    phoneverified, 
    isverified,
    datecreated,
    datemodified
FROM public.users 
WHERE username = 'ltorres';