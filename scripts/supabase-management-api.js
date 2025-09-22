const https = require('https');

// Supabase Management API approach
const projectRef = 'rpgbyockvpannrupicno';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk';

async function executeSQL(sql) {
  const postData = JSON.stringify({ query: sql });
  
  const options = {
    hostname: `${projectRef}.supabase.co`,
    port: 443,
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function tryDirectConnection() {
  // Try connecting to Supabase's PostgreSQL directly
  const { Client } = require('pg');
  
  // Supabase connection string format
  const connectionConfigs = [
    {
      host: 'db.rpgbyockvpannrupicno.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'datenbankpasswort',
      ssl: { rejectUnauthorized: false }
    },
    {
      host: 'db.rpgbyockvpannrupicno.supabase.co',
      port: 6543,
      database: 'postgres', 
      user: 'postgres',
      password: 'datenbankpasswort',
      ssl: { rejectUnauthorized: false }
    }
  ];

  for (const config of connectionConfigs) {
    const client = new Client(config);
    
    try {
      console.log(`Trying connection to ${config.host}:${config.port}...`);
      await client.connect();
      console.log('✅ Connected to Supabase PostgreSQL!');

      // Check if column exists
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'case_study_requests' 
        AND column_name = 'scoring_schema_url'
      `);
      
      if (checkResult.rows.length > 0) {
        console.log('✅ Column already exists!');
        await client.end();
        return true;
      }

      // Add the column
      await client.query('ALTER TABLE case_study_requests ADD COLUMN scoring_schema_url TEXT;');
      console.log('✅ Column added successfully!');
      
      await client.end();
      return true;
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      try {
        await client.end();
      } catch (e) {
        // Ignore
      }
    }
  }
  
  return false;
}

async function main() {
  console.log('Attempting to add scoring_schema_url column to Supabase...');
  
  // Try direct PostgreSQL connection first
  const directSuccess = await tryDirectConnection();
  
  if (directSuccess) {
    console.log('✅ SUCCESS: Column added via direct PostgreSQL connection!');
    return;
  }
  
  // Try API approaches
  console.log('Trying API approaches...');
  
  const sqlCommands = [
    'ALTER TABLE case_study_requests ADD COLUMN IF NOT EXISTS scoring_schema_url TEXT;',
    'ALTER TABLE case_study_requests ADD COLUMN scoring_schema_url TEXT;'
  ];
  
  for (const sql of sqlCommands) {
    try {
      console.log(`Trying: ${sql}`);
      const result = await executeSQL(sql);
      console.log('Response:', result.status, result.data);
      
      if (result.status === 200 || result.status === 201) {
        console.log('✅ SUCCESS: Column may have been added!');
        break;
      }
    } catch (error) {
      console.log('API error:', error.message);
    }
  }
  
  // Final verification
  setTimeout(async () => {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(`https://${projectRef}.supabase.co`, serviceKey);
    
    const { data, error } = await supabase
      .from('case_study_requests')
      .select('scoring_schema_url')
      .limit(1);
      
    if (!error) {
      console.log('🎉 FINAL SUCCESS: Column exists and Excel upload is ready!');
    } else {
      console.log('❌ Manual intervention still required');
      console.log('Please add the column manually in Supabase Dashboard');
    }
  }, 2000);
}

main().catch(console.error);
