# 🚀 Railway Fixes Action Plan

## 🔴 What YOU Need to Do in Railway Dashboard:

### 1. **Fix Database Connection (CRITICAL)**
In your Backend service variables, change:
```
DATABASE_URL="${{Postgres.DATABASE_URL}}"
```
To:
```
DATABASE_URL="${{Postgres.DATABASE_PUBLIC_URL}}?connection_limit=5&pool_timeout=10"
```

### 2. **Add Missing Environment Variable**
Add this to Backend service:
```
API_TIMEOUT="60000"
```

### 3. **After Changes:**
- Railway will auto-redeploy
- Wait 2-3 minutes for deployment

## 🟢 What I'll Fix in Code:

### 1. **Add Mock Products Cleanup Button**
- Add button to admin UI
- Connect to `/api/cleanup/mock-products`

### 2. **Fix Products Refresh**
- Force data refresh after mutations
- Add loading states

### 3. **Increase Upload Timeout**
- Change from 10s to 60s
- Add retry logic

### 4. **Disable WebSocket in Production**
- Prevent constant reconnection errors
- Use polling instead

## 📋 Order of Operations:

1. **YOU:** Update DATABASE_URL in Railway (1 minute)
2. **YOU:** Add API_TIMEOUT variable (30 seconds)
3. **Wait:** For Railway redeploy (2-3 minutes)
4. **ME:** Fix the code issues (5 minutes)
5. **YOU:** Test mock products removal
6. **YOU:** Test image upload

## 🎯 Expected Results:

✅ Mock products can be removed with new button
✅ Products appear without manual refresh
✅ Image uploads work without timeout
✅ No more WebSocket errors in console
✅ Database connections stable

Ready to proceed? Start with the Railway dashboard changes, then I'll fix the code.