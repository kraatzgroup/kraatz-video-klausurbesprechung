/**
 * Database Migration: Add support for multiple additional materials
 * 
 * This script adds a new column 'additional_materials' as JSONB to store
 * multiple additional material files as an array of objects.
 * 
 * Each material object will have:
 * - id: unique identifier
 * - filename: original filename
 * - url: storage URL
 * - uploaded_at: timestamp
 * - size: file size in bytes
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- REACT_APP_SUPABASE_URL:', !!supabaseUrl);
  console.error('- REACT_APP_SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('');
  console.error('Please ensure your .env file contains:');
  console.error('REACT_APP_SUPABASE_URL=your_supabase_url');
  console.error('REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMultipleAdditionalMaterialsSupport() {
  console.log('🚀 Starting migration: Add multiple additional materials support...');

  try {
    // 1. Add new JSONB column for multiple additional materials
    console.log('📝 Adding additional_materials JSONB column...');
    
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE case_study_requests 
        ADD COLUMN IF NOT EXISTS additional_materials JSONB DEFAULT '[]'::jsonb;
      `
    });

    if (addColumnError) {
      console.error('❌ Error adding additional_materials column:', addColumnError);
      throw addColumnError;
    }

    console.log('✅ additional_materials column added successfully');

    // 2. Migrate existing additional_materials_url data to new format
    console.log('🔄 Migrating existing additional materials data...');

    const { data: existingRequests, error: fetchError } = await supabase
      .from('case_study_requests')
      .select('id, additional_materials_url')
      .not('additional_materials_url', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching existing requests:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${existingRequests?.length || 0} requests with existing additional materials`);

    // Migrate each existing URL to new format
    for (const request of existingRequests || []) {
      if (request.additional_materials_url) {
        // Extract filename from URL
        const urlParts = request.additional_materials_url.split('/');
        const filename = urlParts[urlParts.length - 1];
        const cleanFilename = filename.replace(/^zusatzmaterial_[^_]+_\d+_/, '').replace('.pdf', '') + '.pdf';

        const materialObject = {
          id: `material_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          filename: cleanFilename,
          url: request.additional_materials_url,
          uploaded_at: new Date().toISOString(),
          size: null // Size unknown for existing files
        };

        const { error: updateError } = await supabase
          .from('case_study_requests')
          .update({
            additional_materials: [materialObject]
          })
          .eq('id', request.id);

        if (updateError) {
          console.error(`❌ Error migrating data for request ${request.id}:`, updateError);
        } else {
          console.log(`✅ Migrated additional material for request ${request.id}`);
        }
      }
    }

    // 3. Add comment to document the new column
    console.log('📝 Adding column documentation...');
    
    const { error: commentError } = await supabase.rpc('exec_sql', {
      sql: `
        COMMENT ON COLUMN case_study_requests.additional_materials IS 
        'JSONB array storing multiple additional material files. Each object contains: id, filename, url, uploaded_at, size';
      `
    });

    if (commentError) {
      console.warn('⚠️ Warning: Could not add column comment:', commentError.message);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('- ✅ Added additional_materials JSONB column');
    console.log(`- ✅ Migrated ${existingRequests?.length || 0} existing additional materials`);
    console.log('- ✅ Added column documentation');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('1. Update TypeScript interfaces');
    console.log('2. Update frontend components');
    console.log('3. Test multiple file upload functionality');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Execute migration
addMultipleAdditionalMaterialsSupport();
