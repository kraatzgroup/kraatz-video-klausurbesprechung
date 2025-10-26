const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function checkPasswordStatus() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const email = 'ill9293@tiffincrane.com';

    // Check current auth user status
    const authQuery = `
      SELECT 
        id, 
        email, 
        email_confirmed_at, 
        created_at, 
        updated_at,
        last_sign_in_at,
        recovery_sent_at,
        raw_user_meta_data
      FROM auth.users 
      WHERE email = $1;
    `;
    
    const authResult = await client.query(authQuery, [email]);
    console.log('\n🔐 Auth User Status:');
    if (authResult.rows.length > 0) {
      const user = authResult.rows[0];
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
      console.log('Email Confirmed:', user.email_confirmed_at ? '✅ Yes' : '❌ No');
      console.log('Created:', user.created_at);
      console.log('Updated:', user.updated_at);
      console.log('Last Sign In:', user.last_sign_in_at || 'Never');
      console.log('Recovery Sent:', user.recovery_sent_at || 'Never');
      console.log('Meta Data:', user.raw_user_meta_data);
    } else {
      console.log('❌ No user found in auth.users');
      return;
    }

    // Check public user status
    const publicQuery = `
      SELECT id, email, role, instructor_legal_area, first_name, last_name, created_at
      FROM public.users 
      WHERE email = $1;
    `;
    
    const publicResult = await client.query(publicQuery, [email]);
    console.log('\n👤 Public User Status:');
    if (publicResult.rows.length > 0) {
      const user = publicResult.rows[0];
      console.log('Name:', `${user.first_name} ${user.last_name}`);
      console.log('Role:', user.role);
      console.log('Legal Area:', user.instructor_legal_area || 'N/A');
      console.log('Created:', user.created_at);
    } else {
      console.log('❌ No user found in public.users');
    }

    console.log('\n🔑 Password Reset Status:');
    console.log('Expected Password: !Banana#2026');
    console.log('');
    console.log('🎯 To test login:');
    console.log('1. Go to: https://klausuren.kraatz-club.de/admin-login');
    console.log('2. Email: ill9293@tiffincrane.com');
    console.log('3. Password: !Banana#2026');
    console.log('4. Should login successfully if password was reset');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkPasswordStatus();
