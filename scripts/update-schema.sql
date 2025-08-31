-- Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS available_case_studies INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS used_case_studies INTEGER DEFAULT 0;

-- Update existing users with default values
UPDATE public.users 
SET available_case_studies = COALESCE(available_case_studies, 0), 
    used_case_studies = COALESCE(used_case_studies, 0);

-- Add admin policies for user management
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
