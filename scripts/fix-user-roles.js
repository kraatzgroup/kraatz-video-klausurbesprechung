const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rpgbyockvpannrupicno.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk'
);

async function fixUserRoles() {
  console.log('🔍 Checking and fixing user roles...');
  
  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at');
    
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  console.log('📊 Current users:');
  users.forEach(user => {
    console.log(`- ${user.email}: ${user.role} (Credits: ${user.account_credits || 0})`);
  });
  
  // Fix admin@kraatz-club.de role
  const adminUser = users.find(u => u.email === 'admin@kraatz-club.de');
  if (adminUser && adminUser.role !== 'admin') {
    console.log('🔧 Fixing admin role...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', 'admin@kraatz-club.de');
      
    if (updateError) {
      console.error('Admin update error:', updateError);
    } else {
      console.log('✅ Admin role fixed!');
    }
  }
  
  // Fix demo@kraatz-club.de role
  const demoUser = users.find(u => u.email === 'demo@kraatz-club.de');
  if (demoUser && demoUser.role !== 'student') {
    console.log('🔧 Fixing demo user role...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'student' })
      .eq('email', 'demo@kraatz-club.de');
      
    if (!updateError) {
      console.log('✅ Demo user role fixed!');
    }
  }
  
  // Create or fix dozent@kraatz-club.de
  const instructorUser = users.find(u => u.email === 'dozent@kraatz-club.de');
  if (!instructorUser) {
    console.log('🔧 Creating instructor user...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'dozent@kraatz-club.de',
      password: 'Dozent123!',
      email_confirm: true
    });
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: 'dozent@kraatz-club.de',
        first_name: 'Max',
        last_name: 'Mustermann',
        role: 'instructor',
        account_credits: 1000
      });
      
    if (profileError) {
      console.error('Profile error:', profileError);
    } else {
      console.log('✅ Instructor user created!');
    }
  } else if (instructorUser.role !== 'instructor') {
    console.log('🔧 Fixing instructor role...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'instructor' })
      .eq('email', 'dozent@kraatz-club.de');
      
    if (!updateError) {
      console.log('✅ Instructor role fixed!');
    }
  }
  
  console.log('🎉 User roles setup complete!');
  console.log('\n📋 Login credentials:');
  console.log('Admin: admin@kraatz-club.de / Admin123!');
  console.log('Demo Student: demo@kraatz-club.de / Demo123!');
  console.log('Instructor: dozent@kraatz-club.de / Dozent123!');
}

fixUserRoles().catch(console.error);
