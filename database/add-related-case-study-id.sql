-- Add missing related_case_study_id column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN related_case_study_id UUID REFERENCES public.case_study_requests(id) ON DELETE CASCADE;
