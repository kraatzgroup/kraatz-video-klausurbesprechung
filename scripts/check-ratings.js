const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ REACT_APP_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRatings() {
  console.log('🔍 Checking case_study_ratings table...\n');

  try {
    // Check total count
    const { count, error: countError } = await supabase
      .from('case_study_ratings')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting ratings:', countError);
      return;
    }

    console.log(`📊 Total ratings in database: ${count}\n`);

    if (count === 0) {
      console.log('ℹ️  No ratings found in the database.');
      return;
    }

    // Fetch all ratings with related data
    const { data: ratings, error } = await supabase
      .from('case_study_ratings')
      .select(`
        id,
        rating,
        feedback,
        created_at,
        user_id,
        case_study_id,
        users!inner(id, first_name, last_name, email),
        case_study_requests!case_study_id(
          id,
          legal_area,
          sub_area,
          focus_area,
          assigned_instructor_id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching ratings:', error);
      return;
    }

    console.log('✅ Ratings found:\n');
    ratings.forEach((rating, index) => {
      console.log(`${index + 1}. Rating ID: ${rating.id}`);
      console.log(`   Student: ${rating.users.first_name} ${rating.users.last_name} (${rating.users.email})`);
      console.log(`   Rating: ${rating.rating}/5 ⭐`);
      console.log(`   Feedback: ${rating.feedback || 'No feedback'}`);
      console.log(`   Case Study: ${rating.case_study_requests.legal_area} - ${rating.case_study_requests.sub_area}`);
      console.log(`   Created: ${new Date(rating.created_at).toLocaleString('de-DE')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRatings();
