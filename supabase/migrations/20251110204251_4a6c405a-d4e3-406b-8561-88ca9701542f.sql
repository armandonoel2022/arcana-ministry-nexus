-- Agregar constraint único a la columna name de scheduled_notifications
ALTER TABLE scheduled_notifications 
ADD CONSTRAINT scheduled_notifications_name_key UNIQUE (name);

-- Insertar notificaciones programadas predeterminadas
INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Servicios Lunes 7AM', 'Notificación de servicios del fin de semana - Lunes', 'service_overlay', 1, '07:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Servicios Lunes 7AM');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Servicios Martes 7AM', 'Notificación de servicios del fin de semana - Martes', 'service_overlay', 2, '07:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Servicios Martes 7AM');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Servicios Miércoles 7AM', 'Notificación de servicios del fin de semana - Miércoles', 'service_overlay', 3, '07:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Servicios Miércoles 7AM');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Servicios Jueves 7AM', 'Notificación de servicios del fin de semana - Jueves', 'service_overlay', 4, '07:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Servicios Jueves 7AM');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Servicios Viernes 7AM', 'Notificación de servicios del fin de semana - Viernes', 'service_overlay', 5, '07:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Servicios Viernes 7AM');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Servicios Sábado 7AM', 'Notificación de servicios del fin de semana - Sábado', 'service_overlay', 6, '07:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Servicios Sábado 7AM');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Versículo Domingo Mediodía', 'Versículo del día - Domingo', 'daily_verse', 0, '12:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Versículo Domingo Mediodía');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Versículo Lunes Mediodía', 'Versículo del día - Lunes', 'daily_verse', 1, '12:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Versículo Lunes Mediodía');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Versículo Martes Mediodía', 'Versículo del día - Martes', 'daily_verse', 2, '12:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Versículo Martes Mediodía');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Versículo Miércoles Mediodía', 'Versículo del día - Miércoles', 'daily_verse', 3, '12:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Versículo Miércoles Mediodía');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Versículo Jueves Mediodía', 'Versículo del día - Jueves', 'daily_verse', 4, '12:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Versículo Jueves Mediodía');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Versículo Viernes Mediodía', 'Versículo del día - Viernes', 'daily_verse', 5, '12:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Versículo Viernes Mediodía');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Versículo Sábado Mediodía', 'Versículo del día - Sábado', 'daily_verse', 6, '12:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Versículo Sábado Mediodía');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Consejo Domingo 3PM', 'Consejo del día - Domingo', 'daily_advice', 0, '15:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Consejo Domingo 3PM');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Consejo Lunes 3PM', 'Consejo del día - Lunes', 'daily_advice', 1, '15:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Consejo Lunes 3PM');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Consejo Martes 3PM', 'Consejo del día - Martes', 'daily_advice', 2, '15:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Consejo Martes 3PM');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Consejo Miércoles 3PM', 'Consejo del día - Miércoles', 'daily_advice', 3, '15:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Consejo Miércoles 3PM');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Consejo Jueves 3PM', 'Consejo del día - Jueves', 'daily_advice', 4, '15:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Consejo Jueves 3PM');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Consejo Viernes 3PM', 'Consejo del día - Viernes', 'daily_advice', 5, '15:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Consejo Viernes 3PM');

INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
SELECT 'Consejo Sábado 3PM', 'Consejo del día - Sábado', 'daily_advice', 6, '15:00', true, 'all', '{"show_overlay": true}'
WHERE NOT EXISTS (SELECT 1 FROM scheduled_notifications WHERE name = 'Consejo Sábado 3PM');