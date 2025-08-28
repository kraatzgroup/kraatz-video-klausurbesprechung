-- Test data for Kraatz Club application
-- Run this after the main schema.sql

-- Insert test users (these will need to be created in Supabase Auth first)
-- You can create these users through the registration form, then update their roles here

-- Example: After registering users through the app, update their roles:
-- UPDATE public.users SET role = 'instructor' WHERE email = 'dozent@kraatz-club.de';
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@kraatz-club.de';

-- For testing purposes, you can manually insert users if you have their auth.users IDs
-- Replace the UUIDs below with actual user IDs from auth.users table

-- Example test instructor (replace UUID with actual auth.users ID)
-- INSERT INTO public.users (id, email, first_name, last_name, role, account_credits) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'dozent@kraatz-club.de', 'Dr. Max', 'Mustermann', 'instructor', 0);

-- Example test student with credits
-- INSERT INTO public.users (id, email, first_name, last_name, role, account_credits) VALUES
-- ('00000000-0000-0000-0000-000000000002', 'student@kraatz-club.de', 'Anna', 'Schmidt', 'student', 5);

-- Sample case study requests for testing
-- INSERT INTO public.case_study_requests (user_id, legal_area, sub_area, focus_area, status) VALUES
-- ('00000000-0000-0000-0000-000000000002', 'Zivilrecht', 'BGB AT (General Part of Civil Code)', 'Geschäftsfähigkeit von Minderjährigen', 'requested'),
-- ('00000000-0000-0000-0000-000000000002', 'Strafrecht', 'Strafrecht AT (General Criminal Law)', 'Vorsatz und Fahrlässigkeit', 'materials_ready');

-- Instructions for manual setup:
-- 1. Register users through the web interface:
--    - dozent@kraatz-club.de (password: Dozent123!)
--    - student@kraatz-club.de (password: Student123!)
--    - admin@kraatz-club.de (password: Admin123!)

-- 2. After registration, find their IDs in auth.users and update roles:
SELECT 'Run these commands after creating users through registration:' as instruction;
SELECT 'UPDATE public.users SET role = ''instructor'' WHERE email = ''dozent@kraatz-club.de'';' as update_instructor;
SELECT 'UPDATE public.users SET role = ''admin'' WHERE email = ''admin@kraatz-club.de'';' as update_admin;
SELECT 'UPDATE public.users SET account_credits = 10 WHERE email = ''student@kraatz-club.de'';' as give_credits;
