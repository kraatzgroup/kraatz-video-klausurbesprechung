require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rpgbyockvpannrupicno.supabase.co',
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupAllUsers() {
  console.log('🔍 Checking existing users...');
  
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
  
  // Required users
  const requiredUsers = [
    {
      email: 'admin@kraatz-club.de',
      password: 'Admin123!',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      credits: 1000
    },
    {
      email: 'demo@kraatz-club.de',
      password: 'Demo123!',
      first_name: 'Demo',
      last_name: 'Student',
      role: 'student',
      credits: 5
    },
    {
      email: 'dozent@kraatz-club.de',
      password: 'Dozent123!',
      first_name: 'Dozent',
      last_name: 'Instructor',
      role: 'instructor',
      credits: 1000
    }
  ];
  
  for (const userData of requiredUsers) {
    const existingUser = users.find(u => u.email === userData.email);
    
    if (!existingUser) {
      console.log(`🔧 Creating ${userData.role}: ${userData.email}...`);
      
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true
        });
        
        if (authError) {
          console.error(`Auth error for ${userData.email}:`, authError);
          continue;
        }
        
        // Create profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            account_credits: userData.credits
          });
          
        if (profileError) {
          console.error(`Profile error for ${userData.email}:`, profileError);
        } else {
          console.log(`✅ ${userData.role} user created: ${userData.email}`);
        }
      } catch (error) {
        console.error(`Error creating ${userData.email}:`, error);
      }
    } else {
      // Update existing user role if needed
      if (existingUser.role !== userData.role) {
        console.log(`🔄 Updating role for ${userData.email}: ${existingUser.role} → ${userData.role}`);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: userData.role })
          .eq('email', userData.email);
          
        if (updateError) {
          console.error(`Update error for ${userData.email}:`, updateError);
        } else {
          console.log(`✅ Role updated for ${userData.email}`);
        }
      } else {
        console.log(`✅ ${userData.email} already exists with correct role`);
      }
    }
  }
  
  // Final verification
  console.log('\n🔍 Final user verification:');
  const { data: finalUsers } = await supabase
    .from('users')
    .select('*')
    .order('created_at');
    
  finalUsers.forEach(user => {
    console.log(`- ${user.email}: ${user.role} (Credits: ${user.account_credits || 0})`);
  });
  
  console.log('\n✅ User setup complete!');
}

setupAllUsers().catch(console.error);
