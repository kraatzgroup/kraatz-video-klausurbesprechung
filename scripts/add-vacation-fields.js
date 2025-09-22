require('dotenv').config();
const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: connectionString: process.env.DATABASE_URL || (() => {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
  })()
});

async function addVacationFields() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    console.log('🏖️ Adding vacation fields to users table');
    console.log('=' .repeat(50));

    // 1. Add vacation start date column
    console.log('\n1. 📅 Adding vacation_start_date column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS vacation_start_date DATE DEFAULT NULL;
    `);
    console.log('   ✅ vacation_start_date column added');

    // 2. Add vacation end date column
    console.log('\n2. 📅 Adding vacation_end_date column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS vacation_end_date DATE DEFAULT NULL;
    `);
    console.log('   ✅ vacation_end_date column added');

    // 3. Add vacation reason column (optional)
    console.log('\n3. 📝 Adding vacation_reason column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS vacation_reason TEXT DEFAULT NULL;
    `);
    console.log('   ✅ vacation_reason column added');

    // 4. Create index for efficient vacation queries
    console.log('\n4. 🔍 Creating vacation date indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_vacation_dates 
      ON users (vacation_start_date, vacation_end_date) 
      WHERE vacation_start_date IS NOT NULL;
    `);
    console.log('   ✅ Vacation date index created');

    // 5. Show current schema
    console.log('\n5. 📋 Current users table schema (vacation fields):');
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE '%vacation%'
      ORDER BY ordinal_position;
    `);

    if (columns.length > 0) {
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'NULL'})`);
      });
    } else {
      console.log('   No vacation columns found');
    }

    console.log('\n✅ Vacation fields added successfully!');
    console.log('📋 Summary:');
    console.log('   - vacation_start_date: DATE (for planned vacation start)');
    console.log('   - vacation_end_date: DATE (for planned vacation end)');
    console.log('   - vacation_reason: TEXT (optional reason/note)');
    console.log('   - Index created for efficient date range queries');

  } catch (error) {
    console.error('❌ Error adding vacation fields:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
addVacationFields()
  .then(() => {
    console.log('🎉 Vacation fields migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
