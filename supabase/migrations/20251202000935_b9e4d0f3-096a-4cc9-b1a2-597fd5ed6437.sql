-- Crear tabla para sets de adoración en eventos especiales
CREATE TABLE public.event_worship_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.special_events(id) ON DELETE CASCADE,
  set_name TEXT NOT NULL,
  set_order INTEGER NOT NULL DEFAULT 1,
  duration_minutes INTEGER DEFAULT 20,
  set_type TEXT DEFAULT 'worship', -- 'worship', 'offering', 'communion', 'special'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para canciones dentro de cada set
CREATE TABLE public.event_set_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID NOT NULL REFERENCES public.event_worship_sets(id) ON DELETE CASCADE,
  song_id UUID REFERENCES public.songs(id) ON DELETE SET NULL,
  song_title TEXT NOT NULL, -- Para canciones que no están en el catálogo
  song_order INTEGER NOT NULL DEFAULT 1,
  responsible_person TEXT, -- Nombre del responsable de esta canción
  responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.event_worship_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_set_songs ENABLE ROW LEVEL SECURITY;

-- Políticas para event_worship_sets
CREATE POLICY "Authenticated users can view worship sets"
ON public.event_worship_sets FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage worship sets"
ON public.event_worship_sets FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND (profiles.role = 'administrator' OR profiles.role = 'leader')
));

-- Políticas para event_set_songs
CREATE POLICY "Authenticated users can view set songs"
ON public.event_set_songs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage set songs"
ON public.event_set_songs FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND (profiles.role = 'administrator' OR profiles.role = 'leader')
));

-- Triggers para updated_at
CREATE TRIGGER update_event_worship_sets_updated_at
BEFORE UPDATE ON public.event_worship_sets
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_event_set_songs_updated_at
BEFORE UPDATE ON public.event_set_songs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();