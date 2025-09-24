require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rpgbyockvpannrupicno.supabase.co',
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
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
