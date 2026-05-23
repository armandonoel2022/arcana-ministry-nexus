
-- 1. Table
CREATE TABLE public.outfit_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  storage_path text NOT NULL,
  photo_date date NOT NULL DEFAULT CURRENT_DATE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, photo_date)
);

CREATE INDEX idx_outfit_photos_user_date ON public.outfit_photos(user_id, photo_date DESC);

ALTER TABLE public.outfit_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own outfits"
  ON public.outfit_photos FOR SELECT
  USING (auth.uid() = user_id OR public.is_administrator(auth.uid()));

CREATE POLICY "Users insert own outfits"
  ON public.outfit_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own outfits"
  ON public.outfit_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own outfits"
  ON public.outfit_photos FOR DELETE
  USING (auth.uid() = user_id OR public.is_administrator(auth.uid()));

-- 2. Trigger to enforce 10-photo limit (delete oldest)
CREATE OR REPLACE FUNCTION public.enforce_outfit_photo_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  excess_id uuid;
BEGIN
  WHILE (SELECT COUNT(*) FROM public.outfit_photos WHERE user_id = NEW.user_id) > 10 LOOP
    SELECT id INTO excess_id
    FROM public.outfit_photos
    WHERE user_id = NEW.user_id
    ORDER BY photo_date ASC, created_at ASC
    LIMIT 1;
    DELETE FROM public.outfit_photos WHERE id = excess_id;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_outfit_photo_limit
AFTER INSERT ON public.outfit_photos
FOR EACH ROW EXECUTE FUNCTION public.enforce_outfit_photo_limit();

-- 3. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('outfit-photos', 'outfit-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Outfit photos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'outfit-photos');

CREATE POLICY "Users upload own outfit photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'outfit-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own outfit photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'outfit-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own outfit photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'outfit-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Screen permissions for sidebar
INSERT INTO public.screen_permissions (role, screen_path, screen_name, screen_category, can_view, can_edit)
VALUES
  ('admin', '/mi-outfit', 'Mi Outfit', 'Personal', true, true),
  ('lider', '/mi-outfit', 'Mi Outfit', 'Personal', true, true),
  ('vocal', '/mi-outfit', 'Mi Outfit', 'Personal', true, true),
  ('musico', '/mi-outfit', 'Mi Outfit', 'Personal', true, true),
  ('miembro', '/mi-outfit', 'Mi Outfit', 'Personal', true, true)
ON CONFLICT DO NOTHING;
