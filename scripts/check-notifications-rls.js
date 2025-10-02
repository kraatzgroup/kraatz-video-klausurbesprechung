#!/usr/bin/env node

/**
 * Überprüft RLS-Richtlinien für die notifications Tabelle
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkNotificationsRLS() {
  console.log('🔒 Checking Row-Level Security for notifications table...\n');

  try {
    // Check if RLS is enabled
    const { data: tables, error: tablesError } = await supabase
      .rpc('check_table_rls', { table_name: 'notifications' })
      .single();

    if (tablesError) {
      console.log('⚠️ Could not check RLS status directly. Trying alternative method...');
      
      // Try to get table info
      const { data: tableInfo, error: infoError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', 'notifications')
        .eq('table_schema', 'public');
      
      if (infoError) {
        console.error('❌ Error getting table info:', infoError);
      } else {
        console.log('📋 Table info:', tableInfo);
      }
    }

    // Try to check policies
    console.log('🔍 Checking RLS policies for notifications table...');
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'notifications' });

    if (policiesError) {
      console.log('⚠️ Could not fetch policies directly. This is normal for security reasons.');
      console.log('ℹ️ RLS policies are typically not accessible via client-side queries.');
    } else {
      console.log('📋 Policies found:', policies);
    }

    // Test basic notification operations
    console.log('\n🧪 Testing notification operations...');
    
    // Try to read notifications (should work)
    console.log('📖 Testing read access...');
    const { data: readTest, error: readError } = await supabase
      .from('notifications')
      .select('id, user_id, title')
      .limit(1);

    if (readError) {
      console.error('❌ Read test failed:', readError);
    } else {
      console.log('✅ Read test successful:', readTest?.length || 0, 'notifications found');
    }

    // Get current user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('⚠️ No authenticated user found. RLS policies may require authentication.');
      console.log('ℹ️ This script uses the anon key, which may have limited permissions.');
      
      // Try with service role if available
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('\n🔑 Trying with service role key...');
        
        const serviceSupabase = createClient(
          process.env.REACT_APP_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const { data: serviceReadTest, error: serviceReadError } = await serviceSupabase
          .from('notifications')
          .select('id, user_id, title')
          .limit(3);
        
        if (serviceReadError) {
          console.error('❌ Service role read test failed:', serviceReadError);
        } else {
          console.log('✅ Service role read test successful:', serviceReadTest?.length || 0, 'notifications found');
          
          if (serviceReadTest && serviceReadTest.length > 0) {
            console.log('📋 Sample notifications:');
            serviceReadTest.forEach((notif, index) => {
              console.log(`   ${index + 1}. User: ${notif.user_id}, Title: "${notif.title}"`);
            });
          }
        }
        
        // Test insert with service role
        console.log('\n🧪 Testing insert with service role...');
        const testNotification = {
          user_id: 'test-user-id',
          title: 'Test RLS Notification',
          message: 'Testing RLS policies',
          type: 'info',
          read: false
        };
        
        const { data: insertTest, error: insertError } = await serviceSupabase
          .from('notifications')
          .insert(testNotification)
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ Service role insert test failed:', insertError);
          
          if (insertError.code === '23503') {
            console.log('ℹ️ Foreign key constraint error - user_id does not exist');
            console.log('ℹ️ This is expected with test-user-id');
          }
        } else {
          console.log('✅ Service role insert test successful:', insertTest);
          
          // Clean up test notification
          await serviceSupabase
            .from('notifications')
            .delete()
            .eq('id', insertTest.id);
          console.log('🧹 Test notification cleaned up');
        }
      } else {
        console.log('⚠️ No service role key found in environment variables');
      }
    } else {
      console.log('✅ Authenticated user found:', user.id);
      
      // Test insert with authenticated user
      console.log('\n🧪 Testing insert with authenticated user...');
      const testNotification = {
        user_id: user.id,
        title: 'Test User Notification',
        message: 'Testing user notification creation',
        type: 'info',
        read: false
      };
      
      const { data: userInsertTest, error: userInsertError } = await supabase
        .from('notifications')
        .insert(testNotification)
        .select()
        .single();
      
      if (userInsertError) {
        console.error('❌ User insert test failed:', userInsertError);
      } else {
        console.log('✅ User insert test successful:', userInsertTest);
        
        // Clean up test notification
        await supabase
          .from('notifications')
          .delete()
          .eq('id', userInsertTest.id);
        console.log('🧹 Test notification cleaned up');
      }
    }

    console.log('\n💡 RLS Policy Recommendations:');
    console.log('');
    console.log('For notifications table, you should have policies like:');
    console.log('');
    console.log('1. **SELECT Policy**: Users can read their own notifications');
    console.log('   CREATE POLICY "Users can read own notifications" ON notifications');
    console.log('   FOR SELECT USING (auth.uid() = user_id);');
    console.log('');
    console.log('2. **INSERT Policy**: Allow system to create notifications for users');
    console.log('   CREATE POLICY "System can create notifications" ON notifications');
    console.log('   FOR INSERT WITH CHECK (true);');
    console.log('   -- OR more restrictive:');
    console.log('   -- FOR INSERT WITH CHECK (auth.role() = \'service_role\');');
    console.log('');
    console.log('3. **UPDATE Policy**: Users can update their own notifications');
    console.log('   CREATE POLICY "Users can update own notifications" ON notifications');
    console.log('   FOR UPDATE USING (auth.uid() = user_id);');
    console.log('');
    console.log('4. **DELETE Policy**: Users can delete their own notifications');
    console.log('   CREATE POLICY "Users can delete own notifications" ON notifications');
    console.log('   FOR DELETE USING (auth.uid() = user_id);');

  } catch (error) {
    console.error('❌ Error during RLS check:', error);
  }
}

// Run the check
checkNotificationsRLS()
  .then(() => {
    console.log('\n🎉 RLS check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 RLS check failed:', error);
    process.exit(1);
  });
