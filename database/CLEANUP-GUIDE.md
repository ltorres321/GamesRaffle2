# Test Users Cleanup Guide

This guide provides multiple methods to clean up all test users created during migration testing and their dependent records.

## Overview

During the migration testing, we created several test users with patterns like:
- `testuser%`, `testuser2`, etc.
- `simpletest%`
- `paramtest%` 
- `debuguser%`
- `tokentest_%`
- `fulltest_%`
- Any email with `@example.com` or containing `test`

These users have dependent records in multiple tables that need to be cleaned up in the correct order to avoid foreign key constraint errors.

## Method 1: Direct SQL Script (Recommended)

### Using Supabase SQL Editor:
1. Go to your Supabase dashboard
2. Navigate to "SQL Editor"
3. Open the file: `database/cleanup-test-users.sql`
4. Copy and paste the entire script
5. Click "Run" to execute

### Using psql or other database tools:
```bash
psql "your-supabase-connection-string" -f database/cleanup-test-users.sql
```

## Method 2: API Endpoints

We've created backend API endpoints for programmatic cleanup:

### List Test Users (Before Cleanup)
```bash
curl -X GET https://gamesraffle2.onrender.com/api/cleanup/list-test-users
```

### Cleanup All Test Users
```bash
curl -X POST https://gamesraffle2.onrender.com/api/cleanup/cleanup-test-users
```

**Example Response:**
```json
{
  "success": true,
  "message": "Test users cleanup completed successfully",
  "details": {
    "testUsersDeleted": 8,
    "verificationCodesDeleted": 0,
    "sessionsDeleted": 0,
    "picksDeleted": 0,
    "participantsDeleted": 0,
    "contestsDeleted": 0,
    "remainingUsers": 0
  }
}
```

## Cleanup Order (Automatic)

Both methods follow the correct cleanup order to avoid foreign key constraint errors:

1. **verification_codes** - Email/phone verification codes
2. **user_sessions** - Authentication sessions  
3. **user_picks** - Contest picks made by test users
4. **contest_participants** - Contest participation records
5. **contests** - Contests created by test users (as commissioners)
6. **users** - Finally, the test users themselves

## Safety Features

- **Pattern Matching**: Only removes users matching specific test patterns
- **Transactional**: SQL script uses BEGIN/COMMIT for rollback safety
- **Verification**: List endpoint shows what will be deleted before cleanup
- **Detailed Logging**: API endpoints provide detailed cleanup statistics

## Test User Patterns Cleaned Up

The cleanup targets these specific patterns:
- Username: `testuser%`, `simpletest%`, `paramtest%`, `debuguser%`, `tokentest_%`, `fulltest_%`
- Email: `%@example.com`, `%test%@%`

## Verification After Cleanup

### Check remaining users:
```sql
SELECT username, email, createdat FROM users ORDER BY createdat DESC LIMIT 10;
```

### Count total users:
```sql
SELECT COUNT(*) as total_users FROM users;
```

## Production Safety

- **No Production Impact**: Only removes test users, never production users
- **Pattern-Based**: Uses specific patterns that won't match real user data
- **Reversible**: Keep backups if you need to restore test data

## When to Use

Run cleanup when:
- ✅ Migration testing is complete
- ✅ Authentication endpoints are working correctly  
- ✅ You want to clean up test data before production use
- ✅ Database is cluttered with test users

## Files Created

- `database/cleanup-test-users.sql` - Direct SQL cleanup script
- `backend/src/routes/cleanup.js` - API cleanup endpoints
- `database/CLEANUP-GUIDE.md` - This guide

## API Endpoints Available

- `GET /api/cleanup/list-test-users` - List all test users
- `POST /api/cleanup/cleanup-test-users` - Delete all test users and dependencies

Both endpoints return detailed information about the cleanup process.