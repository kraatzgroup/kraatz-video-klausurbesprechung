-- Add tracking columns for video and PDF access
ALTER TABLE public.case_study_requests 
ADD COLUMN IF NOT EXISTS video_viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pdf_downloaded_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.case_study_requests.video_viewed_at IS 'Timestamp when student viewed the correction video';
COMMENT ON COLUMN public.case_study_requests.pdf_downloaded_at IS 'Timestamp when student downloaded the correction PDF';
