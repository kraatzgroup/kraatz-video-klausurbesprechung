const { Client } = require('pg');

async function addColumnViaConnectionString() {
  const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';
  
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to PostgreSQL database via connection string...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Check if column already exists
    console.log('Checking if scoring_sheet_url column exists...');
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'case_study_requests' 
      AND column_name = 'scoring_sheet_url'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Column scoring_sheet_url already exists');
      return true;
    }

    // Add the column
    console.log('Adding scoring_sheet_url column...');
    await client.query('ALTER TABLE case_study_requests ADD COLUMN scoring_sheet_url TEXT;');
    console.log('✅ Column added successfully');

    // Create index
    console.log('Creating index...');
    await client.query('CREATE INDEX idx_case_study_requests_scoring_sheet ON case_study_requests(scoring_sheet_url);');
    console.log('✅ Index created successfully');

    // Verify the column was added
    const verifyResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'case_study_requests' 
      AND column_name = 'scoring_sheet_url'
    `);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Column verification successful');
      console.log('Column details:', verifyResult.rows[0]);
      return true;
    } else {
      console.log('❌ Column verification failed');
      return false;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

addColumnViaConnectionString();
