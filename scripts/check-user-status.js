const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function checkUserStatus() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const email = 'ill9293@tiffincrane.com';

    // Check if user exists in auth.users
    const authQuery = `
      SELECT id, email, email_confirmed_at, created_at, last_sign_in_at, raw_user_meta_data
      FROM auth.users 
      WHERE email = $1;
    `;
    
    const authResult = await client.query(authQuery, [email]);
    console.log('\n🔐 Auth Users:');
    if (authResult.rows.length > 0) {
      console.log(authResult.rows[0]);
    } else {
      console.log('❌ No user found in auth.users');
    }

    // Check if user exists in public.users
    const publicQuery = `
      SELECT id, email, role, instructor_legal_area, legal_areas, created_at
      FROM public.users 
      WHERE email = $1;
    `;
    
    const publicResult = await client.query(publicQuery, [email]);
    console.log('\n👤 Public Users:');
    if (publicResult.rows.length > 0) {
      console.log(publicResult.rows[0]);
    } else {
      console.log('❌ No user found in public.users');
    }

    // Check for any recent password reset tokens
    console.log('\n🔑 Checking for recent auth events...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUserStatus();
