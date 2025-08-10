# Backend Scripts

This directory contains utility scripts for development and testing.

## Available Scripts

### 1. Delete User Script (`deleteUser.js`)
### 2. Add User Credits Script (`addUserCredits.js`)

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
   - Player picks (PlayerPicks table)
   - Game participations (SurvivorGamePlayers table)
   - Game history (GameHistory table)
   - User verifications (UserVerification table)
   - Survivor games created by user (SurvivorGames table)
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

## Add User Credits Script

### Purpose
The `addUserCredits.js` script allows you to add credits to any user account for testing game play functionality.

### Usage

```bash
cd backend
node scripts/addUserCredits.js <email> <amount>
```

### Examples

```bash
# Add $1000 to user for game testing
node scripts/addUserCredits.js ltorres321@gmail.com 1000

# Add $500 to different user
node scripts/addUserCredits.js test@example.com 500

# Add $50 for smaller test
node scripts/addUserCredits.js user@test.com 50
```

### What it does

1. **Finds the user** by email address
2. **Shows user details** before adding credits
3. **Adds Credits column** to Users table if it doesn't exist
4. **Updates user balance** by adding the specified amount
5. **Shows new balance** after credit addition

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
✅ Credits column verified/added to Users table
💰 Adding $1000 credits to user...
✅ Successfully added $1000 to ltorres321@gmail.com
💰 New balance: $1000
🎮 User is now ready to play games!
```

### Safety Features

- **Validation**: Requires both email and amount parameters
- **User verification**: Confirms user exists before adding credits
- **Database schema**: Automatically creates Credits column if needed
- **Error handling**: Graceful handling of database errors
- **Connection cleanup**: Properly closes database connection

### Game Testing Workflow

1. **Register a user** and verify email
2. **Add credits** for testing:
   ```bash
   node scripts/addUserCredits.js your.email@gmail.com 1000
   ```
3. **Test game play** with sufficient balance
4. **Delete user** when done testing:
   ```bash
   node scripts/deleteUser.js your.email@gmail.com
   ```
5. **Repeat** as needed for testing

This allows testing the complete game flow with realistic user balances.