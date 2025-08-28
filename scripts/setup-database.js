const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const client = new Client({
    host: 'aws-1-eu-central-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.rpgbyockvpannrupicno',
    password: 'Groupjkl2023!05hosting',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing database schema...');
    await client.query(schema);
    console.log('✅ Database schema created successfully');

    // Test the setup by checking if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('✅ Tables created:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check if packages have been inserted
    const packagesResult = await client.query('SELECT COUNT(*) FROM public.packages');
    console.log(`✅ Sample packages inserted: ${packagesResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

setupDatabase();
