// Reset admin password directly via database
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function resetAdminViaDatabase() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const email = 'admin@kraatz-club.de';
    const newPassword = 'Admin123!';
    
    console.log('🔐 Resetting password for:', email);
    console.log('🔑 New password:', newPassword);

    // First check if user exists
    const checkQuery = `
      SELECT id, email, email_confirmed_at 
      FROM auth.users 
      WHERE email = $1;
    `;
    
    const checkResult = await client.query(checkQuery, [email]);
    
    if (checkResult.rows.length === 0) {
      console.log('❌ User not found in auth.users');
      
      // Check what users exist
      const allUsersQuery = `SELECT email FROM auth.users ORDER BY email;`;
      const allUsers = await client.query(allUsersQuery);
      
      console.log('\n📋 Available users:');
      allUsers.rows.forEach(user => {
        console.log('  -', user.email);
      });
      
      return;
    }

    const user = checkResult.rows[0];
    console.log('✅ Found user:', user.email);
    console.log('   ID:', user.id);
    console.log('   Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔒 Password hashed successfully');

    // Update the password in auth.users
    const updateQuery = `
      UPDATE auth.users 
      SET 
        encrypted_password = $1,
        updated_at = NOW(),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
      WHERE id = $2;
    `;
    
    const updateResult = await client.query(updateQuery, [hashedPassword, user.id]);
    
    if (updateResult.rowCount === 1) {
      console.log('✅ PASSWORD RESET SUCCESSFUL!');
      console.log('');
      console.log('🎯 LOGIN CREDENTIALS:');
      console.log('Email: admin@kraatz-club.de');
      console.log('Password: Admin123!');
      console.log('');
      console.log('🌐 LOGIN URL:');
      console.log('https://klausuren.kraatz-club.de/admin');
      console.log('');
      console.log('✅ You can now login immediately!');
    } else {
      console.log('❌ Password update failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('bcrypt')) {
      console.log('');
      console.log('💡 Installing bcrypt...');
      console.log('Run: npm install bcrypt');
      console.log('Then run this script again');
    }
  } finally {
    await client.end();
  }
}

resetAdminViaDatabase();
