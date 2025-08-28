# Direct PostgreSQL Setup (Alternative to Manual Dashboard)

## Why PostgreSQL Direct Connection Failed

The connection string `postgresql://postgres.rpgbyockvpannrupicno:Groupjkl2023!05hosting@aws-1-eu-central-1.pooler.supabase.com:5432/postgres` is failing because:

1. **Pooler Authentication**: Supabase's pooler requires specific authentication format
2. **Password Encoding**: Special characters in password need proper encoding
3. **SSL Configuration**: Connection requires specific SSL settings

## Alternative Solutions

### Option 1: Use Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/rpgbyockvpannrupicno
2. SQL Editor → Paste schema from `database/schema.sql` → Run

### Option 2: Try Direct Connection with Different Format
```bash
# Try with URL-encoded password
PGPASSWORD="Groupjkl2023!05hosting" psql "postgresql://postgres.rpgbyockvpannrupicno@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require" -f database/schema.sql

# Or try with connection parameters
psql -h aws-1-eu-central-1.pooler.supabase.com \
     -p 5432 \
     -U postgres.rpgbyockvpannrupicno \
     -d postgres \
     -f database/schema.sql
```

### Option 3: Use Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref rpgbyockvpannrupicno

# Apply migrations
supabase db push
```

## Current Status
- ✅ App running on http://localhost:3000
- ✅ Supabase API keys configured
- ❌ Database schema not created (causing 400 auth errors)
- ❌ Direct PostgreSQL connection failing

## Quick Test
Run: `node scripts/test-db-connection.js` to verify if schema is set up.
