const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function deleteTestUser() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if user exists in auth.users
    const authQuery = `
      SELECT id, email, created_at 
      FROM auth.users 
      WHERE email = 'yoshikorural@tiffincrane.com';
    `;
    
    const authResult = await client.query(authQuery);
    console.log('\n🔐 Auth Users:');
    console.log(authResult.rows);

    // Check if user exists in public.users
    const publicQuery = `
      SELECT id, email, role, instructor_legal_area, legal_areas 
      FROM public.users 
      WHERE email = 'yoshikorural@tiffincrane.com';
    `;
    
    const publicResult = await client.query(publicQuery);
    console.log('\n👤 Public Users:');
    console.log(publicResult.rows);

    // Delete from public.users first (if exists)
    if (publicResult.rows.length > 0) {
      const deletePublicQuery = `DELETE FROM public.users WHERE email = 'yoshikorural@tiffincrane.com';`;
      await client.query(deletePublicQuery);
      console.log('✅ Deleted from public.users');
    }

    // Delete from auth.users (if exists)
    if (authResult.rows.length > 0) {
      const deleteAuthQuery = `DELETE FROM auth.users WHERE email = 'yoshikorural@tiffincrane.com';`;
      await client.query(deleteAuthQuery);
      console.log('✅ Deleted from auth.users');
    }

    if (authResult.rows.length === 0 && publicResult.rows.length === 0) {
      console.log('ℹ️ No user found with that email');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

deleteTestUser();
