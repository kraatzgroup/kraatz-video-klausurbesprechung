require('dotenv').config();
const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: connectionString: process.env.DATABASE_URL || (() => {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
  })()
});

async function createTestSpringer() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    console.log('🏃‍♂️ Creating Test Springer Users');
    console.log('=' .repeat(40));

    const springerUsers = [
      {
        email: 'springer-zivilrecht@kraatz-club.de',
        first_name: 'Max',
        last_name: 'Springer-Zivil',
        legal_area: 'Zivilrecht'
      },
      {
        email: 'springer-strafrecht@kraatz-club.de',
        first_name: 'Anna',
        last_name: 'Springer-Straf',
        legal_area: 'Strafrecht'
      },
      {
        email: 'springer-oeffentlich@kraatz-club.de',
        first_name: 'Tom',
        last_name: 'Springer-Öffentlich',
        legal_area: 'Öffentliches Recht'
      }
    ];

    for (const springer of springerUsers) {
      console.log(`\n📝 Creating springer for ${springer.legal_area}:`);
      
      // Check if user already exists
      const { rows: existingUser } = await client.query(`
        SELECT id, email FROM users WHERE email = $1
      `, [springer.email]);

      if (existingUser.length > 0) {
        console.log(`   ⚠️ User ${springer.email} already exists, updating role...`);
        
        // Update existing user to springer role
        await client.query(`
          UPDATE users 
          SET 
            role = 'springer',
            instructor_legal_area = $1,
            email_notifications_enabled = true,
            updated_at = NOW()
          WHERE email = $2
        `, [springer.legal_area, springer.email]);
        
        console.log(`   ✅ Updated ${springer.email} to springer role`);
      } else {
        console.log(`   ✨ Creating new user ${springer.email}...`);
        
        // Generate a UUID for the new user
        const { rows: uuidResult } = await client.query('SELECT gen_random_uuid() as id');
        const userId = uuidResult[0].id;
        
        // Insert new springer user
        await client.query(`
          INSERT INTO users (
            id, 
            email, 
            first_name, 
            last_name, 
            role, 
            instructor_legal_area,
            email_notifications_enabled,
            account_credits,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, 'springer', $5, true, 0, NOW(), NOW())
        `, [userId, springer.email, springer.first_name, springer.last_name, springer.legal_area]);
        
        console.log(`   ✅ Created new springer user: ${springer.first_name} ${springer.last_name}`);
      }
      
      console.log(`   📧 Email: ${springer.email}`);
      console.log(`   ⚖️ Legal Area: ${springer.legal_area}`);
      console.log(`   🔔 Notifications: Enabled`);
    }

    // Verify the creation
    console.log('\n🔍 Verification - Current Springer Users:');
    const { rows: allSpringer } = await client.query(`
      SELECT 
        email, 
        first_name, 
        last_name, 
        instructor_legal_area,
        email_notifications_enabled,
        created_at
      FROM users 
      WHERE role = 'springer'
      ORDER BY instructor_legal_area
    `);

    allSpringer.forEach(springer => {
      const notifications = springer.email_notifications_enabled ? '🔔 enabled' : '🔕 disabled';
      console.log(`   🏃‍♂️ ${springer.first_name} ${springer.last_name}`);
      console.log(`     📧 ${springer.email}`);
      console.log(`     ⚖️ ${springer.instructor_legal_area}`);
      console.log(`     📅 Created: ${springer.created_at.toLocaleDateString('de-DE')}`);
      console.log(`     🔔 Notifications: ${notifications}`);
      console.log('');
    });

    // Test notification routing after creation
    console.log('🎯 Testing Notification Routing After Springer Creation:');
    const legalAreas = ['Zivilrecht', 'Strafrecht', 'Öffentliches Recht'];
    
    for (const area of legalAreas) {
      console.log(`\n   📚 ${area}:`);
      
      // Check active instructors
      const { rows: activeInstructors } = await client.query(`
        SELECT email, first_name, last_name 
        FROM users 
        WHERE role = 'instructor' 
        AND instructor_legal_area = $1 
        AND COALESCE(email_notifications_enabled, true) = true
      `, [area]);

      // Check available springer
      const { rows: availableSpringer } = await client.query(`
        SELECT email, first_name, last_name 
        FROM users 
        WHERE role = 'springer' 
        AND instructor_legal_area = $1 
        AND COALESCE(email_notifications_enabled, true) = true
      `, [area]);

      if (activeInstructors.length > 0) {
        console.log(`     ✅ ${activeInstructors.length} active instructor(s) - primary notification target`);
        console.log(`     🔄 ${availableSpringer.length} springer available as backup`);
      } else {
        console.log(`     ⚠️ No active instructors`);
        if (availableSpringer.length > 0) {
          console.log(`     ✅ ${availableSpringer.length} springer will receive notifications`);
        } else {
          console.log(`     ❌ No springer available!`);
        }
      }
    }

    console.log('\n✅ Test Springer Users Created Successfully!');
    console.log('📋 Next Steps:');
    console.log('   1. Test the notification system by submitting a case study');
    console.log('   2. Deactivate instructor notifications to test springer fallback');
    console.log('   3. Use the Settings page to toggle email notifications');

  } catch (error) {
    console.error('❌ Error creating test springer:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
createTestSpringer()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
