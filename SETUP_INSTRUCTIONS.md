# Supabase Database Setup Instructions

## Problem
The 400 Bad Request error occurs because the database schema hasn't been created in Supabase yet.

## Solution

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/rpgbyockvpannrupicno
2. Navigate to **SQL Editor** in the left sidebar

### Step 2: Run Database Schema
1. Copy the entire content from `database/schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

### Step 3: Verify Tables Created
After running the schema, you should see these tables in the **Table Editor**:
- `users`
- `packages` 
- `orders`
- `case_study_requests`
- `submissions`
- `notifications`

### Step 4: Test Authentication
1. Go to http://localhost:3000/register
2. Create a test account
3. Login should now work without 400 errors

### Step 5: Create Instructor Account
1. Register: `dozent@kraatz-club.de` / `Dozent123!`
2. In SQL Editor, run:
```sql
UPDATE public.users 
SET role = 'instructor' 
WHERE email = 'dozent@kraatz-club.de';
```

## Current Status
- ✅ Supabase API keys configured
- ❌ Database schema not created yet
- ❌ Authentication failing with 400 error

Once the schema is created, authentication will work properly.
