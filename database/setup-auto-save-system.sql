-- PostgreSQL Setup für Auto-Save Grade System
-- Direkte PostgreSQL-Verbindung wie vom User bevorzugt
-- Connection: postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres

-- 1. Erweitere submissions-Tabelle um Grade-Spalten
DO $$
BEGIN
  -- Füge grade Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'grade'
  ) THEN
    ALTER TABLE submissions ADD COLUMN grade NUMERIC;
    RAISE NOTICE 'Added grade column to submissions table';
  END IF;
  
  -- Füge grade_text Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'grade_text'
  ) THEN
    ALTER TABLE submissions ADD COLUMN grade_text TEXT;
    RAISE NOTICE 'Added grade_text column to submissions table';
  END IF;
  
  -- Füge updated_at Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE submissions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to submissions table';
  END IF;
END
$$;

-- 2. Erstelle Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_submissions_case_study_request_id 
ON submissions(case_study_request_id);

CREATE INDEX IF NOT EXISTS idx_submissions_grade 
ON submissions(grade) WHERE grade IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_submissions_updated_at 
ON submissions(updated_at);

-- 3. Auto-Save UPSERT Funktion
CREATE OR REPLACE FUNCTION upsert_grade(
  p_case_study_request_id TEXT,
  p_grade NUMERIC DEFAULT NULL,
  p_grade_text TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_submission_id UUID;
  v_action TEXT;
BEGIN
  -- Validierung
  IF p_case_study_request_id IS NULL OR p_case_study_request_id = '' THEN
    RAISE EXCEPTION 'case_study_request_id darf nicht leer sein';
  END IF;
  
  IF p_grade IS NOT NULL AND (p_grade < 0 OR p_grade > 18) THEN
    RAISE EXCEPTION 'Grade muss zwischen 0 und 18 liegen oder NULL sein';
  END IF;
  
  -- Prüfe ob Submission existiert
  SELECT id INTO v_submission_id
  FROM submissions
  WHERE case_study_request_id = p_case_study_request_id;
  
  IF v_submission_id IS NOT NULL THEN
    -- Update existing submission
    UPDATE submissions
    SET 
      grade = p_grade,
      grade_text = p_grade_text,
      updated_at = NOW()
    WHERE case_study_request_id = p_case_study_request_id;
    
    v_action := 'updated';
    
    RAISE NOTICE 'Updated grade for submission %: grade=%, grade_text=%', 
                 v_submission_id, p_grade, p_grade_text;
  ELSE
    -- Insert new submission
    INSERT INTO submissions (
      case_study_request_id,
      file_url,
      file_type,
      status,
      grade,
      grade_text,
      submitted_at,
      corrected_at,
      created_at,
      updated_at
    ) VALUES (
      p_case_study_request_id,
      'auto-save-placeholder',
      'pdf',
      'corrected',
      p_grade,
      p_grade_text,
      NOW(),
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_submission_id;
    
    v_action := 'created';
    
    RAISE NOTICE 'Created new submission %: grade=%, grade_text=%', 
                 v_submission_id, p_grade, p_grade_text;
  END IF;
  
  -- Erstelle Ergebnis-JSON
  v_result := json_build_object(
    'success', true,
    'action', v_action,
    'submission_id', v_submission_id,
    'case_study_request_id', p_case_study_request_id,
    'grade', p_grade,
    'grade_text', p_grade_text,
    'timestamp', NOW()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Fehlerbehandlung
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE,
      'case_study_request_id', p_case_study_request_id,
      'timestamp', NOW()
    );
    
    RAISE NOTICE 'Error in upsert_grade: %', SQLERRM;
    RETURN v_result;
END;
$$;

-- 4. Batch Grade Update Funktion
CREATE OR REPLACE FUNCTION batch_upsert_grades(
  p_grades JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_grade_item JSONB;
  v_result JSON;
  v_results JSONB := '[]'::JSONB;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_case_study_id TEXT;
  v_grade NUMERIC;
  v_grade_text TEXT;
BEGIN
  -- Iteriere über alle Grade-Items
  FOR v_grade_item IN SELECT * FROM jsonb_array_elements(p_grades)
  LOOP
    BEGIN
      -- Extrahiere Werte
      v_case_study_id := v_grade_item->>'caseStudyId';
      v_grade := CASE 
        WHEN v_grade_item->>'grade' = 'null' OR v_grade_item->>'grade' IS NULL 
        THEN NULL 
        ELSE (v_grade_item->>'grade')::NUMERIC 
      END;
      v_grade_text := v_grade_item->>'gradeText';
      
      -- Führe UPSERT aus
      SELECT upsert_grade(v_case_study_id, v_grade, v_grade_text) INTO v_result;
      
      -- Füge Ergebnis hinzu
      v_results := v_results || jsonb_build_array(v_result);
      
      -- Zähle Erfolge
      IF (v_result->>'success')::BOOLEAN THEN
        v_success_count := v_success_count + 1;
      ELSE
        v_error_count := v_error_count + 1;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Einzelner Fehler soll Batch nicht stoppen
        v_results := v_results || jsonb_build_array(
          json_build_object(
            'success', false,
            'error', SQLERRM,
            'case_study_request_id', v_case_study_id
          )
        );
        v_error_count := v_error_count + 1;
    END;
  END LOOP;
  
  -- Erstelle Gesamt-Ergebnis
  RETURN json_build_object(
    'success', v_error_count = 0,
    'total_processed', v_success_count + v_error_count,
    'success_count', v_success_count,
    'error_count', v_error_count,
    'results', v_results,
    'timestamp', NOW()
  );
END;
$$;

-- 5. Grade-Abfrage Funktionen
CREATE OR REPLACE FUNCTION get_grade_by_case_study(
  p_case_study_request_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'submission_id', s.id,
    'case_study_request_id', s.case_study_request_id,
    'grade', s.grade,
    'grade_text', s.grade_text,
    'status', s.status,
    'corrected_at', s.corrected_at,
    'updated_at', s.updated_at,
    'created_at', s.created_at
  )
  INTO v_result
  FROM submissions s
  WHERE s.case_study_request_id = p_case_study_request_id;
  
  IF v_result IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Grade not found',
      'case_study_request_id', p_case_study_request_id
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'data', v_result
  );
END;
$$;

-- 6. Alle Grades für Instructor
CREATE OR REPLACE FUNCTION get_grades_for_instructor(
  p_instructor_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_results JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'submission_id', s.id,
      'case_study_request_id', s.case_study_request_id,
      'grade', s.grade,
      'grade_text', s.grade_text,
      'status', s.status,
      'corrected_at', s.corrected_at,
      'updated_at', s.updated_at,
      'case_study', json_build_object(
        'id', csr.id,
        'legal_area', csr.legal_area,
        'sub_area', csr.sub_area,
        'focus_area', csr.focus_area,
        'status', csr.status
      ),
      'student', json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'email', u.email
      )
    )
  )
  INTO v_results
  FROM submissions s
  JOIN case_study_requests csr ON s.case_study_request_id = csr.id
  JOIN users u ON csr.user_id = u.id
  WHERE (p_instructor_id IS NULL OR csr.instructor_id = p_instructor_id)
    AND s.grade IS NOT NULL
  ORDER BY s.updated_at DESC;
  
  RETURN json_build_object(
    'success', true,
    'data', COALESCE(v_results, '[]'::JSON),
    'count', (
      SELECT COUNT(*)
      FROM submissions s
      JOIN case_study_requests csr ON s.case_study_request_id = csr.id
      WHERE (p_instructor_id IS NULL OR csr.instructor_id = p_instructor_id)
        AND s.grade IS NOT NULL
    )
  );
END;
$$;

-- 7. Trigger für automatische updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Erstelle Trigger falls nicht vorhanden
DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Berechtigungen setzen
GRANT EXECUTE ON FUNCTION upsert_grade(TEXT, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_upsert_grades(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_grade_by_case_study(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_grades_for_instructor(UUID) TO authenticated;

-- 9. Kommentare für Dokumentation
COMMENT ON FUNCTION upsert_grade IS 'UPSERT-Funktion für einzelne Grade-Updates mit NULL-Unterstützung';
COMMENT ON FUNCTION batch_upsert_grades IS 'Batch-UPSERT für mehrere Grades gleichzeitig';
COMMENT ON FUNCTION get_grade_by_case_study IS 'Abrufen einer Grade für eine spezifische Case Study';
COMMENT ON FUNCTION get_grades_for_instructor IS 'Abrufen aller Grades für einen Instructor';

COMMENT ON COLUMN submissions.grade IS 'Note von 0-18 oder NULL für keine Note';
COMMENT ON COLUMN submissions.grade_text IS 'Textuelle Beschreibung der Note';
COMMENT ON COLUMN submissions.updated_at IS 'Zeitstempel der letzten Aktualisierung';

-- 10. Beispiel-Daten für Tests (optional)
-- INSERT INTO submissions (case_study_request_id, file_url, file_type, status, grade, grade_text)
-- VALUES 
--   ('test-case-1', 'test-url-1', 'pdf', 'corrected', 15, 'sehr gut'),
--   ('test-case-2', 'test-url-2', 'pdf', 'corrected', NULL, NULL),
--   ('test-case-3', 'test-url-3', 'pdf', 'corrected', 8, 'befriedigend');

-- Erfolgsmeldung
SELECT 'Auto-Save Grade System erfolgreich installiert!' as result,
       NOW() as timestamp,
       'postgresql://postgres.rpgbyockvpannrupicno:***@aws-1-eu-central-1.pooler.supabase.com:6543/postgres' as connection;
