-- Corregir líderes del 8 de febrero 2026:
-- Armando Noel a las 08:00 a.m.
-- Maria Del A. Pérez Santana a las 10:45 a.m.

UPDATE services SET 
  leader = 'Armando Noel', 
  assigned_group_id = 'e5297132-d86c-4978-9b71-a98d2581b977'
WHERE id = '17c4ea8f-7a79-4920-9a7d-e7fe61ba0ae0';

UPDATE services SET 
  leader = 'Maria Del A. Pérez Santana', 
  assigned_group_id = '1275fdde-515c-4843-a7a3-08daec62e69e'
WHERE id = 'f2a2b604-e2e4-4db9-ac1d-60821f94e833';