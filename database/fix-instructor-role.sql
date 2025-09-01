-- Fix instructor role for dozent@kraatz-club.de
-- First, check if the user exists and what role they have
SELECT id, email, role, first_name, last_name FROM public.users WHERE email = 'dozent@kraatz-club.de';

-- If the user exists but has wrong role, update it
UPDATE public.users 
SET role = 'instructor' 
WHERE email = 'dozent@kraatz-club.de';

-- If the user doesn't exist, create them
INSERT INTO public.users (id, email, first_name, last_name, role, account_credits)
SELECT 
    auth.uid(),
    'dozent@kraatz-club.de',
    'Dozent',
    'Kraatz Club',
    'instructor',
    0
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'dozent@kraatz-club.de'
);

-- Verify the change
SELECT id, email, role, first_name, last_name FROM public.users WHERE email = 'dozent@kraatz-club.de';
