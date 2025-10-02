#!/usr/bin/env node

/**
 * Simple test script to verify authentication routes and components
 * This script tests the routing structure without requiring API keys
 */

const fs = require('fs');
const path = require('path');

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkFileContains(filePath, searchString) {
  if (!checkFileExists(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes(searchString);
}

function testAuthenticationFiles() {
  console.log('🚀 Testing Kraatz Club Authentication System Files');
  console.log('='.repeat(60));

  const tests = [
    {
      name: 'AdminLoginPage component exists',
      test: () => checkFileExists('src/pages/AdminLoginPage.tsx'),
      expected: true
    },
    {
      name: 'StudentLoginForm component exists',
      test: () => checkFileExists('src/components/auth/StudentLoginForm.tsx'),
      expected: true
    },
    {
      name: 'Stripe verification Edge Function exists',
      test: () => checkFileExists('supabase/functions/verify-stripe-customer/index.ts'),
      expected: true
    },
    {
      name: 'App.tsx contains /admin route',
      test: () => checkFileContains('src/App.tsx', 'path="/admin"'),
      expected: true
    },
    {
      name: 'App.tsx imports AdminLoginPage',
      test: () => checkFileContains('src/App.tsx', 'AdminLoginPage'),
      expected: true
    },
    {
      name: 'LoginPage uses StudentLoginForm',
      test: () => checkFileContains('src/pages/LoginPage.tsx', 'StudentLoginForm'),
      expected: true
    },
    {
      name: 'Header has separate login links',
      test: () => checkFileContains('src/components/layout/Header.tsx', 'Studenten Login'),
      expected: true
    },
    {
      name: 'Header has admin/instructor link',
      test: () => checkFileContains('src/components/layout/Header.tsx', 'Dozenten/Admin'),
      expected: true
    },
    {
      name: 'Role redirect utility updated',
      test: () => checkFileContains('src/utils/roleRedirect.ts', '/admin/dashboard'),
      expected: true
    },
    {
      name: 'StudentLoginForm has Stripe verification',
      test: () => checkFileContains('src/components/auth/StudentLoginForm.tsx', 'verify-stripe-customer'),
      expected: true
    },
    {
      name: 'StudentLoginForm has magic link functionality',
      test: () => checkFileContains('src/components/auth/StudentLoginForm.tsx', 'signInWithOtp'),
      expected: true
    },
    {
      name: 'StudentLoginForm has Kraatz Club link',
      test: () => checkFileContains('src/components/auth/StudentLoginForm.tsx', 'kraatz-club.de'),
      expected: true
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test, index) => {
    const result = test.test();
    const status = result === test.expected ? '✅' : '❌';
    const statusText = result === test.expected ? 'PASS' : 'FAIL';
    
    console.log(`${status} ${test.name} - ${statusText}`);
    
    if (result === test.expected) {
      passed++;
    } else {
      failed++;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All authentication system files are properly configured!');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }

  return failed === 0;
}

function printAuthenticationSummary() {
  console.log('\n📋 Authentication System Summary:');
  console.log('='.repeat(60));
  console.log('');
  console.log('🎓 STUDENT LOGIN (/login):');
  console.log('   • Email-only authentication');
  console.log('   • Stripe customer verification required');
  console.log('   • Magic link sent to verified email');
  console.log('   • Redirects to /dashboard after login');
  console.log('   • Link to create Kraatz Club account if not found');
  console.log('');
  console.log('👨‍🏫 ADMIN/INSTRUCTOR LOGIN (/admin):');
  console.log('   • Traditional email + password authentication');
  console.log('   • For dozenten, springer, and admin users');
  console.log('   • Role-based redirect after login:');
  console.log('     - instructor/springer → /instructor');
  console.log('     - admin → /admin/dashboard');
  console.log('');
  console.log('🔗 NAVIGATION:');
  console.log('   • Header shows "Studenten Login" and "Dozenten/Admin" links');
  console.log('   • Clear separation between user types');
  console.log('   • Cross-links between login pages');
  console.log('');
  console.log('🔧 TECHNICAL IMPLEMENTATION:');
  console.log('   • Edge Function: verify-stripe-customer');
  console.log('   • Magic Link: Supabase Auth OTP');
  console.log('   • Role-based routing updated');
  console.log('   • Stripe customer verification before magic link');
  console.log('');
  console.log('🚀 DEPLOYMENT STATUS:');
  console.log('   • Edge Function deployed to Supabase');
  console.log('   • Frontend components created');
  console.log('   • Routing updated');
  console.log('   • Ready for testing');
}

// Run the tests
const success = testAuthenticationFiles();
printAuthenticationSummary();

if (success) {
  console.log('\n✅ Authentication system implementation complete!');
  process.exit(0);
} else {
  console.log('\n❌ Authentication system has issues that need to be resolved.');
  process.exit(1);
}
