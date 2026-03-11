
DO $$
DECLARE
  week_monday DATE;
  wed_date DATE;
  sun_date DATE;
  cycle_pos INT;
  week_idx INT := 0;
  
  aleida_id UUID := '8218442a-9406-4b97-9212-29b50279f2ce';
  keyla_id UUID := '1275fdde-515c-4843-a7a3-08daec62e69e';
  massy_id UUID := 'e5297132-d86c-4978-9b71-a98d2581b977';
  
  group_8am_id UUID;
  group_1045_id UUID;
  group_wed_id UUID;
  
  directors_pre TEXT[] := ARRAY[
    'Armando Noel Charle',
    'Eliabi Joana Sierra Castillo',
    'Félix Nicolás Peralta Hernández',
    'Guarionex García',
    'Maria del A. Pérez Santana'
  ];
  directors_full TEXT[] := ARRAY[
    'Armando Noel Charle',
    'Eliabi Joana Sierra Castillo',
    'Félix Nicolás Peralta Hernández',
    'Guarionex García',
    'Maria del A. Pérez Santana',
    'Damaris Castillo Jimenez',
    'Denny Alberto Santana',
    'Roosevelt Martinez'
  ];
  
  dirs TEXT[];
  dir_count INT;
  g_idx INT := 0;
  
  d_wed TEXT;
  d_8am TEXT;
  d_1045 TEXT;
  
  sun_nth INT;
  attempt INT;
  
  m_names TEXT[] := ARRAY['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

BEGIN
  DELETE FROM services 
  WHERE service_date >= '2026-03-16T00:00:00+00'::timestamptz
    AND service_type NOT IN ('especial');
  
  week_monday := '2026-03-16'::DATE;
  
  WHILE week_monday <= '2026-12-28'::DATE LOOP
    wed_date := week_monday + 2;
    sun_date := week_monday + 6;
    
    cycle_pos := week_idx % 3;
    
    CASE cycle_pos
      WHEN 0 THEN 
        group_8am_id := keyla_id;  group_1045_id := massy_id;  group_wed_id := keyla_id;
      WHEN 1 THEN 
        group_8am_id := aleida_id; group_1045_id := keyla_id;  group_wed_id := aleida_id;
      WHEN 2 THEN 
        group_8am_id := massy_id;  group_1045_id := aleida_id; group_wed_id := massy_id;
    END CASE;
    
    IF sun_date < '2026-05-01'::DATE THEN
      dirs := directors_pre;
    ELSE
      dirs := directors_full;
    END IF;
    dir_count := array_length(dirs, 1);
    
    sun_nth := CEIL(EXTRACT(DAY FROM sun_date)::NUMERIC / 7)::INT;
    
    d_wed := dirs[(g_idx % dir_count) + 1];
    g_idx := g_idx + 1;
    
    d_8am := dirs[(g_idx % dir_count) + 1];
    g_idx := g_idx + 1;
    
    attempt := 0;
    LOOP
      d_1045 := dirs[(g_idx % dir_count) + 1];
      
      IF d_1045 != d_8am
         AND NOT (d_1045 IN ('Guarionex García', 'Maria del A. Pérez Santana') AND sun_nth IN (1, 3))
      THEN
        g_idx := g_idx + 1;
        EXIT;
      END IF;
      
      g_idx := g_idx + 1;
      attempt := attempt + 1;
      
      IF attempt > dir_count * 3 THEN
        d_1045 := dirs[(g_idx % dir_count) + 1];
        IF d_1045 = d_8am THEN
          g_idx := g_idx + 1;
          d_1045 := dirs[(g_idx % dir_count) + 1];
        END IF;
        g_idx := g_idx + 1;
        EXIT;
      END IF;
    END LOOP;
    
    INSERT INTO services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name, month_order)
    VALUES (
      '07:00 p.m.',
      (wed_date::TIMESTAMP + TIME '23:00:00') AT TIME ZONE 'UTC',
      d_wed,
      group_wed_id,
      'Servicio de Miércoles',
      'Templo Principal',
      false,
      m_names[EXTRACT(MONTH FROM wed_date)::INT],
      NULL
    );
    
    INSERT INTO services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name, month_order)
    VALUES (
      '08:00 a.m.',
      (sun_date::TIMESTAMP + TIME '12:00:00') AT TIME ZONE 'UTC',
      d_8am,
      group_8am_id,
      'Servicio Dominical',
      'Templo Principal',
      false,
      m_names[EXTRACT(MONTH FROM sun_date)::INT],
      sun_nth
    );
    
    INSERT INTO services (title, service_date, leader, assigned_group_id, service_type, location, is_confirmed, month_name, month_order)
    VALUES (
      '10:45 a.m.',
      (sun_date::TIMESTAMP + TIME '14:45:00') AT TIME ZONE 'UTC',
      d_1045,
      group_1045_id,
      'Servicio Dominical',
      'Templo Principal',
      false,
      m_names[EXTRACT(MONTH FROM sun_date)::INT],
      sun_nth
    );
    
    week_monday := week_monday + 7;
    week_idx := week_idx + 1;
  END LOOP;
END $$;
