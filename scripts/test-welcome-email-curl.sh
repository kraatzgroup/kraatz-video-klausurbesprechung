#!/bin/bash

# Test the welcome email Edge Function directly with curl
# This bypasses the Node.js client authentication issues

echo "🧪 Testing welcome email Edge Function with curl..."

# Test data
TEST_DATA='{
  "email": "yoshikorural@tiffincrane.com",
  "firstName": "Tim",
  "lastName": "Test",
  "role": "instructor",
  "legalArea": "Zivilrecht"
}'

echo "📧 Sending test welcome email with data:"
echo "$TEST_DATA"

# Make the request (you'll need to add the actual service role key)
curl -X POST \
  'https://rpgbyockvpannrupicno.supabase.co/functions/v1/send-welcome-email' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY_HERE' \
  -H 'Content-Type: application/json' \
  -d "$TEST_DATA"

echo ""
echo "✅ Test completed"
