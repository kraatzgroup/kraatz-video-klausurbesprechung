-- Add new columns to case_study_requests table for video corrections and download tracking
ALTER TABLE public.case_study_requests 
ADD COLUMN IF NOT EXISTS submission_downloaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS video_correction_url TEXT,
ADD COLUMN IF NOT EXISTS written_correction_url TEXT;

-- Update the status constraint to include 'under_review'
ALTER TABLE public.case_study_requests 
DROP CONSTRAINT IF EXISTS case_study_requests_status_check;

ALTER TABLE public.case_study_requests 
ADD CONSTRAINT case_study_requests_status_check 
CHECK (status IN ('requested', 'materials_ready', 'submitted', 'under_review', 'corrected'));
