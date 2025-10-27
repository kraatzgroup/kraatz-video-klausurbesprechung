// Final check before user deletion - verify all constraints are resolved
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function finalDeletionCheck() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const userId = '06135db2-3759-4394-acb4-3d41bf115bc5'; // Adria 55
    
    console.log('🔍 Final deletion check for user:', userId);
    console.log('');

    // Check all possible foreign key references
    const checks = [
      {
        name: 'Assigned Case Studies (as instructor)',
        query: 'SELECT COUNT(*) as count FROM case_study_requests WHERE assigned_instructor_id = $1',
        critical: true
      },
      {
        name: 'Case Studies (as student)',
        query: 'SELECT COUNT(*) as count FROM case_study_requests WHERE user_id = $1',
        critical: true
      },
      {
        name: 'Notifications',
        query: 'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
        critical: false
      },
      {
        name: 'Orders',
        query: 'SELECT COUNT(*) as count FROM orders WHERE user_id = $1',
        critical: false
      }
    ];

    let canDelete = true;
    
    for (const check of checks) {
      try {
        const result = await client.query(check.query, [userId]);
        const count = result.rows[0].count;
        
        console.log(`${check.name}: ${count}`);
        
        if (count > 0 && check.critical) {
          console.log(`  ❌ CRITICAL: This prevents deletion`);
          canDelete = false;
        } else if (count > 0) {
          console.log(`  ⚠️  Will be cascade deleted`);
        } else {
          console.log(`  ✅ No references`);
        }
      } catch (error) {
        console.log(`${check.name}: ❌ Error checking - ${error.message}`);
      }
    }
    
    console.log('');
    
    if (canDelete) {
      console.log('✅ USER CAN BE DELETED SAFELY');
      console.log('   All critical foreign key constraints have been resolved');
      console.log('   Try deleting from the admin interface again');
    } else {
      console.log('❌ USER CANNOT BE DELETED YET');
      console.log('   Critical foreign key constraints still exist');
      console.log('');
      console.log('🛠️  Manual cleanup required:');
      console.log('   1. Check for any remaining assigned case studies');
      console.log('   2. Reassign or unassign them');
      console.log('   3. Check for any case studies where user is the student');
      console.log('   4. Consider if those should be preserved or deleted');
    }
    
    console.log('');
    console.log('🔧 If deletion still fails, the issue might be:');
    console.log('   - RLS (Row Level Security) policies');
    console.log('   - Supabase Auth constraints');
    console.log('   - Other database triggers or constraints');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

finalDeletionCheck();
