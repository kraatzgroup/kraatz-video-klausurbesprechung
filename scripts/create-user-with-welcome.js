// Create a test user using the admin utils which will automatically send welcome email
const { createUserAsAdmin } = require('../src/utils/adminUtils.ts');

async function createTestUserWithWelcome() {
  try {
    console.log('🧪 Creating test user with welcome email...');

    const userData = {
      email: 'blush6559@tiffincrane.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'instructor',
      instructorLegalArea: 'Zivilrecht'
    };

    console.log('👤 Creating user with data:', userData);

    const result = await createUserAsAdmin(userData);

    if (result.success) {
      console.log('✅ User created successfully:', result.message);
      console.log('📧 Welcome email should have been sent automatically');
      console.log('👤 Created user:', result.createdUser);
    } else {
      console.error('❌ User creation failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

createTestUserWithWelcome();
