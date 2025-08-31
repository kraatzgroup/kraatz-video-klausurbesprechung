-- Drop the existing global sequence and trigger
DROP TRIGGER IF EXISTS assign_case_study_number_trigger ON public.case_study_requests;
DROP FUNCTION IF EXISTS assign_case_study_number();
DROP SEQUENCE IF EXISTS case_study_number_seq;

-- Remove the SERIAL constraint and make it a regular integer
ALTER TABLE public.case_study_requests 
ALTER COLUMN case_study_number DROP DEFAULT;

-- Update existing records with student-specific numbering
DO $$
DECLARE
    user_rec RECORD;
    case_rec RECORD;
    counter INTEGER;
BEGIN
    -- For each user, number their case studies sequentially
    FOR user_rec IN 
        SELECT DISTINCT user_id FROM public.case_study_requests 
        ORDER BY user_id
    LOOP
        counter := 1;
        FOR case_rec IN 
            SELECT id FROM public.case_study_requests 
            WHERE user_id = user_rec.user_id
            ORDER BY created_at
        LOOP
            UPDATE public.case_study_requests 
            SET case_study_number = counter 
            WHERE id = case_rec.id;
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Create function to auto-assign student-specific case study numbers
CREATE OR REPLACE FUNCTION assign_student_case_study_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.case_study_number IS NULL THEN
        -- Get the next number for this specific user
        SELECT COALESCE(MAX(case_study_number), 0) + 1 
        INTO NEW.case_study_number
        FROM public.case_study_requests 
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign student-specific numbers on insert
CREATE TRIGGER assign_student_case_study_number_trigger
    BEFORE INSERT ON public.case_study_requests
    FOR EACH ROW EXECUTE FUNCTION assign_student_case_study_number();
