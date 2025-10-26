// Test the Edge Function directly using curl
const { exec } = require('child_process');

const testData = {
  email: 'blush6559@tiffincrane.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'instructor',
  legalArea: 'Zivilrecht'
};

console.log('🧪 Testing send-welcome-email Edge Function directly...');
console.log('📧 Test data:', testData);

// Note: This requires the SUPABASE_SERVICE_ROLE_KEY environment variable
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('💡 You can find this key in your Supabase project settings');
  process.exit(1);
}

const curlCommand = `curl -X POST \\
  'https://rpgbyockvpannrupicno.supabase.co/functions/v1/send-welcome-email' \\
  -H 'Authorization: Bearer ${serviceKey}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(testData)}'`;

console.log('🔄 Executing curl command...');

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Curl error:', error);
    return;
  }
  
  if (stderr) {
    console.error('❌ Stderr:', stderr);
  }
  
  try {
    const result = JSON.parse(stdout);
    console.log('✅ Edge Function response:', result);
  } catch (parseError) {
    console.log('📄 Raw response:', stdout);
  }
});
