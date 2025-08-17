# 🚀 Immediate Next Steps After Supabase Project Creation

## 1. Get Your Connection String (First Priority)

After your `gamesraffle-db` project is created:

1. **Go to Project Settings** (⚙️ icon in left sidebar)
2. **Click "Database"** in the settings menu  
3. **Scroll down to "Connection String"** section
4. **Select "URI" tab** (not "Session mode" or "Transaction mode")
5. **Copy the connection string** - it will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres
   ```
6. **Replace `[YOUR-PASSWORD]` with:** `SurvivorApp2024!`

## 2. Update Your Environment Variables

**Open [`CUSTOM-MIGRATION-ENV.md`](CUSTOM-MIGRATION-ENV.md)** and replace:
```bash
SQL_CONNECTION_STRING=postgresql://[from-supabase-settings]
```

**With your actual connection string:**
```bash
SQL_CONNECTION_STRING=postgresql://postgres:SurvivorApp2024!@db.[your-project-ref].supabase.co:5432/postgres
```

## 3. Set Up Database Schema

**In Supabase dashboard:**
1. **Click "SQL Editor"** in left sidebar
2. **Click "New Query"**  
3. **Copy the entire contents** of [`database/migrate-to-postgresql.sql`](database/migrate-to-postgresql.sql)
4. **Paste into the query editor**
5. **Click "Run"** to create all your tables

## 4. Verify Database Setup

**Check these tables were created in "Table Editor":**
- `users` (with columns: id, email, phone, password, etc.)
- `games` 
- `contests`
- `entries`
- `picks`
- `leagues`

## ✅ Success Indicators

You'll know it worked when:
- ✅ Connection string copied and updated in environment variables
- ✅ Migration script ran without errors  
- ✅ All 6+ tables visible in Supabase Table Editor
- ✅ Database abstraction layer will auto-detect PostgreSQL

## 🚨 Common Issues

**If migration fails:**
- Check password in connection string matches: `SurvivorApp2024!`
- Make sure you selected "URI" tab (not Session mode)
- Verify all SQL was pasted completely

---

**After completing these steps, you're ready for Step 2: Render Backend Deployment!**