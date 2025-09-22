-- Create video_lessons table for Klausuren-Masterclass
CREATE TABLE IF NOT EXISTS public.video_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER NOT NULL DEFAULT 0, -- duration in seconds
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT true
);

-- Create RLS policies for video_lessons
ALTER TABLE public.video_lessons ENABLE ROW LEVEL SECURITY;

-- Students can view all active video lessons
CREATE POLICY "Students can view active video lessons" ON public.video_lessons
    FOR SELECT USING (is_active = true);

-- Admins can manage all video lessons
CREATE POLICY "Admins can manage video lessons" ON public.video_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_video_lessons_category ON public.video_lessons(category);
CREATE INDEX IF NOT EXISTS idx_video_lessons_created_at ON public.video_lessons(created_at);
CREATE INDEX IF NOT EXISTS idx_video_lessons_active ON public.video_lessons(is_active);

-- Insert some sample video lessons for testing
INSERT INTO public.video_lessons (title, description, video_url, category, duration) VALUES
('Grundlagen des Gutachtenstils', 'Eine umfassende Einführung in den juristischen Gutachtenstil mit praktischen Beispielen.', 'https://example.com/video1.mp4', 'gutachtenstil', 1800),
('Zivilrecht: BGB AT Basics', 'Die wichtigsten Grundlagen des BGB Allgemeinen Teils verständlich erklärt.', 'https://example.com/video2.mp4', 'zivilrecht', 2400),
('Klausurtechnik: Zeitmanagement', 'Effektive Strategien für optimales Zeitmanagement in juristischen Klausuren.', 'https://example.com/video3.mp4', 'klausurtechnik', 1200),
('Strafrecht AT: Tatbestandsmerkmale', 'Systematische Analyse von Tatbestandsmerkmalen im Strafrecht AT.', 'https://example.com/video4.mp4', 'strafrecht', 2100);
