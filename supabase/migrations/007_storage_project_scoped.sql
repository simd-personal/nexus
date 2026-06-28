-- Scope storage access to projects the current user can access (not all authed users)

DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

CREATE POLICY "Users can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'briefnexus-files'
  AND auth.uid() IS NOT NULL
  AND can_access_project((split_part(name, '/', 1))::uuid)
);

CREATE POLICY "Users can read project files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'briefnexus-files'
  AND auth.uid() IS NOT NULL
  AND can_access_project((split_part(name, '/', 1))::uuid)
);

CREATE POLICY "Users can delete project files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'briefnexus-files'
  AND auth.uid() IS NOT NULL
  AND can_access_project((split_part(name, '/', 1))::uuid)
);
