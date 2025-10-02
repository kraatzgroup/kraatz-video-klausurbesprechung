const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

async function testDatabase() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('Testing Supabase connection...');

    // Test 1: Check if packages table exists and has data
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('*');

    if (packagesError) {
      console.log('❌ Packages table not found or empty:', packagesError.message);
      console.log('🔧 Database schema needs to be set up manually in Supabase dashboard');
      return false;
    } else {
      console.log(`✅ Packages table exists with ${packages.length} records`);
      packages.forEach(pkg => {
        console.log(`  - ${pkg.name}: €${pkg.price_cents/100}`);
      });
    }

    // Test 2: Try to create a test user
    console.log('\nTesting user registration...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'test-' + Date.now() + '@kraatz-club.de',
      password: 'Test123!',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User'
        }
      }
    });

    if (authError) {
      console.log('❌ User registration failed:', authError.message);
      return false;
    } else {
      console.log('✅ User registration works');
    }

    console.log('\n🎉 Database is properly configured!');
    console.log('You can now use the app at http://localhost:3000');
    return true;

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

testDatabase();
