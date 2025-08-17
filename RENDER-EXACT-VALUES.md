# 🎯 EXACT Environment Variables for Render

## ✅ Here are the REAL values from your Azure backend (.env file):

**Copy and paste these EXACT values into Render:**

### Environment Variables for Render:

```bash
Name: NODE_ENV
Value: production

Name: PORT
Value: 8000

Name: JWT_SECRET
Value: 83548a67ee6226b675a1ef152dab664e6c4857bca6c666bdc3b6d64ef6fa9663

Name: SESSION_SECRET
Value: aabfef2273c71e4d4948adbfaee91fc4a17de9d795002bceadb82b5dededa778

Name: SQL_CONNECTION_STRING
Value: postgresql://postgres:SurvivorApp2024!@db.pcqwodmgcstlburfpwfy.supabase.co:5432/postgres

Name: USE_MEMORY_CACHE
Value: true

Name: REDIS_ENABLED
Value: false

Name: CORS_ORIGINS
Value: https://red-hill-054635e0f.1.azurestaticapps.net,https://placeholder-netlify.netlify.app

Name: EMAIL_ENABLED
Value: true

Name: EMAIL_PROVIDER
Value: gmail

Name: GMAIL_USER
Value: ltorres321@gmail.com

Name: GMAIL_APP_PASSWORD
Value: julpffmvigthdspx

Name: SMS_ENABLED
Value: false
```

## 🔍 Where These Values Came From:

**JWT_SECRET & SESSION_SECRET**: The REAL Azure production values you provided
- These are the ACTUAL secrets your Azure backend uses in production
- Using these exact values ensures ALL existing user tokens continue working seamlessly

**SQL_CONNECTION_STRING**: Your Supabase PostgreSQL database connection 
- Already configured with your database password: `SurvivorApp2024!`

**CORS_ORIGINS**: Your real Azure URL + placeholder for Netlify
- `https://red-hill-054635e0f.1.azurestaticapps.net` - Your CURRENT Azure frontend
- `https://placeholder-netlify.netlify.app` - Placeholder you'll replace in Step 3 with your actual Netlify URL
- You don't need to know your Netlify name yet - that comes when you create it

## 🚨 CRITICAL NOTES:

1. **These values MUST be exactly as shown** - any typos will break authentication
2. **Copy-paste each value** - don't try to type them manually
3. **Your Azure URL is correct**: `https://red-hill-054635e0f.1.azurestaticapps.net`
4. **Netlify part is just a placeholder** - you'll replace it in Step 3 when you create your Netlify app
5. **You don't need to know your Netlify app name yet**

## 🚀 Ready for Render Deployment!

Use these exact values in the Render environment variables section.