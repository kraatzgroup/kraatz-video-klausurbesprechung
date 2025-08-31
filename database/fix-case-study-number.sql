-- Fix the UPDATE statement for existing records
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    FOR rec IN 
        SELECT id FROM public.case_study_requests 
        ORDER BY created_at
    LOOP
        UPDATE public.case_study_requests 
        SET case_study_number = counter 
        WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Set the sequence to continue from the highest number
SELECT setval('case_study_number_seq', (SELECT COALESCE(MAX(case_study_number), 0) FROM public.case_study_requests));
