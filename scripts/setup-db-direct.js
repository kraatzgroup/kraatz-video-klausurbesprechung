const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  // Parse the connection string properly
  const client = new Client({
    host: 'aws-1-eu-central-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.rpgbyockvpannrupicno',
    password: 'Groupjkl2023!05hosting',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing database schema...');
    await client.query(schema);
    console.log('✅ Database schema executed successfully');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('✅ Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check packages
    const packagesResult = await client.query('SELECT * FROM public.packages');
    console.log(`✅ Sample packages: ${packagesResult.rows.length}`);
    packagesResult.rows.forEach(pkg => {
      console.log(`  - ${pkg.name}: €${pkg.price_cents/100}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If connection fails, let's try with different SSL settings
    if (error.message.includes('authentication') || error.message.includes('password')) {
      console.log('\nTrying alternative connection method...');
      
      const altClient = new Client({
        connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:Groupjkl2023%21%2105hosting@aws-1-eu-central-1.pooler.supabase.com:5432/postgres',
        ssl: { rejectUnauthorized: false }
      });
      
      try {
        await altClient.connect();
        console.log('✅ Alternative connection successful');
        
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        await altClient.query(schema);
        console.log('✅ Schema executed via alternative connection');
        
        await altClient.end();
      } catch (altError) {
        console.error('❌ Alternative connection also failed:', altError.message);
      }
    }
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

setupDatabase();
