const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rpgbyockvpannrupicno.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'
);

async function createAllUsers() {
  console.log('Checking and creating all required users...');
  
  // Get existing users
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Current users:');
  users.forEach(user => {
    console.log(`- ${user.email}: ${user.role} (Credits: ${user.account_credits || 0})`);
  });
  
  // Create demo user if missing
  const demoUser = users.find(u => u.email === 'demo@kraatz-club.de');
  if (!demoUser) {
    console.log('Creating demo user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'demo@kraatz-club.de',
      password: 'Demo123!',
      email_confirm: true
    });
    
    if (!authError) {
      await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: 'demo@kraatz-club.de',
          first_name: 'Demo',
          last_name: 'Student',
          role: 'student',
          account_credits: 5
        });
      console.log('✅ Demo user created');
    }
  }
  
  // Create instructor user if missing
  const instructorUser = users.find(u => u.email === 'dozent@kraatz-club.de');
  if (!instructorUser) {
    console.log('Creating instructor user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'dozent@kraatz-club.de',
      password: 'Dozent123!',
      email_confirm: true
    });
    
    if (!authError) {
      await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: 'dozent@kraatz-club.de',
          first_name: 'Max',
          last_name: 'Mustermann',
          role: 'instructor',
          account_credits: 1000
        });
      console.log('✅ Instructor user created');
    }
  }
  
  // Final check
  const { data: finalUsers } = await supabase
    .from('users')
    .select('email, role, account_credits, first_name, last_name')
    .order('email');
    
  console.log('\nFinal users:');
  finalUsers.forEach(user => {
    console.log(`✓ ${user.email}: ${user.role} - ${user.first_name} ${user.last_name} (${user.account_credits} credits)`);
  });
}

createAllUsers();
