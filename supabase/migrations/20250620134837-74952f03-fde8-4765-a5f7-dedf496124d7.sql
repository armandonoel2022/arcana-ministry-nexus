
-- Actualizar el primer usuario registrado para que sea administrador
-- Esto asume que eres el primer usuario en registrarse
UPDATE public.profiles 
SET role = 'administrator' 
WHERE id = (
  SELECT id FROM public.profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Como alternativa, si sabes tu email específico, puedes usar esta consulta:
-- UPDATE public.profiles 
-- SET role = 'administrator' 
-- WHERE email = 'tu-email@example.com';
