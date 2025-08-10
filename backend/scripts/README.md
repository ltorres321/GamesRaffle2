# Backend Scripts

This directory contains utility scripts for development and testing.

## Delete User Script

### Purpose
The `deleteUser.js` script allows you to delete a user from the database by email address. This is useful for testing email registration repeatedly during development.

### Usage

```bash
cd backend
node scripts/deleteUser.js <email>
```

### Examples

```bash
# Delete user with specific email
node scripts/deleteUser.js ltorres321@gmail.com

# Delete user with different email
node scripts/deleteUser.js test@example.com
```

### What it does

1. **Finds the user** by email address
2. **Shows user details** before deletion (ID, username, name, created date)
3. **Deletes related data** in the correct order:
   - User sessions
   - Refresh tokens
   - User picks
   - Game participations
   - User verifications
4. **Deletes the user record** itself
5. **Confirms deletion** - you can now register with that email again

### Safety Features

- **Validation**: Requires email parameter
- **Confirmation**: Shows user details before deletion
- **Graceful handling**: Handles cases where user doesn't exist
- **Foreign key safety**: Deletes related records in correct order
- **Database cleanup**: Properly closes database connection

### Example Output

```
🔍 Looking for user with email: ltorres321@gmail.com
📋 Found user: {
  id: '7F58EB25-E007-465A-9AF4-E4AE55BE71EF',
  username: 'ltorres321',
  email: 'ltorres321@gmail.com',
  name: 'Leandro Torres',
  created: 2025-08-10T14:06:03.543Z
}
🗑️  Deleting user sessions...
🗑️  Deleting refresh tokens...
🗑️  Deleting user picks...
🗑️  Deleting user game participations...
🗑️  Deleting user verifications...
🗑️  Deleting user record...
✅ Successfully deleted user: ltorres321@gmail.com
🎯 You can now register with this email again!
```

### Error Handling

- **Missing email**: Shows usage instructions
- **User not found**: Shows informational message
- **Database errors**: Shows detailed error with stack trace
- **Connection cleanup**: Always attempts to close database connection

### Development Workflow

1. **Register with your email** to test registration
2. **Test features** (email verification, SMS, etc.)
3. **Delete user** when you want to test registration again:
   ```bash
   node scripts/deleteUser.js your.email@gmail.com
   ```
4. **Register again** with the same email

This allows continuous testing without needing multiple email addresses.