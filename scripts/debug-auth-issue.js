const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function debugAuthIssue() {
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
        confirmation_sent_at,
        recovery_sent_at,
        email_change_sent_at,
        raw_user_meta_data,
        is_sso_user,
        deleted_at
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
      console.log('Is SSO User:', user.is_sso_user);
      console.log('Deleted:', user.deleted_at ? '❌ Yes' : '✅ No');
      console.log('Meta Data:', user.raw_user_meta_data);
    } else {
      console.log('❌ No user found in auth.users');
    }

    // Check public user status
    const publicQuery = `
      SELECT id, email, role, instructor_legal_area, created_at
      FROM public.users 
      WHERE email = $1;
    `;
    
    const publicResult = await client.query(publicQuery, [email]);
    console.log('\n👤 Public User Status:');
    if (publicResult.rows.length > 0) {
      console.log(publicResult.rows[0]);
    } else {
      console.log('❌ No user found in public.users');
    }

    // Check for any auth sessions
    const sessionQuery = `
      SELECT id, user_id, created_at, updated_at, factor_id, aal, not_after
      FROM auth.sessions 
      WHERE user_id = (SELECT id FROM auth.users WHERE email = $1)
      ORDER BY created_at DESC
      LIMIT 5;
    `;
    
    const sessionResult = await client.query(sessionQuery, [email]);
    console.log('\n🔑 Recent Sessions:');
    if (sessionResult.rows.length > 0) {
      sessionResult.rows.forEach((session, index) => {
        console.log(`Session ${index + 1}:`, {
          id: session.id,
          created: session.created_at,
          updated: session.updated_at,
          aal: session.aal,
          not_after: session.not_after
        });
      });
    } else {
      console.log('❌ No sessions found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

debugAuthIssue();
