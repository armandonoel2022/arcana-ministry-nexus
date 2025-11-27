-- Create daily_advice table for storing daily advice messages
CREATE TABLE IF NOT EXISTS public.daily_advice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_advice ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active advice
CREATE POLICY "Anyone can view active advice"
  ON public.daily_advice
  FOR SELECT
  USING (is_active = true);

-- Allow admins to manage advice
CREATE POLICY "Admins can manage advice"
  ON public.daily_advice
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'administrator'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER set_daily_advice_updated_at
  BEFORE UPDATE ON public.daily_advice
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert some default advice
INSERT INTO public.daily_advice (title, message, category) VALUES
  ('Practica con Propósito', 'Cada ensayo es una oportunidad para mejorar. Practica con dedicación y verás el fruto de tu esfuerzo.', 'ministry'),
  ('La Excelencia en el Servicio', 'Servir a Dios requiere excelencia. Prepárate bien para cada presentación y glorifica Su nombre.', 'ministry'),
  ('Unidad en el Ministerio', 'La unidad del equipo es fundamental. Apoya a tus compañeros y trabajen juntos por un objetivo común.', 'ministry'),
  ('Disciplina Espiritual', 'Mantén tu vida espiritual activa. La adoración comienza con una relación personal con Dios.', 'spiritual'),
  ('Humildad en el Servicio', 'Recuerda que no se trata de ti, sino de glorificar a Dios. Sirve con humildad y amor.', 'spiritual'),
  ('Perseverancia', 'Los desafíos son oportunidades de crecimiento. No te rindas, Dios está contigo en cada paso.', 'encouragement'),
  ('Gratitud Diaria', 'Da gracias a Dios por cada oportunidad de servirle. La gratitud transforma tu perspectiva.', 'spiritual'),
  ('Comunicación Efectiva', 'Una buena comunicación fortalece al equipo. Mantente en contacto y expresa tus necesidades.', 'ministry');