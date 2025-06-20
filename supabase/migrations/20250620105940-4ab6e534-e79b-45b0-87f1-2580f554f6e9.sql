
-- Crear tabla para relacionar servicios con canciones seleccionadas
CREATE TABLE public.service_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  song_order INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, song_id)
);

-- Agregar RLS para que solo usuarios autenticados puedan gestionar las canciones de servicios
ALTER TABLE public.service_songs ENABLE ROW LEVEL SECURITY;

-- Política para ver las canciones de servicios (todos pueden ver)
CREATE POLICY "Anyone can view service songs" 
  ON public.service_songs 
  FOR SELECT 
  USING (true);

-- Política para insertar canciones en servicios (solo usuarios autenticados)
CREATE POLICY "Authenticated users can add service songs" 
  ON public.service_songs 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política para actualizar canciones de servicios (solo usuarios autenticados)
CREATE POLICY "Authenticated users can update service songs" 
  ON public.service_songs 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Política para eliminar canciones de servicios (solo usuarios autenticados)
CREATE POLICY "Authenticated users can delete service songs" 
  ON public.service_songs 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Crear trigger para actualizar updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.service_songs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
