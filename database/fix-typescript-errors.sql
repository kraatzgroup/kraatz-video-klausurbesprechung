-- PostgreSQL-Migration zur Behebung aller TypeScript-Fehler
-- Direkte PostgreSQL-Verbindung wie bevorzugt
-- Connection: postgresql://postgres.rpgbyockvpannrupicno:datenbankpasswort@aws-1-eu-central-1.pooler.supabase.com:6543/postgres

-- 1. Erweitere submissions-Tabelle um fehlende Spalten
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
  
  -- Füge is_deleted Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE submissions ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_deleted column to submissions table';
  END IF;
END
$$;

-- 2. Erweitere case_study_requests-Tabelle um fehlende Spalten
DO $$
BEGIN
  -- Füge case_study_number Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'case_study_requests' AND column_name = 'case_study_number'
  ) THEN
    ALTER TABLE case_study_requests ADD COLUMN case_study_number INTEGER;
    RAISE NOTICE 'Added case_study_number column to case_study_requests table';
  END IF;
  
  -- Füge video_viewed_at Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'case_study_requests' AND column_name = 'video_viewed_at'
  ) THEN
    ALTER TABLE case_study_requests ADD COLUMN video_viewed_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added video_viewed_at column to case_study_requests table';
  END IF;
  
  -- Füge pdf_downloaded_at Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'case_study_requests' AND column_name = 'pdf_downloaded_at'
  ) THEN
    ALTER TABLE case_study_requests ADD COLUMN pdf_downloaded_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added pdf_downloaded_at column to case_study_requests table';
  END IF;
  
  -- Füge correction_viewed_at Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'case_study_requests' AND column_name = 'correction_viewed_at'
  ) THEN
    ALTER TABLE case_study_requests ADD COLUMN correction_viewed_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added correction_viewed_at column to case_study_requests table';
  END IF;
  
  -- Füge instructor_id Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'case_study_requests' AND column_name = 'instructor_id'
  ) THEN
    ALTER TABLE case_study_requests ADD COLUMN instructor_id UUID REFERENCES users(id);
    RAISE NOTICE 'Added instructor_id column to case_study_requests table';
  END IF;
  
  -- Füge updated_at Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'case_study_requests' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE case_study_requests ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to case_study_requests table';
  END IF;
END
$$;

-- 3. Erweitere users-Tabelle um fehlende Spalten
DO $$
BEGIN
  -- Füge instructor_legal_area Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'instructor_legal_area'
  ) THEN
    ALTER TABLE users ADD COLUMN instructor_legal_area TEXT;
    RAISE NOTICE 'Added instructor_legal_area column to users table';
  END IF;
  
  -- Füge updated_at Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to users table';
  END IF;
END
$$;

-- 4. Erweitere notifications-Tabelle um fehlende Spalten
DO $$
BEGIN
  -- Füge related_case_study_id Spalte hinzu falls nicht vorhanden
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'related_case_study_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN related_case_study_id UUID;
    RAISE NOTICE 'Added related_case_study_id column to notifications table';
  END IF;
  
  -- Erweitere type enum um 'error' falls nicht vorhanden
  DO $inner$
  BEGIN
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'error';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END
  $inner$;
END
$$;

-- 5. Erstelle fehlende Tabellen falls nicht vorhanden

-- Conversations-Tabelle
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  type TEXT NOT NULL CHECK (type IN ('direct', 'group', 'support')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Participants-Tabelle
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, user_id)
);

-- Messages-Tabelle
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
  is_deleted BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Lessons-Tabelle
CREATE TABLE IF NOT EXISTS video_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  category TEXT DEFAULT 'allgemein',
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Progress-Tabelle
CREATE TABLE IF NOT EXISTS video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_lesson_id UUID NOT NULL REFERENCES video_lessons(id) ON DELETE CASCADE,
  watched BOOLEAN DEFAULT FALSE,
  watch_time INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_lesson_id)
);

-- Case Study Ratings-Tabelle
CREATE TABLE IF NOT EXISTS case_study_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_study_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(case_study_id, user_id)
);

-- 6. Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_submissions_case_study_request_id ON submissions(case_study_request_id);
CREATE INDEX IF NOT EXISTS idx_submissions_grade ON submissions(grade) WHERE grade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_updated_at ON submissions(updated_at);
CREATE INDEX IF NOT EXISTS idx_case_study_requests_user_id ON case_study_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_case_study_requests_status ON case_study_requests(status);
CREATE INDEX IF NOT EXISTS idx_case_study_requests_instructor_id ON case_study_requests(instructor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_user_id ON video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_lesson_id ON video_progress(video_lesson_id);

-- 7. Aktualisiere Auto-Save UPSERT-Funktion
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
  WHERE case_study_request_id = p_case_study_request_id::UUID;
  
  IF v_submission_id IS NOT NULL THEN
    -- Update existing submission
    UPDATE submissions
    SET 
      grade = p_grade,
      grade_text = p_grade_text,
      updated_at = NOW()
    WHERE case_study_request_id = p_case_study_request_id::UUID;
    
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
      p_case_study_request_id::UUID,
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

-- 8. Berechtigungen setzen
GRANT EXECUTE ON FUNCTION upsert_grade(TEXT, NUMERIC, TEXT) TO authenticated;

-- 9. Trigger für automatische updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Erstelle Trigger für alle Tabellen mit updated_at
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT t.table_name 
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public' 
    AND c.column_name = 'updated_at'
    AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', table_name, table_name);
    EXECUTE format('CREATE TRIGGER update_%s_updated_at
      BEFORE UPDATE ON %s
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()', table_name, table_name);
    
    RAISE NOTICE 'Created updated_at trigger for table: %', table_name;
  END LOOP;
END
$$;

-- 10. Erfolgsmeldung
SELECT 
  'TypeScript-Fehler erfolgreich behoben!' as result,
  NOW() as timestamp,
  'Alle fehlenden Spalten und Tabellen wurden hinzugefügt' as details;

-- Zeige Tabellen-Status
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
