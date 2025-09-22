require('dotenv').config();
const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: connectionString: process.env.DATABASE_URL || (() => {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
  })()
});

async function migrateToMultipleLegalAreas() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    console.log('🔄 Migrating to Multiple Legal Areas System');
    console.log('=' .repeat(50));

    // 1. Add new column for multiple legal areas
    console.log('\n1. 📊 Adding new legal_areas column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS legal_areas TEXT[] DEFAULT NULL;
    `);
    console.log('   ✅ legal_areas column added (TEXT array)');

    // 2. Migrate existing data from instructor_legal_area to legal_areas
    console.log('\n2. 🔄 Migrating existing legal area data...');
    
    // Get users with existing legal areas
    const { rows: usersWithLegalAreas } = await client.query(`
      SELECT id, email, role, instructor_legal_area 
      FROM users 
      WHERE instructor_legal_area IS NOT NULL
    `);

    console.log(`   Found ${usersWithLegalAreas.length} users with legal areas to migrate:`);

    for (const user of usersWithLegalAreas) {
      // Convert single legal area to array
      await client.query(`
        UPDATE users 
        SET legal_areas = ARRAY[$1::TEXT]
        WHERE id = $2
      `, [user.instructor_legal_area, user.id]);
      
      console.log(`   ✅ ${user.email} (${user.role}): ${user.instructor_legal_area} → [${user.instructor_legal_area}]`);
    }

    // 3. Update constraints to work with arrays
    console.log('\n3. ⚖️ Updating database constraints...');
    
    // Drop old constraint
    await client.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_instructor_legal_area_check;
    `);
    
    // Add new constraint for array values
    await client.query(`
      ALTER TABLE users 
      ADD CONSTRAINT users_legal_areas_check 
      CHECK (
        (role IN ('student', 'admin') AND legal_areas IS NULL) OR
        (role IN ('instructor', 'springer') AND legal_areas IS NOT NULL AND 
         array_length(legal_areas, 1) > 0 AND
         legal_areas <@ ARRAY['Zivilrecht', 'Strafrecht', 'Öffentliches Recht']::TEXT[])
      );
    `);
    console.log('   ✅ New constraint added for legal_areas array');

    // 4. Test the new system
    console.log('\n4. 🧪 Testing multi-legal-area assignments...');
    
    // Find a test user (instructor or springer)
    const { rows: testUsers } = await client.query(`
      SELECT id, email, role, legal_areas 
      FROM users 
      WHERE role IN ('instructor', 'springer') 
      LIMIT 1
    `);

    if (testUsers.length > 0) {
      const testUser = testUsers[0];
      console.log(`   Testing with user: ${testUser.email} (${testUser.role})`);
      
      // Test adding multiple legal areas
      const testAreas = ['Zivilrecht', 'Strafrecht'];
      await client.query(`
        UPDATE users 
        SET legal_areas = $1::TEXT[]
        WHERE id = $2
      `, [testAreas, testUser.id]);
      
      // Verify the update
      const { rows: updatedUser } = await client.query(`
        SELECT legal_areas FROM users WHERE id = $1
      `, [testUser.id]);
      
      console.log(`   ✅ Test successful: ${testUser.email} now has areas: [${updatedUser[0].legal_areas.join(', ')}]`);
      
      // Restore original area
      await client.query(`
        UPDATE users 
        SET legal_areas = $1::TEXT[]
        WHERE id = $2
      `, [testUser.legal_areas, testUser.id]);
      console.log(`   🔄 Restored original areas for ${testUser.email}`);
    }

    // 5. Show current state
    console.log('\n5. 📋 Current Legal Area Assignments:');
    const { rows: allUsersWithAreas } = await client.query(`
      SELECT 
        email, 
        role, 
        legal_areas,
        instructor_legal_area as old_area
      FROM users 
      WHERE legal_areas IS NOT NULL OR instructor_legal_area IS NOT NULL
      ORDER BY role, email
    `);

    allUsersWithAreas.forEach(user => {
      const areas = user.legal_areas ? `[${user.legal_areas.join(', ')}]` : 'NULL';
      console.log(`   ${user.role.toUpperCase()}: ${user.email}`);
      console.log(`     New: ${areas}`);
      console.log(`     Old: ${user.old_area || 'NULL'}`);
      console.log('');
    });

    // 6. Recommendations for next steps
    console.log('💡 Next Steps:');
    console.log('   1. Update TypeScript interfaces to use string[] for legal_areas');
    console.log('   2. Modify admin interface to support multi-select for legal areas');
    console.log('   3. Update notification logic to handle multiple areas');
    console.log('   4. Test the system thoroughly');
    console.log('   5. Consider removing old instructor_legal_area column after verification');

    console.log('\n✅ Migration to Multiple Legal Areas completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Added legal_areas TEXT[] column');
    console.log('   - Migrated existing data from instructor_legal_area');
    console.log('   - Updated database constraints');
    console.log('   - System ready for multi-area assignments');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
migrateToMultipleLegalAreas()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
