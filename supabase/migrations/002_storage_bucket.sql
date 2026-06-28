-- Storage bucket for BriefNexus file uploads
-- Run this in Supabase SQL editor after creating the bucket in Storage dashboard

-- Create bucket (if using SQL — alternatively create via dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('briefnexus-files', 'briefnexus-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can upload/read files in their own project folders
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'briefnexus-files'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'briefnexus-files'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'briefnexus-files'
  AND auth.uid() IS NOT NULL
);
