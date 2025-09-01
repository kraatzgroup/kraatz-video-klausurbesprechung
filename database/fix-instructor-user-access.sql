-- Fix RLS policy to allow instructors to view all user profiles
-- This is needed for the instructor dashboard to display student information

-- Add policy for instructors to view all user profiles
CREATE POLICY "Instructors can view all user profiles" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

-- Also add policy for instructors to create users (for data management)
CREATE POLICY "Instructors can create users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

-- Add policy for instructors to update user profiles (for data management)
CREATE POLICY "Instructors can update all user profiles" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );
