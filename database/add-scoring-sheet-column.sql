-- Add scoring_sheet_url column to case_study_requests table
ALTER TABLE case_study_requests ADD COLUMN IF NOT EXISTS scoring_sheet_url TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_case_study_requests_scoring_sheet ON case_study_requests(scoring_sheet_url);

-- Add comment to document the column
COMMENT ON COLUMN case_study_requests.scoring_sheet_url IS 'URL to Excel scoring sheet uploaded by instructor';
