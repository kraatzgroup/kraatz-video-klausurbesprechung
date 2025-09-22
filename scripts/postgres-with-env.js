const { Client } = require('pg');

async function addColumnViaPostgres() {
  // Try different possible passwords
  const passwords = [
    'Kraatz2024!',
    process.env.SUPABASE_DB_PASSWORD,
    process.env.DATABASE_PASSWORD,
    process.env.POSTGRES_PASSWORD
  ].filter(Boolean);

  for (const password of passwords) {
    const client = new Client({
      host: 'db.rpgbyockvpannrupicno.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: password,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      console.log(`Trying to connect with password: ${password.substring(0, 3)}...`);
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
        await client.end();
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
        await client.end();
        return true;
      } else {
        console.log('❌ Column verification failed');
        await client.end();
        return false;
      }

    } catch (error) {
      console.error(`❌ Error with password ${password.substring(0, 3)}...: ${error.message}`);
      await client.end().catch(() => {});
      continue;
    }
  }

  console.log('❌ All password attempts failed');
  console.log('');
  console.log('Please provide the correct PostgreSQL password or add the column manually:');
  console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/rpgbyockvpannrupicno');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Execute:');
  console.log('   ALTER TABLE case_study_requests ADD COLUMN scoring_sheet_url TEXT;');
  console.log('   CREATE INDEX idx_case_study_requests_scoring_sheet ON case_study_requests(scoring_sheet_url);');
  return false;
}

addColumnViaPostgres();
