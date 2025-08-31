-- Create storage bucket for case studies
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-studies', 'case-studies', true);

-- Set up RLS policies for the bucket
CREATE POLICY "Allow authenticated users to upload case studies" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'case-studies' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow public read access to case studies" ON storage.objects
FOR SELECT USING (bucket_id = 'case-studies');

CREATE POLICY "Allow instructors to delete case studies" ON storage.objects
FOR DELETE USING (
  bucket_id = 'case-studies' AND 
  auth.role() = 'authenticated'
);
