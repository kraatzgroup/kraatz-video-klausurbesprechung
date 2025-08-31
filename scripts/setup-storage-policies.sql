-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;

-- Allow authenticated users to upload to case-studies bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'case-studies' 
        AND auth.role() = 'authenticated'
    );

-- Allow public read access to case-studies bucket
CREATE POLICY "Allow public downloads" ON storage.objects
    FOR SELECT USING (bucket_id = 'case-studies');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'case-studies' 
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'case-studies' 
        AND auth.role() = 'authenticated'
    );
