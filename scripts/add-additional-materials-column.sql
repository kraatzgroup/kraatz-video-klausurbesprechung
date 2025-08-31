-- Add additional_materials_url column to case_study_requests table
ALTER TABLE public.case_study_requests 
ADD COLUMN IF NOT EXISTS additional_materials_url TEXT;

-- Update RLS policies if needed
-- The existing policies should automatically cover the new column
