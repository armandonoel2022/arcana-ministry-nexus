-- Actualizar el campo grupo para los integrantes del Grupo de Keyla
UPDATE members 
SET grupo = 'grupo_keyla' 
WHERE id IN (
  'c24659e9-b473-4ecd-97e7-a90526d23502', -- Keyla Yanira Medrano Medrano
  '82b62449-5046-455f-af7b-da8e5dbc6327', -- Aida Lorena Pacheco De Santana  
  '4eed809d-9437-48d5-935e-cf8b4aa8024a', -- Arizoni Liriano medina
  'be61d066-5707-4763-8d8c-16d19597dc3a'  -- Sugey A. González Garó
);

-- Buscar y actualizar a Yindhia Carolina (faltaba en el query anterior)
UPDATE members 
SET grupo = 'grupo_keyla'
WHERE LOWER(nombres || ' ' || apellidos) = LOWER('Yindhia Carolina Santana Castillo');

-- Crear tabla para gestionar "zumbidos" (notificaciones especiales entre usuarios)
CREATE TABLE IF NOT EXISTS public.user_buzzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  message TEXT,
  buzz_type TEXT NOT NULL DEFAULT 'general' CHECK (buzz_type IN ('general', 'urgent', 'reminder')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_buzzes_recipient ON public.user_buzzes(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_buzzes_sender ON public.user_buzzes(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_buzzes_created_at ON public.user_buzzes(created_at DESC);

-- Habilitar RLS en user_buzzes
ALTER TABLE public.user_buzzes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_buzzes
CREATE POLICY "Users can send buzzes to others"
  ON public.user_buzzes
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view buzzes sent to them"
  ON public.user_buzzes
  FOR SELECT
  USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

CREATE POLICY "Recipients can mark buzzes as read"
  ON public.user_buzzes
  FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Comentario sobre la tabla
COMMENT ON TABLE public.user_buzzes IS 'Tabla para gestionar zumbidos/notificaciones especiales entre usuarios del sistema';