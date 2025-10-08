-- Crear tablas para el módulo de ensayos colaborativos

-- Tabla de sesiones de ensayo
CREATE TABLE IF NOT EXISTS public.rehearsal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL, -- grupo_massy, grupo_aleida, grupo_keyla, musicos, danza
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  backing_track_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de pistas individuales de ensayo
CREATE TABLE IF NOT EXISTS public.rehearsal_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.rehearsal_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_type TEXT NOT NULL, -- soprano, alto, tenor, bass, piano, guitar, drums, etc.
  audio_url TEXT,
  video_url TEXT,
  duration_seconds INTEGER,
  volume_level NUMERIC DEFAULT 1.0 CHECK (volume_level >= 0 AND volume_level <= 1),
  is_muted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_group ON public.rehearsal_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_song ON public.rehearsal_sessions(song_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_sessions_created_by ON public.rehearsal_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_rehearsal_tracks_session ON public.rehearsal_tracks(session_id);
CREATE INDEX IF NOT EXISTS idx_rehearsal_tracks_user ON public.rehearsal_tracks(user_id);

-- Usar función existente handle_updated_at para los triggers
DROP TRIGGER IF EXISTS update_rehearsal_sessions_updated_at ON public.rehearsal_sessions;
CREATE TRIGGER update_rehearsal_sessions_updated_at
  BEFORE UPDATE ON public.rehearsal_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_rehearsal_tracks_updated_at ON public.rehearsal_tracks;
CREATE TRIGGER update_rehearsal_tracks_updated_at
  BEFORE UPDATE ON public.rehearsal_tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar RLS
ALTER TABLE public.rehearsal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehearsal_tracks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para rehearsal_sessions
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver sesiones de ensayo" ON public.rehearsal_sessions;
CREATE POLICY "Usuarios autenticados pueden ver sesiones de ensayo"
  ON public.rehearsal_sessions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear sesiones de ensayo" ON public.rehearsal_sessions;
CREATE POLICY "Usuarios autenticados pueden crear sesiones de ensayo"
  ON public.rehearsal_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creadores pueden actualizar sus sesiones" ON public.rehearsal_sessions;
CREATE POLICY "Creadores pueden actualizar sus sesiones"
  ON public.rehearsal_sessions
  FOR UPDATE
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creadores pueden eliminar sus sesiones" ON public.rehearsal_sessions;
CREATE POLICY "Creadores pueden eliminar sus sesiones"
  ON public.rehearsal_sessions
  FOR DELETE
  USING (auth.uid() = created_by);

-- Políticas RLS para rehearsal_tracks
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver pistas de ensayo" ON public.rehearsal_tracks;
CREATE POLICY "Usuarios autenticados pueden ver pistas de ensayo"
  ON public.rehearsal_tracks
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Usuarios pueden crear sus propias pistas" ON public.rehearsal_tracks;
CREATE POLICY "Usuarios pueden crear sus propias pistas"
  ON public.rehearsal_tracks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias pistas" ON public.rehearsal_tracks;
CREATE POLICY "Usuarios pueden actualizar sus propias pistas"
  ON public.rehearsal_tracks
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias pistas" ON public.rehearsal_tracks;
CREATE POLICY "Usuarios pueden eliminar sus propias pistas"
  ON public.rehearsal_tracks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Crear bucket de storage para ensayos (audio y video)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rehearsal-media',
  'rehearsal-media',
  false,
  104857600, -- 100MB límite
  ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para rehearsal-media
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir archivos de ensayo" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir archivos de ensayo"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'rehearsal-media' AND
    auth.uid() IS NOT NULL AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Usuarios pueden ver archivos de ensayo" ON storage.objects;
CREATE POLICY "Usuarios pueden ver archivos de ensayo"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'rehearsal-media' AND
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus archivos" ON storage.objects;
CREATE POLICY "Usuarios pueden actualizar sus archivos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'rehearsal-media' AND
    auth.uid() IS NOT NULL AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus archivos" ON storage.objects;
CREATE POLICY "Usuarios pueden eliminar sus archivos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'rehearsal-media' AND
    auth.uid() IS NOT NULL AND
    auth.uid()::text = (storage.foldername(name))[1]
  );