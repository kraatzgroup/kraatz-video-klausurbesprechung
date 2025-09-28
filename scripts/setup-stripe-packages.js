const { Client } = require('pg');

// Database connection using the user's preferred direct PostgreSQL approach
const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

const packages = [
  {
    package_key: '5er',
    name: '5er Paket',
    description: 'Perfekt für den Einstieg',
    case_study_count: 5,
    price_cents: 67500, // €675
    stripe_price_id: 'price_5er_package' // This will need to be updated with actual Stripe price ID
  },
  {
    package_key: '10er',
    name: '10er Paket',
    description: 'Ideal für regelmäßiges Üben',
    case_study_count: 10,
    price_cents: 125000, // €1250
    stripe_price_id: 'price_10er_package' // This will need to be updated with actual Stripe price ID
  },
  {
    package_key: '15er',
    name: '15er Paket',
    description: 'Für intensive Vorbereitung',
    case_study_count: 15,
    price_cents: 180000, // €1800
    stripe_price_id: 'price_15er_package' // This will need to be updated with actual Stripe price ID
  },
  {
    package_key: '20er',
    name: '20er Paket',
    description: 'Umfassende Klausurvorbereitung',
    case_study_count: 20,
    price_cents: 236000, // €2360
    stripe_price_id: 'price_20er_package' // This will need to be updated with actual Stripe price ID
  },
  {
    package_key: '25er',
    name: '25er Paket',
    description: 'Maximale Flexibilität',
    case_study_count: 25,
    price_cents: 287500, // €2875
    stripe_price_id: 'price_25er_package' // This will need to be updated with actual Stripe price ID
  },
  {
    package_key: '30er',
    name: '30er Paket',
    description: 'Das Komplettpaket für Profis',
    case_study_count: 30,
    price_cents: 337500, // €3375
    stripe_price_id: 'price_30er_package' // This will need to be updated with actual Stripe price ID
  }
];

async function setupStripePackages() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // First, check if packages table exists and has the right structure
    const tableCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'packages' 
      ORDER BY ordinal_position;
    `);

    if (tableCheck.rows.length === 0) {
      console.log('📋 Creating packages table...');
      await client.query(`
        CREATE TABLE packages (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          case_study_count INTEGER NOT NULL,
          price_cents INTEGER NOT NULL,
          stripe_price_id TEXT NOT NULL,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('✅ Packages table created');
    } else {
      console.log('📋 Packages table already exists');
      console.log('Columns:', tableCheck.rows.map(row => `${row.column_name} (${row.data_type})`).join(', '));
    }

    // Clear existing packages and insert new ones
    console.log('🗑️ Clearing existing packages...');
    await client.query('DELETE FROM packages');

    // First, add package_key column if it doesn't exist
    const packageKeyCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'packages' AND column_name = 'package_key';
    `);

    if (packageKeyCheck.rows.length === 0) {
      console.log('📋 Adding package_key column...');
      await client.query('ALTER TABLE packages ADD COLUMN package_key TEXT UNIQUE');
      console.log('✅ package_key column added');
    }

    console.log('📦 Inserting packages...');
    for (const pkg of packages) {
      await client.query(`
        INSERT INTO packages (id, package_key, name, description, case_study_count, price_cents, stripe_price_id, active)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
      `, [
        pkg.package_key,
        pkg.name,
        pkg.description,
        pkg.case_study_count,
        pkg.price_cents,
        pkg.stripe_price_id,
        true
      ]);
      console.log(`✅ Added package: ${pkg.name} (${pkg.case_study_count} Klausuren, €${pkg.price_cents / 100})`);
    }

    // Verify the packages were inserted
    const result = await client.query('SELECT * FROM packages ORDER BY case_study_count');
    console.log('\n📊 Current packages in database:');
    result.rows.forEach(row => {
      console.log(`- ${row.name} (${row.package_key}): ${row.case_study_count} Klausuren, €${row.price_cents / 100}, Active: ${row.active}`);
    });

    console.log('\n🎉 Stripe packages setup completed successfully!');
    console.log('\n⚠️  NEXT STEPS:');
    console.log('1. Create corresponding products and prices in Stripe Dashboard');
    console.log('2. Update the stripe_price_id values in the database with actual Stripe price IDs');
    console.log('3. Deploy the Supabase Edge Functions');
    console.log('4. Configure Stripe webhook endpoint');

  } catch (error) {
    console.error('❌ Error setting up Stripe packages:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
setupStripePackages();
