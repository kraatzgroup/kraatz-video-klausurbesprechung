#!/bin/bash

# Test email notifications by calling the Edge Function directly
EDGE_FUNCTION_URL="https://rpgbyockvpannrupicno.supabase.co/functions/v1/notify-student"
TEST_EMAIL="charlenenowak@gmx.de"

# Get the test user ID from database
echo "🔍 Getting test user ID..."
USER_ID=$(psql postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres -t -c "SELECT id FROM users WHERE email = '$TEST_EMAIL' LIMIT 1;" | tr -d ' ')

if [ -z "$USER_ID" ]; then
    echo "❌ Test user not found. Creating user..."
    USER_ID=$(psql postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres -t -c "INSERT INTO users (email, first_name, last_name, role, account_credits) VALUES ('$TEST_EMAIL', 'Charlene', 'Nowak (Test)', 'student', 100) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id;" | tr -d ' ')
fi

echo "✅ Using test user ID: $USER_ID"

# Get existing test case study
echo "🔍 Getting test case study..."
CASE_ID=$(psql postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres -t -c "SELECT id FROM case_study_requests WHERE user_id = '$USER_ID' LIMIT 1;" | tr -d ' ')

if [ -z "$CASE_ID" ]; then
    echo "Creating new test case study..."
    CASE_ID=$(psql postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres -t -c "INSERT INTO case_study_requests (user_id, legal_area, sub_area, focus_area, status) VALUES ('$USER_ID', 'Zivilrecht', 'Vertragsrecht', 'Kaufvertrag', 'materials_ready') RETURNING id;" | tr -d ' ')
fi

echo "✅ Using case study ID: $CASE_ID"

echo ""
echo "📧 Testing all email notification scenarios for: $TEST_EMAIL"
echo "🔗 Edge Function URL: $EDGE_FUNCTION_URL"
echo ""

# Test Scenario 1: New Case Study Available
echo "🧪 Scenario 1: New Case Study Available..."
curl -X POST "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk" \
  -d "{
    \"type\": \"INSERT\",
    \"record\": {
      \"id\": \"test-1\",
      \"user_id\": \"$USER_ID\",
      \"title\": \"📚 Sachverhalt verfügbar\",
      \"message\": \"Ihr Sachverhalt für Zivilrecht - Vertragsrecht ist jetzt verfügbar und kann bearbeitet werden.\",
      \"type\": \"success\",
      \"related_case_study_id\": \"$CASE_ID\",
      \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"
    }
  }"

echo ""
sleep 3

# Test Scenario 2: Correction Available
echo "🧪 Scenario 2: Correction Available..."
curl -X POST "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk" \
  -d "{
    \"type\": \"INSERT\",
    \"record\": {
      \"id\": \"test-2\",
      \"user_id\": \"$USER_ID\",
      \"title\": \"🎓 Korrektur verfügbar\",
      \"message\": \"Die Korrektur für Zivilrecht - Vertragsrecht ist verfügbar. Schauen Sie sich das Video und die schriftliche Bewertung an.\",
      \"type\": \"success\",
      \"related_case_study_id\": \"$CASE_ID\",
      \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"
    }
  }"

echo ""
sleep 3

# Test Scenario 3: Submission Confirmed
echo "🧪 Scenario 3: Submission Confirmed..."
curl -X POST "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk" \
  -d "{
    \"type\": \"INSERT\",
    \"record\": {
      \"id\": \"test-3\",
      \"user_id\": \"$USER_ID\",
      \"title\": \"✅ Bearbeitung eingereicht\",
      \"message\": \"Ihre Bearbeitung wurde erfolgreich eingereicht. Die Korrektur erfolgt innerhalb von 48 Stunden.\",
      \"type\": \"info\",
      \"related_case_study_id\": \"$CASE_ID\",
      \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"
    }
  }"

echo ""
sleep 3

# Test Scenario 4: Case Study Completed
echo "🧪 Scenario 4: Case Study Completed..."
curl -X POST "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk" \
  -d "{
    \"type\": \"INSERT\",
    \"record\": {
      \"id\": \"test-4\",
      \"user_id\": \"$USER_ID\",
      \"title\": \"🎉 Klausur abgeschlossen\",
      \"message\": \"Ihre Klausur für Zivilrecht - Vertragsrecht wurde erfolgreich abgeschlossen. Herzlichen Glückwunsch!\",
      \"type\": \"success\",
      \"related_case_study_id\": \"$CASE_ID\",
      \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"
    }
  }"

echo ""
sleep 3

# Test Scenario 5: Correction in Progress
echo "🧪 Scenario 5: Correction in Progress..."
curl -X POST "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk" \
  -d "{
    \"type\": \"INSERT\",
    \"record\": {
      \"id\": \"test-5\",
      \"user_id\": \"$USER_ID\",
      \"title\": \"👨‍🏫 Korrektur in Bearbeitung\",
      \"message\": \"Ihr Dozent bearbeitet gerade Ihre Klausur. Die Korrektur wird bald verfügbar sein.\",
      \"type\": \"info\",
      \"related_case_study_id\": \"$CASE_ID\",
      \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"
    }
  }"

echo ""
sleep 3

# Test Scenario 6: Additional Materials Available
echo "🧪 Scenario 6: Additional Materials Available..."
curl -X POST "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk" \
  -d "{
    \"type\": \"INSERT\",
    \"record\": {
      \"id\": \"test-6\",
      \"user_id\": \"$USER_ID\",
      \"title\": \"📄 Zusätzliche Materialien verfügbar\",
      \"message\": \"Für Ihre Klausur stehen zusätzliche Materialien und Musterlösungen zur Verfügbar.\",
      \"type\": \"info\",
      \"related_case_study_id\": \"$CASE_ID\",
      \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"
    }
  }"

echo ""
echo "🎉 All test email scenarios completed!"
echo ""
echo "📬 Check the email inbox for: $TEST_EMAIL"
echo ""
echo "📋 Test scenarios sent:"
echo "   1. New Case Study Available"
echo "   2. Correction Available"
echo "   3. Submission Confirmed"
echo "   4. Case Study Completed"
echo "   5. Correction in Progress"
echo "   6. Additional Materials Available"
echo ""
echo "💡 You can also check the Supabase Edge Function logs in the dashboard:"
echo "   https://supabase.com/dashboard/project/rpgbyockvpannrupicno/functions"
