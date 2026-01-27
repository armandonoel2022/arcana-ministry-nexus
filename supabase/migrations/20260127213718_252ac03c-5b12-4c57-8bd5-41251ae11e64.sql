
-- Agregar política DELETE para song_selections
-- Permite que usuarios autenticados eliminen sus propias selecciones O que administradores/líderes eliminen cualquiera

CREATE POLICY "Authenticated users can delete song selections"
ON public.song_selections
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND (
    selected_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'leader')
    )
  )
);
