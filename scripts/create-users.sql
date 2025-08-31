-- Check current users
SELECT email, role, account_credits, first_name, last_name FROM users ORDER BY email;

-- Insert demo user if not exists
INSERT INTO users (id, email, first_name, last_name, role, account_credits, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'demo@kraatz-club.de',
  'Demo',
  'Student', 
  'student',
  5,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@kraatz-club.de');

-- Insert instructor user if not exists  
INSERT INTO users (id, email, first_name, last_name, role, account_credits, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'dozent@kraatz-club.de',
  'Max',
  'Mustermann',
  'instructor', 
  1000,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'dozent@kraatz-club.de');

-- Verify all users exist with correct roles
SELECT email, role, account_credits, first_name, last_name FROM users ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'instructor' THEN 2 
    WHEN 'student' THEN 3 
    ELSE 4 
  END,
  email;
