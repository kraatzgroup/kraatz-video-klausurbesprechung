/**
 * Direct PostgreSQL Migration: Add support for multiple additional materials
 * 
 * This script uses direct PostgreSQL connection to add a new column 
 * 'additional_materials' as JSONB to store multiple additional material files.
 * 
 * Each material object will have:
 * - id: unique identifier
 * - filename: original filename
 * - url: storage URL
 * - uploaded_at: timestamp
 * - size: file size in bytes
 */

const { Client } = require('pg');

// Load environment variables
require('dotenv').config();

// PostgreSQL connection string from memory
const connectionString = 'postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function migrateMultipleAdditionalMaterials() {
  console.log('🚀 Starting PostgreSQL migration: Add multiple additional materials support...');

  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');

    // 1. Add new JSONB column for multiple additional materials
    console.log('📝 Adding additional_materials JSONB column...');
    
    await client.query(`
      ALTER TABLE case_study_requests 
      ADD COLUMN IF NOT EXISTS additional_materials JSONB DEFAULT '[]'::jsonb;
    `);

    console.log('✅ additional_materials column added successfully');

    // 2. Migrate existing additional_materials_url data to new format
    console.log('🔄 Migrating existing additional materials data...');

    const existingRequestsResult = await client.query(`
      SELECT id, additional_materials_url 
      FROM case_study_requests 
      WHERE additional_materials_url IS NOT NULL
    `);

    const existingRequests = existingRequestsResult.rows;
    console.log(`📊 Found ${existingRequests.length} requests with existing additional materials`);

    // Migrate each existing URL to new format
    for (const request of existingRequests) {
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

        await client.query(`
          UPDATE case_study_requests 
          SET additional_materials = $1 
          WHERE id = $2
        `, [JSON.stringify([materialObject]), request.id]);

        console.log(`✅ Migrated additional material for request ${request.id}`);
      }
    }

    // 3. Add comment to document the new column
    console.log('📝 Adding column documentation...');
    
    await client.query(`
      COMMENT ON COLUMN case_study_requests.additional_materials IS 
      'JSONB array storing multiple additional material files. Each object contains: id, filename, url, uploaded_at, size';
    `);

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('- ✅ Added additional_materials JSONB column');
    console.log(`- ✅ Migrated ${existingRequests.length} existing additional materials`);
    console.log('- ✅ Added column documentation');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('1. Update frontend components for multiple file upload');
    console.log('2. Test multiple file upload functionality');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Execute migration
migrateMultipleAdditionalMaterials();
