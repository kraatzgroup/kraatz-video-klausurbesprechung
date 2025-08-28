const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTM1MTksImV4cCI6MjA3MTk2OTUxOX0._zvzPGXEkQLh-_IcmS7JcgndKbOq6eD3SViizKH0oos';

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
