# Test Users Cleanup - Simple Instructions

## Corrected SQL Script

Use the file: `database/cleanup-test-users-corrected.sql`

This script is corrected based on your actual Supabase database schema.

## How to Run

1. **Go to Supabase Dashboard**
2. **Click "SQL Editor"** 
3. **Copy the entire contents** of `cleanup-test-users-corrected.sql`
4. **Paste and click "Run"**

## What It Cleans

The script removes test users matching these patterns:
- `testuser%` 
- `simpletest%`
- `paramtest%` 
- `debuguser%`
- `tokentest%`
- `fulltest%`
- `%@example.com` emails
- `%test%@%` emails

## Tables Cleaned (in correct order)

1. `verificationcodes` - verification codes for test users
2. `usersessions` - authentication sessions for test users  
3. `playerpicks` - picks made by test users
4. `survivorgameplayers` - test users' game participations
5. `survivorgames` - games created by test users
6. `users` - finally, the test users themselves

## Safety

- Only removes test users (specific patterns)
- Uses transaction (BEGIN/COMMIT) for safety
- Shows results after completion
- Won't affect real production users

## After Running

The script will show:
- Total remaining users count
- Success message

That's it! Simple one-time cleanup.