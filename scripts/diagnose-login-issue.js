// Diagnose the login issue by checking user status and auth configuration
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function diagnoseLoginIssue() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const email = 'ill9293@tiffincrane.com';

    console.log('🔍 Checking user status in auth.users...');
    
    // Check auth.users table
    const authQuery = `
      SELECT 
        id, 
        email, 
        email_confirmed_at, 
        created_at, 
        updated_at,
        last_sign_in_at,
        raw_user_meta_data,
        banned_until,
        deleted_at
      FROM auth.users 
      WHERE email = $1;
    `;
    
    const authResult = await client.query(authQuery, [email]);
    
    if (authResult.rows.length === 0) {
      console.log('❌ User not found in auth.users table');
      console.log('This could be why login is failing with 400 Bad Request');
      return;
    }

    const user = authResult.rows[0];
    console.log('✅ User found in auth.users:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Email Confirmed:', user.email_confirmed_at ? '✅ Yes' : '❌ No');
    console.log('  Created:', user.created_at);
    console.log('  Updated:', user.updated_at);
    console.log('  Last Sign In:', user.last_sign_in_at || 'Never');
    console.log('  Banned Until:', user.banned_until || 'Not banned');
    console.log('  Deleted At:', user.deleted_at || 'Not deleted');
    console.log('  Meta Data:', user.raw_user_meta_data);

    // Check public.users table
    console.log('\n🔍 Checking user status in public.users...');
    
    const publicQuery = `
      SELECT id, email, role, instructor_legal_area, first_name, last_name, created_at
      FROM public.users 
      WHERE email = $1;
    `;
    
    const publicResult = await client.query(publicQuery, [email]);
    
    if (publicResult.rows.length === 0) {
      console.log('❌ User not found in public.users table');
      console.log('This could cause issues with role-based authentication');
    } else {
      const publicUser = publicResult.rows[0];
      console.log('✅ User found in public.users:');
      console.log('  Name:', `${publicUser.first_name} ${publicUser.last_name}`);
      console.log('  Role:', publicUser.role);
      console.log('  Legal Area:', publicUser.instructor_legal_area || 'N/A');
    }

    console.log('\n🔧 Diagnosis:');
    
    if (!user.email_confirmed_at) {
      console.log('❌ ISSUE: Email not confirmed - this will cause 400 Bad Request');
      console.log('   Solution: User needs to confirm email or admin needs to confirm manually');
    }
    
    if (user.banned_until) {
      console.log('❌ ISSUE: User is banned - this will prevent login');
      console.log('   Solution: Remove ban from user account');
    }
    
    if (user.deleted_at) {
      console.log('❌ ISSUE: User is deleted - this will prevent login');
      console.log('   Solution: Restore user account');
    }
    
    if (!user.email_confirmed_at && !user.banned_until && !user.deleted_at) {
      console.log('✅ User account looks healthy');
      console.log('   The 400 Bad Request might be due to:');
      console.log('   - Wrong password');
      console.log('   - Supabase project configuration');
      console.log('   - API key issues');
      console.log('   - Rate limiting');
    }

    console.log('\n💡 Immediate solutions:');
    console.log('1. Try password reset via /forgot-password');
    console.log('2. Confirm email manually in Supabase dashboard');
    console.log('3. Check Supabase project auth settings');
    console.log('4. Try with a different user account');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

diagnoseLoginIssue();
