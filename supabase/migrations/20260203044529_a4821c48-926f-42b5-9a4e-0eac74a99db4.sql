-- First delete existing services in the quarantine period that will be replaced
DELETE FROM services 
WHERE service_date >= '2026-02-01' AND service_date <= '2026-03-02';

-- Insert the corrected services for February and March 2026

-- Feb 2, 2026 - 1er Domingo
INSERT INTO services (title, service_date, leader, service_type, location, special_activity, assigned_group_id)
VALUES 
  ('08:00 a.m.', '2026-02-02 12:00:00+00', 'Eliabi Joana Sierra Castillo', 'cuarentena', 'Templo Principal', 'Santa Comunión', 'e5297132-d86c-4978-9b71-a98d2581b977'),
  ('10:45 a.m.', '2026-02-02 14:45:00+00', 'Denny Alberto Santana', 'cuarentena', 'Templo Principal', 'Santa Comunión', '8218442a-9406-4b97-9212-29b50279f2ce');

-- Feb 4, 2026 - 1er Miércoles
INSERT INTO services (title, service_date, leader, service_type, location, special_activity, assigned_group_id)
VALUES 
  ('07:00 p.m.', '2026-02-04 23:00:00+00', 'Félix Nicolás Peralta Hernández', 'cuarentena', 'Templo Principal', 'Culto de Oración', '1275fdde-515c-4843-a7a3-08daec62e69e');

-- Feb 9, 2026 - 2do Domingo
INSERT INTO services (title, service_date, leader, service_type, location, special_activity, assigned_group_id)
VALUES 
  ('08:00 a.m.', '2026-02-09 12:00:00+00', 'Maria Del A. Pérez Santana', 'cuarentena', 'Templo Principal', 'Presentación de Niños', '1275fdde-515c-4843-a7a3-08daec62e69e'),
  ('10:45 a.m.', '2026-02-09 14:45:00+00', 'Armando Noel', 'cuarentena', 'Templo Principal', 'Presentación de Niños', 'e5297132-d86c-4978-9b71-a98d2581b977');

-- Feb 11, 2026 - 2do Miércoles
INSERT INTO services (title, service_date, leader, service_type, location, special_activity, assigned_group_id)
VALUES 
  ('07:00 p.m.', '2026-02-11 23:00:00+00', 'Eliabi Joana Sierra Castillo', 'cuarentena', 'Templo Principal', 'Culto de Oración', '8218442a-9406-4b97-9212-29b50279f2ce');

-- Feb 15, 2026 - 2do Sábado
INSERT INTO services (title, service_date, leader, service_type, location, special_activity, assigned_group_id)
VALUES 
  ('07:00 p.m.', '2026-02-15 23:00:00+00', 'Armando Noel', 'cuarentena', 'Templo Principal', 'Culto de Oración', '1275fdde-515c-4843-a7a3-08daec62e69e');

-- Feb 16, 2026 - 3er Domingo
INSERT INTO services (title, service_date, leader, service_type, location, special_activity, assigned_group_id)
VALUES 
  ('08:00 a.m.', '2026-02-16 12:00:00+00', 'Guarionex García', 'cuarentena', 'Templo Principal', NULL, '8218442a-9406-4b97-9212-29b50279f2ce'),
  ('10:45 a.m.', '2026-02-16 14:45:00+00', 'Keyla Medrano', 'cuarentena', 'Templo Principal', NULL, '1275fdde-515c-4843-a7a3-08daec62e69e');

-- Feb 19, 2026 - 3er Miércoles
INSERT INTO services (title, service_date, leader, service_type, location, special_activity, assigned_group_id)
VALUES 
  ('07:00 p.m.', '2026-02-19 23:00:00+00', 'Denny Alberto Santana', 'cuarentena', 'Templo Principal', 'Culto de Oración', '8218442a-9406-4b97-9212-29b50279f2ce');

-- Feb 23, 2026 - 4to Domingo - CIERRE DE CUARENTENA
INSERT INTO services (title, service_date, leader, service_type, location, special_activity, assigned_group_id)
VALUES 
  ('09:00 a.m.', '2026-02-23 13:00:00+00', 'TODOS', 'especial', 'Templo Principal', 'Servicio Especial: Cierre de Cuarentena', NULL);

-- Mar 2, 2026 - 1er Domingo (Post-Cuarentena)
INSERT INTO services (title, service_date, leader, service_type, location, special_activity, assigned_group_id)
VALUES 
  ('08:00 a.m.', '2026-03-02 12:00:00+00', 'Roosevelt Martínez', 'regular', 'Templo Principal', 'Santa Comunión', 'e5297132-d86c-4978-9b71-a98d2581b977'),
  ('10:45 a.m.', '2026-03-02 14:45:00+00', 'Denny Santana', 'regular', 'Templo Principal', 'Santa Comunión', '8218442a-9406-4b97-9212-29b50279f2ce');