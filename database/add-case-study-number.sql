-- Add case study number field to case_study_requests table
ALTER TABLE public.case_study_requests 
ADD COLUMN case_study_number SERIAL;

-- Create a sequence for case study numbers starting from 1
CREATE SEQUENCE IF NOT EXISTS case_study_number_seq START 1;

-- Update existing records with sequential numbers
UPDATE public.case_study_requests 
SET case_study_number = nextval('case_study_number_seq')
ORDER BY created_at;

-- Create function to auto-assign case study numbers
CREATE OR REPLACE FUNCTION assign_case_study_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.case_study_number IS NULL THEN
        NEW.case_study_number = nextval('case_study_number_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign numbers on insert
DROP TRIGGER IF EXISTS assign_case_study_number_trigger ON public.case_study_requests;
CREATE TRIGGER assign_case_study_number_trigger
    BEFORE INSERT ON public.case_study_requests
    FOR EACH ROW EXECUTE FUNCTION assign_case_study_number();
