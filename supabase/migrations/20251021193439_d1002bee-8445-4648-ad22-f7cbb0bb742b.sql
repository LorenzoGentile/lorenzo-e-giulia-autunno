-- Drop existing wedding_photos storage policies if they exist
DROP POLICY IF EXISTS "Invited guests can upload to wedding_photos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view wedding_photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own wedding photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own wedding photos" ON storage.objects;

-- Allow invited guests to upload photos to wedding_photos bucket
CREATE POLICY "Invited guests can upload to wedding_photos bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wedding_photos' 
  AND auth.email() IN (
    SELECT email FROM public.invited_guests
  )
);

-- Allow everyone to view photos in wedding_photos bucket
CREATE POLICY "Anyone can view wedding_photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'wedding_photos');

-- Allow users to update their own photos
CREATE POLICY "Users can update their own wedding photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wedding_photos'
  AND auth.email() IN (
    SELECT email FROM public.invited_guests
  )
)
WITH CHECK (
  bucket_id = 'wedding_photos'
  AND auth.email() IN (
    SELECT email FROM public.invited_guests
  )
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own wedding photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'wedding_photos'
  AND auth.email() IN (
    SELECT email FROM public.invited_guests
  )
);