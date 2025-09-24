-- PostgreSQL RPC-Funktion für Grade-Updates
-- Verwendet direkte PostgreSQL-Verbindung wie bevorzugt

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
BEGIN
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
    
    v_result := json_build_object(
      'action', 'updated',
      'submission_id', v_submission_id,
      'case_study_request_id', p_case_study_request_id,
      'grade', p_grade,
      'grade_text', p_grade_text
    );
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
      created_at
    ) VALUES (
      p_case_study_request_id,
      'auto-save-placeholder',
      'pdf',
      'corrected',
      p_grade,
      p_grade_text,
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_submission_id;
    
    v_result := json_build_object(
      'action', 'created',
      'submission_id', v_submission_id,
      'case_study_request_id', p_case_study_request_id,
      'grade', p_grade,
      'grade_text', p_grade_text
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION upsert_grade(TEXT, NUMERIC, TEXT) TO authenticated;

-- Kommentar für Dokumentation
COMMENT ON FUNCTION upsert_grade IS 'UPSERT-Funktion für Grade-Updates mit PostgreSQL-Bypass für 406-Fehler';
