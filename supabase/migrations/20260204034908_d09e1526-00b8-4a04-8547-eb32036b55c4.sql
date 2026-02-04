-- Actualizar política de INSERT para permitir admins con rol 'admin'
DROP POLICY IF EXISTS "Admins can insert leaves" ON public.member_leaves;

CREATE POLICY "Admins can insert leaves"
  ON public.member_leaves
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    is_administrator(auth.uid()) OR
    (requested_by = auth.uid() AND leave_type IN ('enfermedad', 'maternidad', 'estudios', 'trabajo', 'vacaciones', 'otra'))
  );

-- También actualizamos las otras políticas para considerar is_administrator
DROP POLICY IF EXISTS "Admins can update leaves" ON public.member_leaves;

CREATE POLICY "Admins can update leaves"
  ON public.member_leaves
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') OR 
    is_administrator(auth.uid()) OR 
    requested_by = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can delete leaves" ON public.member_leaves;

CREATE POLICY "Admins can delete leaves"
  ON public.member_leaves
  FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_administrator(auth.uid()));