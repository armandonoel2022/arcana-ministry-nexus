-- Actualizar función para usar el tipo correcto de notificación
CREATE OR REPLACE FUNCTION process_service_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    scheduled_notif RECORD;
    service_info RECORD;
    profile_record RECORD;
    current_day INTEGER;
    time_now TIME;
BEGIN
    current_day := EXTRACT(DOW FROM NOW());
    time_now := NOW()::TIME;
    
    FOR scheduled_notif IN
        SELECT * FROM scheduled_notifications
        WHERE is_active = true
        AND notification_type = 'service_overlay'
        AND day_of_week = current_day
        AND time <= time_now
        AND time >= (time_now - INTERVAL '5 minutes')
    LOOP
        SELECT * INTO service_info
        FROM services
        WHERE service_date >= CURRENT_DATE
        AND service_date <= CURRENT_DATE + INTERVAL '7 days'
        ORDER BY service_date ASC
        LIMIT 1;
        
        IF service_info.id IS NOT NULL THEN
            FOR profile_record IN
                SELECT id FROM profiles WHERE is_active = true
            LOOP
                IF NOT EXISTS (
                    SELECT 1 FROM system_notifications
                    WHERE recipient_id = profile_record.id
                    AND type = 'service_overlay'
                    AND metadata->>'service_id' = service_info.id::text
                    AND created_at >= NOW() - INTERVAL '1 day'
                ) THEN
                    INSERT INTO system_notifications (
                        recipient_id,
                        type,
                        title,
                        message,
                        notification_category,
                        priority,
                        metadata
                    ) VALUES (
                        profile_record.id,
                        'service_overlay',
                        'Servicio del Fin de Semana',
                        'Revisa los detalles del próximo servicio: ' || service_info.title,
                        'service',
                        2,
                        jsonb_build_object(
                            'service_id', service_info.id,
                            'service_title', service_info.title,
                            'service_date', service_info.service_date,
                            'service_leader', service_info.leader,
                            'service_type', service_info.service_type,
                            'location', service_info.location,
                            'scheduled_notification_id', scheduled_notif.id
                        )
                    );
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$$;