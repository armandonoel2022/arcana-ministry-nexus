
-- Primero, vamos a verificar y arreglar el constraint que está fallando
-- El error indica que el tipo 'song_selection' no está permitido en system_notifications

-- Vamos a ver qué tipos están permitidos y agregar el que falta
DO $$
BEGIN
    -- Intentar agregar el tipo song_selection al enum si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'song_selection' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'notification_type'
        )
    ) THEN
        -- Si no existe el enum notification_type, lo creamos
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
            CREATE TYPE notification_type AS ENUM (
                'general',
                'agenda',
                'repertory', 
                'director_replacement',
                'song_selection',
                'daily_verse',
                'system'
            );
            
            -- Agregar la columna type con el enum si no tiene constraint
            ALTER TABLE public.system_notifications DROP CONSTRAINT IF EXISTS system_notifications_type_check;
            ALTER TABLE public.system_notifications ALTER COLUMN type TYPE notification_type USING type::notification_type;
        ELSE
            -- Si existe el enum, solo agregar el valor que falta
            ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'song_selection';
        END IF;
    END IF;
END $$;

-- Asegurar que la tabla song_selections tenga los índices necesarios para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_song_selections_service_id ON public.song_selections(service_id);
CREATE INDEX IF NOT EXISTS idx_song_selections_song_id ON public.song_selections(song_id);
CREATE INDEX IF NOT EXISTS idx_song_selections_selected_by ON public.song_selections(selected_by);

-- Crear una vista para facilitar la consulta de canciones seleccionadas por servicio
CREATE OR REPLACE VIEW service_selected_songs AS
SELECT 
    ss.service_id,
    ss.song_id,
    ss.selected_by,
    ss.selection_reason,
    ss.created_at as selected_at,
    s.title as song_title,
    s.artist,
    s.key_signature,
    s.difficulty_level,
    p.full_name as selected_by_name,
    srv.title as service_title,
    srv.service_date,
    srv.leader as service_leader
FROM public.song_selections ss
JOIN public.songs s ON ss.song_id = s.id
JOIN public.profiles p ON ss.selected_by = p.id  
JOIN public.services srv ON ss.service_id = srv.id
WHERE s.is_active = true
ORDER BY ss.created_at DESC;
