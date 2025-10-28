-- Actualizar grupos de alabanza con la configuración correcta

-- Primero, desactivar todos los miembros actuales de estos tres grupos
UPDATE group_members 
SET is_active = false 
WHERE group_id IN (
  SELECT id FROM worship_groups 
  WHERE name IN ('Grupo de Aleida', 'Grupo de Keyla', 'Grupo de Massy')
);

-- ===========================================
-- GRUPO DE ALEIDA
-- ===========================================

-- Aleida Geomar Batista Ventura - Soprano - Corista - Micrófono #2
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Aleida'),
  (SELECT id FROM members WHERE nombres = 'Aleida Geomar' AND apellidos = 'Batista Ventura'),
  'vocals', false, true, 2, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = false, mic_order = 2;

-- Eliabi Joana Sierra Castillo - Soprano - Directora - Micrófono #1
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Aleida'),
  (SELECT id FROM members WHERE nombres = 'Eliabi Joana' AND apellidos = 'Sierra Castillo'),
  'vocals', true, true, 1, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = true, mic_order = 1;

-- Félix Nicolás Peralta Hernández - Tenor - Corista - Micrófono #3
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Aleida'),
  (SELECT id FROM members WHERE nombres = 'Félix Nicolás' AND apellidos = 'Peralta Hernández'),
  'vocals', false, true, 3, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = false, mic_order = 3;

-- Fior Daliza Paniagua - Contralto - Corista - Micrófono #4
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Aleida'),
  (SELECT id FROM members WHERE nombres = 'Fior Daliza' AND apellidos = 'Paniagua'),
  'vocals', false, true, 4, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = false, mic_order = 4;

-- Ruth Esmailin Ramirez - Contralto - Corista - Micrófono #5
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Aleida'),
  (SELECT id FROM members WHERE nombres = 'Ruth Esmailin' AND apellidos = 'Ramirez'),
  'vocals', false, true, 5, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = false, mic_order = 5;

-- ===========================================
-- GRUPO DE KEYLA
-- ===========================================

-- Keyla Yanira Medrano Medrano - Soprano - Directora - Micrófono #2
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Keyla'),
  (SELECT id FROM members WHERE nombres = 'Keyla Yanira' AND apellidos = 'Medrano Medrano'),
  'vocals', true, true, 2, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = true, mic_order = 2;

-- Yindhia Carolina Santana Castillo - Soprano - Corista - Micrófono #1
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Keyla'),
  (SELECT id FROM members WHERE nombres = 'Yindhia Carolina' AND apellidos = 'Santana Castillo'),
  'vocals', false, true, 1, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = false, mic_order = 1;

-- Arizoni Liriano medina - Bajo - Corista - Micrófono #3
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Keyla'),
  (SELECT id FROM members WHERE nombres = 'Arizoni' AND apellidos = 'Liriano medina'),
  'vocals', false, true, 3, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = false, mic_order = 3;

-- Aida Lorena Pacheco De Santana - Contralto - Corista - Micrófono #4
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Keyla'),
  (SELECT id FROM members WHERE nombres = 'Aida Lorena' AND apellidos = 'Pacheco De Santana'),
  'vocals', false, true, 4, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = false, mic_order = 4;

-- Sugey A. González Garó - Contralto - Corista - Micrófono #5
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Keyla'),
  (SELECT id FROM members WHERE nombres = 'Sugey A.' AND apellidos = 'González Garó'),
  'vocals', false, true, 5, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = false, mic_order = 5;

-- ===========================================
-- GRUPO DE MASSY
-- ===========================================

-- Damaris Castillo Jimenez - Soprano - Directora - Micrófono #2
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Massy'),
  (SELECT id FROM members WHERE nombres = 'Damaris' AND apellidos = 'Castillo Jimenez'),
  'vocals', true, true, 2, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = true, mic_order = 2;

-- Jisell Amada Mauricio Paniagua - Soprano - Directora - Micrófono #1
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Massy'),
  (SELECT id FROM members WHERE nombres = 'Jisell Amada' AND apellidos = 'Mauricio Paniagua'),
  'vocals', true, true, 1, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = true, mic_order = 1;

-- Fredderid Abrahan Valera Montoya - Tenor - Corista - Micrófono #3
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Massy'),
  (SELECT id FROM members WHERE nombres = 'Fredderid Abrahan' AND apellidos = 'Valera Montoya'),
  'vocals', false, true, 3, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = false, mic_order = 3;

-- Rosely Montero - Contralto - Corista - Micrófono #4
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Massy'),
  (SELECT id FROM members WHERE nombres = 'Rosely' AND apellidos = 'Montero'),
  'vocals', false, true, 4, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = false, mic_order = 4;

-- Rodes Esther Santana Cuesta - Contralto - Corista - Micrófono #5
INSERT INTO group_members (group_id, user_id, instrument, is_leader, is_active, mic_order, joined_date)
SELECT 
  (SELECT id FROM worship_groups WHERE name = 'Grupo de Massy'),
  (SELECT id FROM members WHERE nombres = 'Rodes Esther' AND apellidos = 'Santana Cuesta'),
  'vocals', false, true, 5, CURRENT_DATE
ON CONFLICT (group_id, user_id, instrument) 
DO UPDATE SET is_active = true, is_leader = false, mic_order = 5;

-- Actualizar el campo voz_instrumento en la tabla members para reflejar las voces correctas
UPDATE members SET voz_instrumento = 'Soprano' WHERE nombres = 'Aleida Geomar' AND apellidos = 'Batista Ventura';
UPDATE members SET voz_instrumento = 'Soprano' WHERE nombres = 'Eliabi Joana' AND apellidos = 'Sierra Castillo';
UPDATE members SET voz_instrumento = 'Tenor' WHERE nombres = 'Félix Nicolás' AND apellidos = 'Peralta Hernández';
UPDATE members SET voz_instrumento = 'Contralto' WHERE nombres = 'Fior Daliza' AND apellidos = 'Paniagua';
UPDATE members SET voz_instrumento = 'Contralto' WHERE nombres = 'Ruth Esmailin' AND apellidos = 'Ramirez';

UPDATE members SET voz_instrumento = 'Soprano' WHERE nombres = 'Keyla Yanira' AND apellidos = 'Medrano Medrano';
UPDATE members SET voz_instrumento = 'Soprano' WHERE nombres = 'Yindhia Carolina' AND apellidos = 'Santana Castillo';
UPDATE members SET voz_instrumento = 'Bajo' WHERE nombres = 'Arizoni' AND apellidos = 'Liriano medina';
UPDATE members SET voz_instrumento = 'Contralto' WHERE nombres = 'Aida Lorena' AND apellidos = 'Pacheco De Santana';
UPDATE members SET voz_instrumento = 'Contralto' WHERE nombres = 'Sugey A.' AND apellidos = 'González Garó';

UPDATE members SET voz_instrumento = 'Soprano' WHERE nombres = 'Damaris' AND apellidos = 'Castillo Jimenez';
UPDATE members SET voz_instrumento = 'Soprano' WHERE nombres = 'Jisell Amada' AND apellidos = 'Mauricio Paniagua';
UPDATE members SET voz_instrumento = 'Tenor' WHERE nombres = 'Fredderid Abrahan' AND apellidos = 'Valera Montoya';
UPDATE members SET voz_instrumento = 'Contralto' WHERE nombres = 'Rosely' AND apellidos = 'Montero';
UPDATE members SET voz_instrumento = 'Contralto' WHERE nombres = 'Rodes Esther' AND apellidos = 'Santana Cuesta';