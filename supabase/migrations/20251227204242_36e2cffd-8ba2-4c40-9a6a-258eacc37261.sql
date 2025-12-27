-- Create bucket for overlay images (sonograms, baby photos, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('overlay-images', 'overlay-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view public overlay images
CREATE POLICY "Public overlay images are viewable by everyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'overlay-images');

-- Policy: Authenticated users can upload overlay images
CREATE POLICY "Authenticated users can upload overlay images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'overlay-images' AND auth.role() = 'authenticated');

-- Policy: Users can update their own uploaded overlay images
CREATE POLICY "Users can update overlay images they uploaded"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'overlay-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own uploaded overlay images
CREATE POLICY "Users can delete overlay images they uploaded"
ON storage.objects
FOR DELETE
USING (bucket_id = 'overlay-images' AND auth.uid()::text = (storage.foldername(name))[1]);