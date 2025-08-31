const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rpgbyockvpannrupicno.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'
);

async function updateRoles() {
  console.log('Updating user roles...');
  
  // Update admin role
  const { error: adminError } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('email', 'admin@kraatz-club.de');
    
  if (adminError) {
    console.error('Admin update failed:', adminError);
  } else {
    console.log('✅ Admin role updated');
  }
  
  // Update demo user role
  const { error: demoError } = await supabase
    .from('users')
    .update({ role: 'student' })
    .eq('email', 'demo@kraatz-club.de');
    
  if (demoError) {
    console.error('Demo update failed:', demoError);
  } else {
    console.log('✅ Demo role updated');
  }
  
  // Check all users
  const { data: users } = await supabase
    .from('users')
    .select('email, role, account_credits');
    
  console.log('\nCurrent users:');
  users.forEach(user => {
    console.log(`${user.email}: ${user.role} (${user.account_credits} credits)`);
  });
}

updateRoles();
