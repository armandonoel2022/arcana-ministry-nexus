-- Agregar campo de cover image a la tabla songs
ALTER TABLE public.songs ADD COLUMN cover_image_url TEXT;

-- Crear bucket para las carátulas de canciones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'song-covers',
  'song-covers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Permitir que usuarios autenticados puedan subir carátulas
CREATE POLICY "Usuarios autenticados pueden subir carátulas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'song-covers');

-- Permitir acceso público de lectura a las carátulas
CREATE POLICY "Carátulas son públicamente accesibles"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'song-covers');

-- Permitir que usuarios autenticados puedan actualizar sus carátulas
CREATE POLICY "Usuarios autenticados pueden actualizar carátulas"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'song-covers');

-- Permitir que usuarios autenticados puedan eliminar carátulas
CREATE POLICY "Usuarios autenticados pueden eliminar carátulas"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'song-covers');