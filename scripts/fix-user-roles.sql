-- Fix user roles in the database
-- This script ensures proper role assignments for all test users

-- First, let's check current users
SELECT email, role, account_credits, first_name, last_name 
FROM users 
ORDER BY created_at;

-- Fix admin@kraatz-club.de role to 'admin'
UPDATE users 
SET role = 'admin', account_credits = COALESCE(account_credits, 1000)
WHERE email = 'admin@kraatz-club.de';

-- Ensure demo@kraatz-club.de has 'student' role
UPDATE users 
SET role = 'student', account_credits = COALESCE(account_credits, 0)
WHERE email = 'demo@kraatz-club.de';

-- Check if dozent@kraatz-club.de exists, if not we'll need to create it manually
-- For now, let's just update it if it exists
UPDATE users 
SET role = 'instructor', account_credits = COALESCE(account_credits, 1000)
WHERE email = 'dozent@kraatz-club.de';

-- Verify the changes
SELECT email, role, account_credits, first_name, last_name 
FROM users 
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'instructor' THEN 2 
    WHEN 'student' THEN 3 
    ELSE 4 
  END,
  created_at;
