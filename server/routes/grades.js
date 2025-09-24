// PostgreSQL-basierte Grade-Management Route
// Direkte PostgreSQL-Verbindung wie vom User bevorzugt

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// PostgreSQL-Verbindung mit User-bevorzugten Credentials
const pool = new Pool({
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.rpgbyockvpannrupicno',
  password: 'datenbankpasswort',
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware für Error-Handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware für Request-Logging
const logRequest = (req, res, next) => {
  console.log(`🐘 PostgreSQL Grade API: ${req.method} ${req.path}`, {
    body: req.body,
    timestamp: new Date().toISOString()
  });
  next();
};

// POST /api/grades/save - Grade speichern/updaten
router.post('/save', logRequest, asyncHandler(async (req, res) => {
  const { caseStudyId, grade, gradeText } = req.body;
  
  // Validierung
  if (!caseStudyId) {
    return res.status(400).json({
      success: false,
      error: 'caseStudyId ist erforderlich'
    });
  }
  
  if (grade !== null && (isNaN(grade) || grade < 0 || grade > 18)) {
    return res.status(400).json({
      success: false,
      error: 'Grade muss zwischen 0 und 18 liegen oder NULL sein'
    });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Prüfe ob Submission existiert
    const checkResult = await client.query(
      'SELECT id FROM submissions WHERE case_study_request_id = $1',
      [caseStudyId]
    );
    
    let result;
    
    if (checkResult.rows.length > 0) {
      // Update existing submission
      result = await client.query(`
        UPDATE submissions 
        SET 
          grade = $1,
          grade_text = $2,
          updated_at = NOW()
        WHERE case_study_request_id = $3
        RETURNING id, grade, grade_text, updated_at
      `, [grade, gradeText || null, caseStudyId]);
      
      console.log('✅ PostgreSQL Grade updated:', result.rows[0]);
      
    } else {
      // Insert new submission
      result = await client.query(`
        INSERT INTO submissions (
          case_study_request_id,
          file_url,
          file_type,
          status,
          grade,
          grade_text,
          submitted_at,
          corrected_at,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
        RETURNING id, grade, grade_text, created_at
      `, [
        caseStudyId,
        'postgres-auto-save',
        'pdf',
        'corrected',
        grade,
        gradeText || null
      ]);
      
      console.log('✅ PostgreSQL Grade created:', result.rows[0]);
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      action: checkResult.rows.length > 0 ? 'updated' : 'created',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL Grade save error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  } finally {
    client.release();
  }
}));

// GET /api/grades/:caseStudyId - Grade abrufen
router.get('/:caseStudyId', logRequest, asyncHandler(async (req, res) => {
  const { caseStudyId } = req.params;
  
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        id,
        case_study_request_id,
        grade,
        grade_text,
        status,
        corrected_at,
        updated_at
      FROM submissions 
      WHERE case_study_request_id = $1
    `, [caseStudyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Grade nicht gefunden'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ PostgreSQL Grade fetch error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
}));

// DELETE /api/grades/:caseStudyId - Grade löschen
router.delete('/:caseStudyId', logRequest, asyncHandler(async (req, res) => {
  const { caseStudyId } = req.params;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(`
      UPDATE submissions 
      SET 
        grade = NULL,
        grade_text = NULL,
        updated_at = NOW()
      WHERE case_study_request_id = $1
      RETURNING id, case_study_request_id
    `, [caseStudyId]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Grade nicht gefunden'
      });
    }
    
    await client.query('COMMIT');
    
    console.log('✅ PostgreSQL Grade deleted (set to NULL):', result.rows[0]);
    
    res.json({
      success: true,
      action: 'deleted',
      data: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL Grade delete error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
}));

// GET /api/grades/bulk/:instructorId - Alle Grades für Instructor
router.get('/bulk/:instructorId', logRequest, asyncHandler(async (req, res) => {
  const { instructorId } = req.params;
  
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        s.id,
        s.case_study_request_id,
        s.grade,
        s.grade_text,
        s.status,
        s.corrected_at,
        s.updated_at,
        csr.legal_area,
        csr.sub_area,
        csr.focus_area,
        u.first_name,
        u.last_name,
        u.email
      FROM submissions s
      JOIN case_study_requests csr ON s.case_study_request_id = csr.id
      JOIN users u ON csr.user_id = u.id
      WHERE csr.status IN ('under_review', 'corrected')
      ORDER BY s.updated_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ PostgreSQL Bulk grades fetch error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
}));

// POST /api/grades/batch - Batch Grade Updates
router.post('/batch', logRequest, asyncHandler(async (req, res) => {
  const { grades } = req.body; // Array of {caseStudyId, grade, gradeText}
  
  if (!Array.isArray(grades) || grades.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'grades Array ist erforderlich'
    });
  }
  
  const client = await pool.connect();
  const results = [];
  
  try {
    await client.query('BEGIN');
    
    for (const gradeData of grades) {
      const { caseStudyId, grade, gradeText } = gradeData;
      
      // Validierung für jeden Eintrag
      if (!caseStudyId) {
        throw new Error(`caseStudyId fehlt für Grade: ${JSON.stringify(gradeData)}`);
      }
      
      if (grade !== null && (isNaN(grade) || grade < 0 || grade > 18)) {
        throw new Error(`Ungültige Grade ${grade} für caseStudyId ${caseStudyId}`);
      }
      
      // UPSERT für jeden Eintrag
      const result = await client.query(`
        INSERT INTO submissions (
          case_study_request_id,
          file_url,
          file_type,
          status,
          grade,
          grade_text,
          submitted_at,
          corrected_at,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
        ON CONFLICT (case_study_request_id) 
        DO UPDATE SET 
          grade = EXCLUDED.grade,
          grade_text = EXCLUDED.grade_text,
          updated_at = NOW()
        RETURNING id, case_study_request_id, grade, grade_text
      `, [
        caseStudyId,
        'postgres-batch-save',
        'pdf',
        'corrected',
        grade,
        gradeText || null
      ]);
      
      results.push(result.rows[0]);
    }
    
    await client.query('COMMIT');
    
    console.log(`✅ PostgreSQL Batch update completed: ${results.length} grades`);
    
    res.json({
      success: true,
      action: 'batch_updated',
      data: results,
      count: results.length
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL Batch update error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      processed: results.length
    });
  } finally {
    client.release();
  }
}));

// Health Check
router.get('/health', asyncHandler(async (req, res) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT NOW() as timestamp, version() as version');
    
    res.json({
      success: true,
      status: 'healthy',
      database: {
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version,
        connection: 'active'
      },
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  } finally {
    client.release();
  }
}));

// Error Handler für diesen Router
router.use((error, req, res, next) => {
  console.error('❌ PostgreSQL Grades API Error:', error);
  
  res.status(500).json({
    success: false,
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
