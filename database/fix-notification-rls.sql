-- Fix RLS policies for notifications table to allow system-generated notifications

-- Add policy for system/trigger-based notification creation
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Add policy for instructors/admins to create notifications
CREATE POLICY "Instructors can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

-- Add policy for users to delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);
