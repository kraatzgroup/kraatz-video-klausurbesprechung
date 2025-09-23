#!/usr/bin/env node

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
});

async function fixInstructorSubmissionsPolicy() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Add missing INSERT policy for instructors on submissions table
    const addInsertPolicyQuery = `
      CREATE POLICY "Instructors can create submissions" ON public.submissions
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin', 'springer')
          )
        );
    `;

    console.log('🔧 Adding INSERT policy for instructors on submissions table...');
    await client.query(addInsertPolicyQuery);
    console.log('✅ INSERT policy added successfully');

    // Also check if we need to update the existing UPDATE policy to include 'springer'
    const updatePolicyQuery = `
      DROP POLICY IF EXISTS "Instructors can update submissions" ON public.submissions;
      
      CREATE POLICY "Instructors can update submissions" ON public.submissions
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin', 'springer')
          )
        );
    `;

    console.log('🔧 Updating UPDATE policy to include springer role...');
    await client.query(updatePolicyQuery);
    console.log('✅ UPDATE policy updated successfully');

    console.log('🎉 All policies fixed! Instructors can now save grades.');

  } catch (error) {
    console.error('❌ Error fixing instructor submissions policy:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the fix
fixInstructorSubmissionsPolicy();
