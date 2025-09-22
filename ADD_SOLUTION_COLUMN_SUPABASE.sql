-- SQL to execute in Supabase SQL Editor
-- This adds the solution_pdf_url column to the case_study_requests table

ALTER TABLE case_study_requests 
ADD COLUMN IF NOT EXISTS solution_pdf_url TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'case_study_requests' 
AND column_name = 'solution_pdf_url';
