require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function setupDatabase() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Setting up database schema...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`Statement ${i + 1} error (might be expected):`, error.message);
          }
        } catch (err) {
          console.log(`Statement ${i + 1} error (might be expected):`, err.message);
        }
      }
    }

    // Test the setup by checking packages
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('*');

    if (packagesError) {
      console.error('❌ Error checking packages:', packagesError);
    } else {
      console.log(`✅ Database setup complete! Found ${packages.length} packages.`);
      packages.forEach(pkg => {
        console.log(`  - ${pkg.name}: ${pkg.case_study_count} studies, €${pkg.price_cents/100}`);
      });
    }

    // Test authentication by creating a test user
    console.log('\nTesting user creation...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@kraatz-club.de',
      password: 'Test123!',
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    });

    if (authError) {
      console.log('User creation test (might already exist):', authError.message);
    } else {
      console.log('✅ Test user created successfully');
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
