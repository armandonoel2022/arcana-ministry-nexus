-- Crear bucket para chat-media si no existe
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media',
  'chat-media',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/mp4'
  ]::text[]
)
on conflict (id) do update set
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/mp4'
  ]::text[],
  file_size_limit = 10485760;

-- Políticas de acceso para chat-media
create policy "Usuarios autenticados pueden subir archivos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'chat-media');

create policy "Usuarios autenticados pueden ver archivos"
on storage.objects for select
to authenticated
using (bucket_id = 'chat-media');

create policy "Usuarios pueden actualizar sus propios archivos"
on storage.objects for update
to authenticated
using (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

create policy "Usuarios pueden eliminar sus propios archivos"
on storage.objects for delete
to authenticated
using (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);