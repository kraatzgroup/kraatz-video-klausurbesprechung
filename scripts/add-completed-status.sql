-- Migration: Add 'completed' status to case_study_requests table
-- This allows case studies to be marked as completed after corrections are uploaded

-- Drop the existing check constraint
ALTER TABLE case_study_requests DROP CONSTRAINT IF EXISTS case_study_requests_status_check;

-- Add the new check constraint with 'completed' status
ALTER TABLE case_study_requests ADD CONSTRAINT case_study_requests_status_check 
CHECK (status IN ('requested', 'materials_ready', 'submitted', 'under_review', 'corrected', 'completed'));

-- Update any existing 'corrected' cases to 'completed' if they have both video and written corrections
UPDATE case_study_requests 
SET status = 'completed' 
WHERE status = 'corrected' 
AND video_correction_url IS NOT NULL 
AND written_correction_url IS NOT NULL;
