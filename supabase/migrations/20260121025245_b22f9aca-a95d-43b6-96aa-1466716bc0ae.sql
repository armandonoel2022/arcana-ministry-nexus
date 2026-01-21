-- Generar servicios de cuarentena para 2026
-- Sábados hasta el 21 de febrero: grupo que descansa ese fin de semana hace coros
-- Miércoles después del 21 de febrero: grupo que descansó el fin de semana anterior hace coros

-- IDs de grupos
-- ALEIDA: 8218442a-9406-4b97-9212-29b50279f2ce
-- KEYLA: 1275fdde-515c-4843-a7a3-08daec62e69e
-- MASSY: e5297132-d86c-4978-9b71-a98d2581b977

-- Sábados hasta 21 de febrero 2026 (3 ene, 10 ene, 17 ene, 7 feb, 14 feb, 21 feb)
-- El grupo que descansa es el que NO está asignado ese domingo

-- Sábado 3 ene 2026 - Domingo 4 ene: Aleida + Keyla cantan, MASSY descansa
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-01-03 23:00:00+00', 'Armando Noel Charle', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Enero'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-01-03' AND service_type = 'cuarentena');

-- Sábado 10 ene 2026 - Domingo 11 ene: Massy + Aleida cantan, KEYLA descansa
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-01-10 23:00:00+00', 'Damaris Castillo Jimenez', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Enero'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-01-10' AND service_type = 'cuarentena');

-- Sábado 17 ene 2026 - Domingo 18 ene: Keyla + Massy cantan, ALEIDA descansa
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-01-17 23:00:00+00', 'Maria del A. Pérez Santana', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Enero'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-01-17' AND service_type = 'cuarentena');

-- Sábado 31 ene 2026 - Domingo 1 feb: Massy + Aleida cantan, KEYLA descansa
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-01-31 23:00:00+00', 'Roosevelt Martinez', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Enero'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-01-31' AND service_type = 'cuarentena');

-- Sábado 7 feb 2026 - Domingo 8 feb: Keyla + Massy cantan, ALEIDA descansa
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-02-07 23:00:00+00', 'Guarionex García', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Febrero'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-02-07' AND service_type = 'cuarentena');

-- Sábado 14 feb 2026 - Domingo 15 feb: Aleida + Keyla cantan, MASSY descansa
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-02-14 23:00:00+00', 'Eliabi Joana Sierra Castillo', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Febrero'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-02-14' AND service_type = 'cuarentena');

-- Sábado 21 feb 2026 - Domingo 22 feb: Massy + Aleida cantan, KEYLA descansa (último sábado)
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-02-21 23:00:00+00', 'Keyla Yanira Medrano Medrano', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Febrero'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-02-21' AND service_type = 'cuarentena');

-- MIÉRCOLES después del 21 de febrero 2026 (resto del año)
-- Miércoles 25 feb 2026 - Domingo anterior 22 feb: Massy + Aleida cantaron, KEYLA descansó
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-02-25 23:00:00+00', 'Denny Alberto Santana', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Febrero'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-02-25' AND service_type = 'cuarentena');

-- Miércoles 4 mar 2026 - Domingo 1 mar: Keyla + Massy cantan, ALEIDA descansa
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-03-04 23:00:00+00', 'Félix Nicolás Peralta Hernández', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Marzo'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-03-04' AND service_type = 'cuarentena');

-- Miércoles 11 mar 2026 - Domingo 8 mar: Aleida + Keyla cantan, MASSY descansa
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-03-11 23:00:00+00', 'Armando Noel Charle', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Marzo'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-03-11' AND service_type = 'cuarentena');

-- Miércoles 18 mar 2026 - Domingo 15 mar: Massy + Aleida cantan, KEYLA descansa
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-03-18 23:00:00+00', 'Damaris Castillo Jimenez', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Marzo'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-03-18' AND service_type = 'cuarentena');

-- Miércoles 25 mar 2026 - Domingo 22 mar: Keyla + Massy cantan, ALEIDA descansa
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-03-25 23:00:00+00', 'Maria del A. Pérez Santana', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Marzo'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-03-25' AND service_type = 'cuarentena');

-- Abril 2026
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-04-01 23:00:00+00', 'Roosevelt Martinez', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Abril'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-04-01' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-04-08 23:00:00+00', 'Guarionex García', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Abril'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-04-08' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-04-15 23:00:00+00', 'Eliabi Joana Sierra Castillo', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Abril'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-04-15' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-04-22 23:00:00+00', 'Keyla Yanira Medrano Medrano', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Abril'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-04-22' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-04-29 23:00:00+00', 'Denny Alberto Santana', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Abril'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-04-29' AND service_type = 'cuarentena');

-- Mayo 2026
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-05-06 23:00:00+00', 'Félix Nicolás Peralta Hernández', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Mayo'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-05-06' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-05-13 23:00:00+00', 'Armando Noel Charle', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Mayo'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-05-13' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-05-20 23:00:00+00', 'Damaris Castillo Jimenez', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Mayo'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-05-20' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-05-27 23:00:00+00', 'Maria del A. Pérez Santana', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Mayo'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-05-27' AND service_type = 'cuarentena');

-- Junio 2026
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-06-03 23:00:00+00', 'Roosevelt Martinez', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Junio'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-06-03' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-06-10 23:00:00+00', 'Guarionex García', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Junio'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-06-10' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-06-17 23:00:00+00', 'Eliabi Joana Sierra Castillo', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Junio'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-06-17' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-06-24 23:00:00+00', 'Keyla Yanira Medrano Medrano', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Junio'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-06-24' AND service_type = 'cuarentena');

-- Julio 2026
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-07-01 23:00:00+00', 'Denny Alberto Santana', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Julio'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-07-01' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-07-08 23:00:00+00', 'Félix Nicolás Peralta Hernández', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Julio'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-07-08' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-07-15 23:00:00+00', 'Armando Noel Charle', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Julio'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-07-15' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-07-22 23:00:00+00', 'Damaris Castillo Jimenez', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Julio'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-07-22' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-07-29 23:00:00+00', 'Maria del A. Pérez Santana', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Julio'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-07-29' AND service_type = 'cuarentena');

-- Agosto 2026
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-08-05 23:00:00+00', 'Roosevelt Martinez', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Agosto'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-08-05' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-08-12 23:00:00+00', 'Guarionex García', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Agosto'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-08-12' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-08-19 23:00:00+00', 'Eliabi Joana Sierra Castillo', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Agosto'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-08-19' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-08-26 23:00:00+00', 'Keyla Yanira Medrano Medrano', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Agosto'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-08-26' AND service_type = 'cuarentena');

-- Septiembre 2026
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-09-02 23:00:00+00', 'Denny Alberto Santana', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Septiembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-09-02' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-09-09 23:00:00+00', 'Félix Nicolás Peralta Hernández', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Septiembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-09-09' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-09-16 23:00:00+00', 'Armando Noel Charle', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Septiembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-09-16' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-09-23 23:00:00+00', 'Damaris Castillo Jimenez', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Septiembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-09-23' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-09-30 23:00:00+00', 'Maria del A. Pérez Santana', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Septiembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-09-30' AND service_type = 'cuarentena');

-- Octubre 2026
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-10-07 23:00:00+00', 'Roosevelt Martinez', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Octubre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-10-07' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-10-14 23:00:00+00', 'Guarionex García', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Octubre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-10-14' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-10-21 23:00:00+00', 'Eliabi Joana Sierra Castillo', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Octubre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-10-21' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-10-28 23:00:00+00', 'Keyla Yanira Medrano Medrano', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Octubre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-10-28' AND service_type = 'cuarentena');

-- Noviembre 2026
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-11-04 23:00:00+00', 'Denny Alberto Santana', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Noviembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-11-04' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-11-11 23:00:00+00', 'Félix Nicolás Peralta Hernández', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Noviembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-11-11' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-11-18 23:00:00+00', 'Armando Noel Charle', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Noviembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-11-18' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-11-25 23:00:00+00', 'Damaris Castillo Jimenez', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Noviembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-11-25' AND service_type = 'cuarentena');

-- Diciembre 2026
INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-12-02 23:00:00+00', 'Maria del A. Pérez Santana', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Diciembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-12-02' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-12-09 23:00:00+00', 'Roosevelt Martinez', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Diciembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-12-09' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-12-16 23:00:00+00', 'Guarionex García', '1275fdde-515c-4843-a7a3-08daec62e69e', 'cuarentena', 'Templo Principal', false, 'Diciembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-12-16' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-12-23 23:00:00+00', 'Eliabi Joana Sierra Castillo', '8218442a-9406-4b97-9212-29b50279f2ce', 'cuarentena', 'Templo Principal', false, 'Diciembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-12-23' AND service_type = 'cuarentena');

INSERT INTO public.services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name)
SELECT '07:00 p.m.', '2026-12-30 23:00:00+00', 'Keyla Yanira Medrano Medrano', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Templo Principal', false, 'Diciembre'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_date::date = '2026-12-30' AND service_type = 'cuarentena');