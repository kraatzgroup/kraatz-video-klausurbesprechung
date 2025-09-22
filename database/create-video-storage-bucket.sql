-- Create storage bucket for video lessons
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-lessons', 'video-lessons', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for video lessons bucket
CREATE POLICY "Public read access for video lessons" ON storage.objects
FOR SELECT USING (bucket_id = 'video-lessons');

CREATE POLICY "Admin upload access for video lessons" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'video-lessons' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

CREATE POLICY "Admin delete access for video lessons" ON storage.objects
FOR DELETE USING (
  bucket_id = 'video-lessons' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

CREATE POLICY "Admin update access for video lessons" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'video-lessons' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);
