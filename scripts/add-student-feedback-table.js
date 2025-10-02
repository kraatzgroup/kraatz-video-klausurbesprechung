const { Client } = require('pg')

async function addStudentFeedbackTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
  })

  try {
    await client.connect()
    console.log('🔌 Connected to PostgreSQL database')

    // Create student_feedback table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS student_feedback (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        case_study_id UUID NOT NULL REFERENCES case_study_requests(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mistakes_learned TEXT NOT NULL,
        improvements_planned TEXT NOT NULL,
        review_date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure one feedback per case study per user
        UNIQUE(case_study_id, user_id)
      );
    `

    console.log('📝 Creating student_feedback table...')
    await client.query(createTableQuery)
    console.log('✅ student_feedback table created successfully')

    // Add indexes for better performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_student_feedback_case_study_id ON student_feedback(case_study_id);',
      'CREATE INDEX IF NOT EXISTS idx_student_feedback_user_id ON student_feedback(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_student_feedback_review_date ON student_feedback(review_date);'
    ]

    console.log('📊 Creating indexes...')
    for (const query of indexQueries) {
      await client.query(query)
    }
    console.log('✅ Indexes created successfully')

    // Add RLS (Row Level Security) policies
    const rlsPolicies = [
      'ALTER TABLE student_feedback ENABLE ROW LEVEL SECURITY;',
      `CREATE POLICY "Users can view their own feedback" ON student_feedback FOR SELECT USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can insert their own feedback" ON student_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `CREATE POLICY "Users can update their own feedback" ON student_feedback FOR UPDATE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Users can delete their own feedback" ON student_feedback FOR DELETE USING (auth.uid() = user_id);`,
      `CREATE POLICY "Instructors can view feedback for their legal area" ON student_feedback FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM case_study_requests csr
          JOIN users u ON u.id = auth.uid()
          WHERE csr.id = student_feedback.case_study_id
          AND u.role IN ('instructor', 'springer')
          AND u.instructor_legal_area = csr.legal_area
        )
      );`,
      `CREATE POLICY "Admins can view all feedback" ON student_feedback FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role = 'admin'
        )
      );`
    ]

    console.log('🔒 Setting up RLS policies...')
    for (const policy of rlsPolicies) {
      try {
        await client.query(policy)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  Policy already exists, skipping...')
        } else {
          throw error
        }
      }
    }
    console.log('✅ RLS policies configured successfully')

    // Add comments for documentation
    const commentQueries = [
      `COMMENT ON TABLE student_feedback IS 'Stores student self-reflection feedback after exam corrections';`,
      `COMMENT ON COLUMN student_feedback.mistakes_learned IS 'What the student learned from their mistakes';`,
      `COMMENT ON COLUMN student_feedback.improvements_planned IS 'What the student plans to improve in future';`,
      `COMMENT ON COLUMN student_feedback.review_date IS 'When the student plans to review the content again';`
    ]

    console.log('📝 Adding table documentation...')
    for (const query of commentQueries) {
      await client.query(query)
    }
    console.log('✅ Documentation added successfully')

    console.log('🎉 Student feedback table setup completed successfully!')

  } catch (error) {
    console.error('❌ Error setting up student feedback table:', error)
    throw error
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the migration
if (require.main === module) {
  addStudentFeedbackTable()
    .then(() => {
      console.log('✅ Migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    })
}

module.exports = { addStudentFeedbackTable }
