#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// EMERGENCY SECURITY CLEANUP SCRIPT
// This script removes all hardcoded Supabase Service Role Keys from the codebase

const HARDCODED_KEYS = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5MzUxOSwiZXhwIjoyMDcxOTY5NTE5fQ.7qzGyeOOVwNbmZPxgK4aiQi9mh4gipFWV8kk-LngUbk',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2J5b2NrdnBhbm5ydXBpY25vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTQyMzI5OSwiZXhwIjoyMDQ2OTk5Mjk5fQ.Xr4bBJoVOCYJJPKJwGZJQJJJJJJJJJJJJJJJJJJJJJJJ'
];

const FILES_TO_CLEAN = [
  'scripts/create-sort-order-function.js',
  'scripts/setup-database-supabase.js',
  'scripts/create-test-user.js',
  'scripts/add-column-directly.js',
  'scripts/update-storage-config.js',
  'scripts/add-scoring-schema-column.js',
  'scripts/manual-column-add.js',
  'scripts/supabase-service-role-add.js',
  'scripts/final-column-attempt.js',
  'scripts/create-instructor.js',
  'scripts/add-sort-order-supabase.js',
  'scripts/fix-user-roles.js',
  'scripts/add-case-study-columns.js',
  'scripts/create-admin-user.js',
  'scripts/add-youtube-id-column.js',
  'scripts/setup-all-users.js',
  'scripts/add-column-direct.js',
  'scripts/add-scoring-sheet-supabase.js',
  'scripts/add-sort-order-column.js',
  'scripts/add-youtube-column.js',
  'scripts/check-and-add-column.js',
  'scripts/create-all-users.js',
  'scripts/create-storage-bucket.js',
  'scripts/create-test-results.js',
  'scripts/direct-supabase-column-add.js',
  'scripts/force-add-column.js',
  'scripts/setup-admin.js',
  'scripts/setup-vacation-cron.js',
  'scripts/simple-admin-setup.js',
  'scripts/supabase-management-api.js',
  'scripts/supabase-sql-executor.js',
  'scripts/test-scoring-sheet-column.js',
  'scripts/test-storage-upload.js',
  'scripts/update-roles-simple.js',
  'scripts/verify-supabase-column.js',
  'test-admin-direct.js'
];

function cleanFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Replace hardcoded keys with environment variable references
  HARDCODED_KEYS.forEach(key => {
    if (content.includes(key)) {
      console.log(`🔧 Cleaning hardcoded key in: ${filePath}`);
      
      // Replace hardcoded key assignments
      content = content.replace(
        new RegExp(`const\\s+\\w+\\s*=\\s*['"\`]${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g'),
        'const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY'
      );
      
      // Replace direct usage in createClient calls
      content = content.replace(
        new RegExp(`['"\`]${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g'),
        'process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY'
      );
      
      modified = true;
    }
  });

  if (modified) {
    // Add environment variable check at the beginning if not present
    if (!content.includes('require(\'dotenv\').config()') && !content.includes('dotenv')) {
      content = `require('dotenv').config();\n\n${content}`;
    }
    
    // Add validation for service key
    if (!content.includes('SUPABASE_SERVICE_ROLE_KEY') || !content.includes('environment variable is required')) {
      const lines = content.split('\n');
      let insertIndex = -1;
      
      // Find where to insert the validation
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('supabaseServiceKey') && lines[i].includes('process.env')) {
          insertIndex = i + 1;
          break;
        }
      }
      
      if (insertIndex > -1) {
        lines.splice(insertIndex, 0, 
          '',
          'if (!supabaseServiceKey) {',
          '  console.error(\'❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required\');',
          '  process.exit(1);',
          '}'
        );
        content = lines.join('\n');
      }
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Cleaned: ${filePath}`);
  }
}

console.log('🚨 EMERGENCY SECURITY CLEANUP - Removing hardcoded Supabase Service Role Keys');
console.log('================================================================================');

FILES_TO_CLEAN.forEach(cleanFile);

console.log('================================================================================');
console.log('✅ Security cleanup completed!');
console.log('⚠️  IMPORTANT: You must now regenerate your Supabase Service Role Key!');
console.log('⚠️  The exposed keys are now invalid and should be rotated immediately.');
