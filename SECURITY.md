# Security Guidelines

## 🔒 Environment Variables

This project uses environment variables to securely store sensitive information like database credentials and API keys.

### Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values:**
   ```bash
   # Edit .env with your actual credentials
   nano .env
   ```

3. **Never commit .env files:**
   - The `.env` file is already in `.gitignore`
   - Only commit `.env.example` with placeholder values

### Required Environment Variables

- `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (admin operations)
- `DATABASE_URL` - PostgreSQL connection string for scripts
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Database Scripts

All database scripts now use the `DATABASE_URL` environment variable instead of hardcoded credentials.

To run scripts:
```bash
# Make sure .env file exists with DATABASE_URL
node scripts/setup-email-notifications.js
```

## 🚨 Security Incident Response

If credentials are accidentally committed:

1. **Immediately rotate all exposed credentials**
2. **Remove from git history using git-filter-repo or BFG**
3. **Update all systems using the old credentials**
4. **Review access logs for unauthorized usage**

## 📝 Best Practices

- ✅ Use environment variables for all sensitive data
- ✅ Keep `.env` files local and never commit them
- ✅ Regularly rotate API keys and passwords
- ✅ Use principle of least privilege for database access
- ✅ Monitor for credential exposure with tools like GitGuardian
- ❌ Never hardcode credentials in source code
- ❌ Never commit `.env` files to version control
- ❌ Never share credentials in chat or email
