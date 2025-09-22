-- Add scoring_schema_url column to case_study_requests table
-- This column will store the URL for Excel scoring schema files uploaded by instructors

ALTER TABLE case_study_requests 
ADD COLUMN scoring_schema_url TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN case_study_requests.scoring_schema_url IS 'URL to Excel scoring schema file uploaded by instructor';