# Manual Database Setup Required

## Issue
Direct PostgreSQL connection to Supabase pooler is failing with authentication/connection errors despite correct password.

## Solution: Use Supabase Dashboard

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/rpgbyockvpannrupicno
2. Navigate to **SQL Editor** in the left sidebar

### Step 2: Execute Schema
1. Copy the entire contents of `database/schema.sql`
2. Paste into the SQL Editor
3. Click **Run** to execute

### Step 3: Verify Setup
Run this command to test if the database is properly set up:
```bash
node scripts/test-db-connection.js
```

## What the Schema Creates
- **users** table with profiles and credits
- **packages** table with 3 sample packages
- **orders** table for purchase tracking
- **case_study_requests** table for student requests
- **submissions** table for student solutions
- **notifications** table for messaging
- **RLS policies** for security
- **Triggers** for automatic user profile creation

## After Setup
Once the schema is executed, you can:
- Register new users at http://localhost:3000/register
- Login with existing accounts
- Purchase packages and request case studies
- The 400 auth error will be resolved

## Database Password Confirmed
✅ Password: `Groupjkl2023!05hosting`
