-- Fix notify_song_selection ORDER BY usage inside string_agg to avoid GROUP BY error
CREATE OR REPLACE FUNCTION public.notify_song_selection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    service_info RECORD;
    all_songs TEXT;
    member_record RECORD;
BEGIN
    -- Obtener información del servicio
    SELECT title, service_date, leader INTO service_info
    FROM services
    WHERE id = NEW.service_id;
    
    -- Crear lista de canciones seleccionadas para este servicio
    -- Usar ORDER BY dentro de string_agg para evitar errores de GROUP BY
    SELECT string_agg(
               s.title || ' - ' || COALESCE(s.artist, 'Artista desconocido'),
               E'\n' 
               ORDER BY ss.song_order
           )
    INTO all_songs
    FROM service_songs ss
    JOIN songs s ON ss.song_id = s.id
    WHERE ss.service_id = NEW.service_id;
    
    -- Solo enviar notificación si hay canciones y es la primera canción agregada
    -- (para evitar múltiples notificaciones por cada canción)
    IF all_songs IS NOT NULL AND (
        SELECT COUNT(*) FROM service_songs WHERE service_id = NEW.service_id
    ) = 1 THEN
        -- Enviar notificación a todos los miembros activos
        FOR member_record IN
            SELECT id FROM profiles WHERE is_active = true
        LOOP
            INSERT INTO system_notifications (
                recipient_id,
                type,
                title,
                message,
                notification_category,
                metadata
            ) VALUES (
                member_record.id,
                'song_selection',
                'Canciones Seleccionadas',
                'Se han seleccionado las canciones para el servicio "' || service_info.title || '" del ' || 
                to_char(service_info.service_date, 'DD/MM/YYYY') || 
                '. Canciones seleccionadas:' || E'\n' || all_songs,
                'repertory',
                jsonb_build_object(
                    'service_id', NEW.service_id,
                    'service_title', service_info.title,
                    'service_date', service_info.service_date,
                    'service_leader', service_info.leader,
                    'songs_count', (SELECT COUNT(*) FROM service_songs WHERE service_id = NEW.service_id)
                )
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;