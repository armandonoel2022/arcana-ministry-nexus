
-- Primero, necesitamos crear la tabla song_selections que parece estar referenciada pero no existe
CREATE TABLE IF NOT EXISTS public.song_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  selected_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selection_reason TEXT,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para song_selections
ALTER TABLE public.song_selections ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan ver las selecciones
CREATE POLICY "Anyone can view song selections" 
  ON public.song_selections 
  FOR SELECT 
  USING (true);

-- Política para que usuarios autenticados puedan crear selecciones
CREATE POLICY "Authenticated users can create song selections" 
  ON public.song_selections 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND selected_by = auth.uid());

-- Política para que solo el creador pueda actualizar
CREATE POLICY "Users can update their own song selections" 
  ON public.song_selections 
  FOR UPDATE 
  USING (selected_by = auth.uid());

-- Crear trigger para updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.song_selections
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Actualizar la tabla system_notifications para incluir campos adicionales que usa el código
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS notification_category VARCHAR(50) DEFAULT 'general';
ALTER TABLE public.system_notifications ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
