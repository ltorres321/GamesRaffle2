# GitHub Codespaces Setup Guide

## Current Issue: Frontend Can't Connect to Backend

The "Failed to fetch" error occurs because the frontend is trying to connect to an old/expired GitHub Codespaces URL.

## Solution Options

### Option 1: Get Current Codespaces URL (Recommended)

1. **Find your current Codespaces URL:**
   - In VS Code, look at the bottom panel
   - Click on **"PORTS"** tab (next to TERMINAL)
   - Find **port 8000** - copy the URL shown (it will be like `https://something-8000.app.github.dev`)

2. **Update frontend configuration:**
   - Edit `frontend/.env.local`
   - Replace the `NEXT_PUBLIC_API_URL` line with your current URL:
   ```
   NEXT_PUBLIC_API_URL=https://your-actual-codespace-name-8000.app.github.dev
   ```

3. **Restart frontend:** (if it's running)
   ```bash
   # Stop frontend if running (Ctrl+C)
   cd frontend
   npm run dev
   ```

### Option 2: Use Local Port Forwarding

If you prefer to use localhost:

1. **Make sure backend is running:** (which it is from your logs)
   ```bash
   cd backend
   npm start
   ```

2. **In VS Code Ports tab:**
   - Find port 8000
   - Right-click and select **"Port Visibility" → "Public"**
   - This makes the port accessible

3. **Frontend should work with localhost URL** (already set in `.env.local`)

## Testing the Fix

1. **Start/restart frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Try registration again** - should now work without "Failed to fetch" error

## Quick Debug

If still having issues, you can test the backend directly:
- Visit your backend health endpoint: `https://your-codespace-url-8000.app.github.dev/health`
- Should return JSON with status information

## Current Status

✅ **Backend:** Running on port 8000  
✅ **Database:** Connected successfully  
✅ **Email/SMS:** Services initialized  
🔄 **Frontend:** Needs correct backend URL  

Once the URL is fixed, registration should work perfectly!