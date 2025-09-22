const { Client } = require('pg');

async function addColumnToDatabase() {
  // Database connection configuration
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'kraatz_club',
    user: 'postgres',
    password: 'datenbankpasswort',
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Check if column already exists
    console.log('Checking if scoring_schema_url column exists...');
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'case_study_requests' 
      AND column_name = 'scoring_schema_url';
    `;
    
    const checkResult = await client.query(checkColumnQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Column scoring_schema_url already exists!');
      return;
    }

    console.log('Adding scoring_schema_url column...');
    
    // Add the column
    const addColumnQuery = `
      ALTER TABLE case_study_requests 
      ADD COLUMN scoring_schema_url TEXT;
    `;
    
    await client.query(addColumnQuery);
    console.log('✅ Column scoring_schema_url added successfully!');

    // Add comment to document the column
    const commentQuery = `
      COMMENT ON COLUMN case_study_requests.scoring_schema_url 
      IS 'URL to Excel scoring schema file uploaded by instructor';
    `;
    
    await client.query(commentQuery);
    console.log('✅ Column comment added successfully!');

    // Verify the column was added
    console.log('Verifying column was added...');
    const verifyResult = await client.query(checkColumnQuery);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ SUCCESS: Column verified and ready to use!');
    } else {
      console.log('❌ Verification failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('Connection refused. Please make sure PostgreSQL is running.');
    } else if (error.code === '28P01') {
      console.log('Authentication failed. Please check the password.');
    } else if (error.code === '3D000') {
      console.log('Database "kraatz_club" does not exist.');
    }
  } finally {
    try {
      await client.end();
      console.log('Database connection closed.');
    } catch (err) {
      // Ignore connection close errors
    }
  }
}

// Run the function
addColumnToDatabase();
