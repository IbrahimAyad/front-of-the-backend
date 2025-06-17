# 🔒 KCT Security Setup Guide

## ⚠️ Critical Security Issue Resolved

**Status**: The exposed API keys have been removed from the repository and revoked.

### What was exposed:
- Google API Key
- OpenAI API Key  
- Database connection strings with credentials

### Actions taken:
1. ✅ Removed `.env` and `.env.local` files from git tracking
2. ✅ Committed the removal to prevent further exposure
3. ✅ API keys have been revoked (Google & OpenAI)
4. ✅ Created secure `.env.example` template

## 🔑 Setting Up New API Keys

### 1. OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy the key (starts with `sk-`)
4. Add to your `.env` file: `OPENAI_API_KEY="sk-your-new-key-here"`

### 2. Google API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable required APIs (if using Google services)
3. Create a new API key
4. Restrict the key to specific APIs and domains
5. Add to your `.env` file: `GOOGLE_API_KEY="your-new-google-key"`

### 3. Database Configuration
Update your `.env` file with your local database:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/kct_menswear"
```

### 4. JWT Secrets
Generate secure JWT secrets:
```bash
# Generate random secrets (run these commands)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to `.env`:
```bash
JWT_SECRET="your-generated-secret-here"
JWT_REFRESH_SECRET="your-generated-refresh-secret-here"
```

## 🛡️ Security Best Practices

### Environment Files
- ✅ `.env` files are in `.gitignore`
- ✅ Never commit actual secrets
- ✅ Use `.env.example` for documentation
- ✅ Different secrets for dev/staging/production

### API Key Security
- 🔄 **Rotate keys regularly** (every 90 days)
- 🔒 **Restrict API keys** to specific domains/IPs
- 📊 **Monitor usage** for unusual activity
- 🚫 **Never log API keys** in application logs

### Production Deployment
- Use environment variables in Railway/Vercel dashboards
- Never include secrets in `vercel.json` or `railway.toml`
- Use different keys for each environment

## 🚀 Quick Setup Commands

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   cp .env.example .env.local
   ```

2. **Update with your actual values:**
   ```bash
   # Edit .env with your editor
   nano .env
   ```

3. **Test the setup:**
   ```bash
   npm run start:dev
   ```

## 🔍 Verification Checklist

- [ ] New OpenAI API key created and added
- [ ] New Google API key created and added (if needed)
- [ ] JWT secrets generated and added
- [ ] Database URL configured
- [ ] All secrets are unique and secure
- [ ] `.env` files are not tracked by git
- [ ] Production environment variables are set in deployment platforms

## 🚨 If You Suspect Another Breach

1. **Immediate Actions:**
   - Revoke all API keys immediately
   - Change all passwords
   - Check access logs for unusual activity

2. **Investigation:**
   - Review git history: `git log --oneline -p | grep -i "api\|key\|secret"`
   - Check deployment logs
   - Review who has access to the repository

3. **Recovery:**
   - Generate new secrets
   - Update all environments
   - Monitor for suspicious activity

## 📞 Emergency Contacts

- **OpenAI Support**: [OpenAI Help Center](https://help.openai.com/)
- **Google Cloud Support**: [Google Cloud Support](https://cloud.google.com/support)
- **Repository Admin**: Check GitHub repository settings

---

**Remember**: Security is an ongoing process, not a one-time setup. Review and update regularly! 