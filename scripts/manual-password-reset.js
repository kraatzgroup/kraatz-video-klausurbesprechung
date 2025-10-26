// Manual password reset using direct database access
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function manualPasswordReset() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const email = 'ill9293@tiffincrane.com';
    const newPassword = 'KraatzClub2025!';

    console.log(`🔐 Resetting password for: ${email}`);
    console.log(`🔑 New password: ${newPassword}`);

    // Get user ID
    const userQuery = `
      SELECT id FROM auth.users WHERE email = $1;
    `;
    
    const userResult = await client.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.error('❌ User not found');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log(`👤 User ID: ${userId}`);

    // Note: We can't directly update the password hash in the database
    // because Supabase uses bcrypt and we don't have access to the hashing function
    // We need to use the Supabase Admin API for this

    console.log('⚠️ Direct password reset requires Supabase Admin API');
    console.log('💡 Use the Edge Function or Supabase Dashboard instead');
    
    // Alternative: Clear any existing sessions to force fresh login
    const clearSessionsQuery = `
      DELETE FROM auth.sessions WHERE user_id = $1;
    `;
    
    await client.query(clearSessionsQuery, [userId]);
    console.log('🧹 Cleared existing sessions');

    // Update user metadata to indicate password needs reset
    const updateMetaQuery = `
      UPDATE auth.users 
      SET raw_user_meta_data = raw_user_meta_data || '{"password_reset_required": true}'::jsonb,
          updated_at = NOW()
      WHERE id = $1;
    `;
    
    await client.query(updateMetaQuery, [userId]);
    console.log('🏷️ Marked user for password reset');

    console.log('\n🎯 Next Steps:');
    console.log('1. Use Supabase Dashboard to reset password');
    console.log('2. Or use the admin-password-reset Edge Function');
    console.log('3. Or send a new password reset email');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

manualPasswordReset();
