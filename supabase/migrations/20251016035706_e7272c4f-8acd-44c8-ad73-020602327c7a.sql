-- Crear bucket para pistas de ensayo
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rehearsal-tracks', 'rehearsal-tracks', true)
ON CONFLICT (id) DO NOTHING;

-- Política para que cualquier usuario autenticado pueda ver las pistas
CREATE POLICY "Usuarios pueden ver pistas de ensayo"
ON storage.objects FOR SELECT
USING (bucket_id = 'rehearsal-tracks' AND auth.role() = 'authenticated');

-- Política para que los usuarios puedan subir sus propias pistas
CREATE POLICY "Usuarios pueden subir sus propias pistas"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rehearsal-tracks' 
  AND auth.role() = 'authenticated'
);

-- Política para que los usuarios puedan actualizar sus propias pistas
CREATE POLICY "Usuarios pueden actualizar sus propias pistas"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'rehearsal-tracks' 
  AND auth.role() = 'authenticated'
);

-- Política para que los usuarios puedan eliminar sus propias pistas
CREATE POLICY "Usuarios pueden eliminar sus propias pistas"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'rehearsal-tracks' 
  AND auth.role() = 'authenticated'
);