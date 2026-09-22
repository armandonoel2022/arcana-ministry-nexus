
CREATE POLICY "poll_photos_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'poll-photos');

CREATE POLICY "poll_photos_insert_admin" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'poll-photos' AND public.is_administrator(auth.uid()));

CREATE POLICY "poll_photos_update_admin" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'poll-photos' AND public.is_administrator(auth.uid()))
WITH CHECK (bucket_id = 'poll-photos' AND public.is_administrator(auth.uid()));

CREATE POLICY "poll_photos_delete_admin" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'poll-photos' AND public.is_administrator(auth.uid()));
