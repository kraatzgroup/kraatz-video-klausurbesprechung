-- Manual SQL commands to fix user roles
-- Run these in Supabase SQL Editor or any PostgreSQL client

-- Check current users first
SELECT email, role, account_credits FROM users ORDER BY email;

-- Fix admin@kraatz-club.de to admin role
UPDATE users SET role = 'admin' WHERE email = 'admin@kraatz-club.de';

-- Ensure demo@kraatz-club.de is student
UPDATE users SET role = 'student' WHERE email = 'demo@kraatz-club.de';

-- Check results
SELECT email, role, account_credits FROM users ORDER BY email;
