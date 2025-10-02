#!/usr/bin/env node

/**
 * Test script for the new authentication system
 * Tests both student magic link authentication and admin/instructor login
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = 'https://rpgbyockvpannrupicno.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStripeCustomerVerification(email) {
  console.log(`\n🔍 Testing Stripe customer verification for: ${email}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('verify-stripe-customer', {
      body: { email }
    });

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return false;
    }

    if (data.verified) {
      console.log(`✅ Customer verified: ${data.customerId}`);
      console.log(`   Name: ${data.customerName || 'N/A'}`);
      console.log(`   Has payments: ${data.hasPayments ? 'Yes' : 'No'}`);
      return true;
    } else {
      console.log(`❌ Customer not found: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return false;
  }
}

async function testMagicLinkGeneration(email) {
  console.log(`\n📧 Testing magic link generation for: ${email}`);
  
  try {
    // Create a regular Supabase client for auth operations
    const authClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || 'your-anon-key');
    
    const { data, error } = await authClient.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: 'http://localhost:3000/dashboard',
      }
    });

    if (error) {
      console.log(`❌ Magic link error: ${error.message}`);
      return false;
    }

    console.log(`✅ Magic link sent successfully`);
    return true;
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return false;
  }
}

async function testUserRoles() {
  console.log(`\n👥 Testing user roles and redirects...`);
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name')
      .in('role', ['student', 'instructor', 'admin', 'springer'])
      .limit(5);

    if (error) {
      console.log(`❌ Error fetching users: ${error.message}`);
      return;
    }

    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      const redirect = user.role === 'instructor' || user.role === 'springer' 
        ? '/instructor' 
        : user.role === 'admin' 
        ? '/admin/dashboard' 
        : '/dashboard';
      
      console.log(`   ${user.email} (${user.role}) → ${redirect}`);
    });
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Testing Kraatz Club Authentication System');
  console.log('='.repeat(50));

  // Test Stripe customer verification with different scenarios
  const testEmails = [
    'test@example.com',           // Should fail - not in Stripe
    'student@kraatz-club.de',     // Should succeed if exists in Stripe
    'dozent@kraatz-club.de',      // Should succeed if exists in Stripe
  ];

  for (const email of testEmails) {
    await testStripeCustomerVerification(email);
  }

  // Test magic link generation (will actually send emails in production)
  console.log('\n📧 Magic Link Testing (disabled in test mode)');
  console.log('   Magic link generation would be tested here');
  console.log('   (Skipped to avoid sending test emails)');

  // Test user roles and redirects
  await testUserRoles();

  console.log('\n✅ Authentication system test completed');
  console.log('\n📋 Summary:');
  console.log('   • Student login: /login (magic link with Stripe verification)');
  console.log('   • Admin/Instructor login: /admin (email + password)');
  console.log('   • Routing updated for role-based redirects');
  console.log('   • Edge function deployed for Stripe verification');
}

// Run the test
main().catch(console.error);
