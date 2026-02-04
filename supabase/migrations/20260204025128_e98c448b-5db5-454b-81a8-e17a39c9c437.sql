-- Corregir fechas de servicios de febrero 2026 según la agenda proporcionada

-- Feb 2 → Feb 1 (1er Domingo)
UPDATE services SET service_date = '2026-02-01 12:00:00+00' WHERE id = '89845903-26f2-428a-b3b0-cfbd54fab3d9';
UPDATE services SET service_date = '2026-02-01 14:45:00+00' WHERE id = 'ee08e111-e625-4e03-a841-6f3c747d3656';

-- Feb 9 → Feb 8 (2do Domingo) - También corregir líderes y grupos
UPDATE services SET 
  service_date = '2026-02-08 12:00:00+00', 
  leader = 'Maria Del A. Pérez Santana', 
  assigned_group_id = '1275fdde-515c-4843-a7a3-08daec62e69e'
WHERE id = '17c4ea8f-7a79-4920-9a7d-e7fe61ba0ae0';

UPDATE services SET 
  service_date = '2026-02-08 14:45:00+00', 
  leader = 'Armando Noel', 
  assigned_group_id = 'e5297132-d86c-4978-9b71-a98d2581b977'
WHERE id = 'f2a2b604-e2e4-4db9-ac1d-60821f94e833';

-- Feb 16 → Feb 15 (3er Domingo)
UPDATE services SET service_date = '2026-02-15 12:00:00+00' WHERE id = '927fde5b-d3fc-4d1e-a1ba-4b547e3484cb';
UPDATE services SET service_date = '2026-02-15 14:45:00+00' WHERE id = '34a16db1-6d3c-4894-b6e2-86822820a16b';

-- Feb 19 → Feb 18 (3er Miércoles)
UPDATE services SET service_date = '2026-02-18 23:00:00+00' WHERE id = '7fd40afb-0867-48da-b993-fae267fc0360';

-- Feb 23 → Feb 22 (4to Domingo - Cierre de Cuarentena)
UPDATE services SET service_date = '2026-02-22 13:00:00+00' WHERE id = '7279f87b-6a7e-41cf-8bf6-337cfdff54a9';

-- El servicio del 15 de feb a las 7pm (id: 40b52749) debe ser del 14 de feb (2do Sábado)
UPDATE services SET service_date = '2026-02-14 23:00:00+00' WHERE id = '40b52749-2dd0-446f-9562-9592d4fdb019';

-- Agregar servicio faltante: 21 de febrero (3er Sábado) - Maria Del A. Pérez Santana - Grupo de Massy
INSERT INTO services (service_date, title, leader, assigned_group_id, service_type, special_activity, location, is_confirmed)
VALUES ('2026-02-21 23:00:00+00', '07:00 p.m.', 'Maria Del A. Pérez Santana', 'e5297132-d86c-4978-9b71-a98d2581b977', 'cuarentena', 'Culto de Oración', 'Templo Principal', false);