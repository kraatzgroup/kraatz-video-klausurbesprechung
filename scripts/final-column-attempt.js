require('dotenv').config();

const https = require('https');

// Supabase project details
const projectRef = 'rpgbyockvpannrupicno';
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function addColumnViaAPI() {
  const sql = 'ALTER TABLE case_study_requests ADD COLUMN IF NOT EXISTS scoring_schema_url TEXT;';
  
  const postData = JSON.stringify({ query: sql });
  
  const options = {
    hostname: `${projectRef}.supabase.co`,
    port: 443,
    path: '/rest/v1/rpc/query',
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
        console.log('Response status:', res.statusCode);
        console.log('Response data:', data);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log('Attempting to add scoring_schema_url column via HTTPS API...');
    
    const result = await addColumnViaAPI();
    
    if (result.status === 200 || result.status === 201) {
      console.log('✅ Column may have been added successfully!');
    } else {
      console.log('❌ API call failed');
    }
    
    // Wait a moment then verify
    setTimeout(async () => {
      console.log('\nVerifying column exists...');
      
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        'https://rpgbyockvpannrupicno.supabase.co',
        serviceKey
      );
      
      const { data, error } = await supabase
        .from('case_study_requests')
        .select('scoring_schema_url')
        .limit(1);
        
      if (!error) {
        console.log('✅ SUCCESS: Column exists and is accessible!');
      } else {
        console.log('❌ Verification failed:', error.message);
        console.log('\n🔧 Manual steps required:');
        console.log('1. Open: https://supabase.com/dashboard/project/rpgbyockvpannrupicno/editor');
        console.log('2. Go to SQL Editor');
        console.log('3. Run: ALTER TABLE case_study_requests ADD COLUMN scoring_schema_url TEXT;');
        console.log('4. Or use Table Editor to add the column manually');
      }
    }, 3000);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
