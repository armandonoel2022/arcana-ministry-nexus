-- Insertar notificaciones programadas que no existan
INSERT INTO scheduled_notifications (name, description, notification_type, day_of_week, time, is_active, target_audience, metadata)
VALUES
  ('Servicios Martes 7AM', 'Notificación de servicios del fin de semana - Martes', 'service_overlay', 2, '07:00', true, 'all', '{"show_overlay": true}'),
  ('Servicios Miércoles 7AM', 'Notificación de servicios del fin de semana - Miércoles', 'service_overlay', 3, '07:00', true, 'all', '{"show_overlay": true}'),
  ('Servicios Jueves 7AM', 'Notificación de servicios del fin de semana - Jueves', 'service_overlay', 4, '07:00', true, 'all', '{"show_overlay": true}'),
  ('Servicios Viernes 7AM', 'Notificación de servicios del fin de semana - Viernes', 'service_overlay', 5, '07:00', true, 'all', '{"show_overlay": true}'),
  ('Servicios Sábado 7AM', 'Notificación de servicios del fin de semana - Sábado', 'service_overlay', 6, '07:00', true, 'all', '{"show_overlay": true}'),
  ('Versículo Domingo Mediodía', 'Versículo del día - Domingo', 'daily_verse', 0, '12:00', true, 'all', '{"show_overlay": true}'),
  ('Versículo Lunes Mediodía', 'Versículo del día - Lunes', 'daily_verse', 1, '12:00', true, 'all', '{"show_overlay": true}'),
  ('Versículo Martes Mediodía', 'Versículo del día - Martes', 'daily_verse', 2, '12:00', true, 'all', '{"show_overlay": true}'),
  ('Versículo Miércoles Mediodía', 'Versículo del día - Miércoles', 'daily_verse', 3, '12:00', true, 'all', '{"show_overlay": true}'),
  ('Versículo Jueves Mediodía', 'Versículo del día - Jueves', 'daily_verse', 4, '12:00', true, 'all', '{"show_overlay": true}'),
  ('Versículo Viernes Mediodía', 'Versículo del día - Viernes', 'daily_verse', 5, '12:00', true, 'all', '{"show_overlay": true}'),
  ('Versículo Sábado Mediodía', 'Versículo del día - Sábado', 'daily_verse', 6, '12:00', true, 'all', '{"show_overlay": true}'),
  ('Consejo Domingo 3PM', 'Consejo del día - Domingo', 'daily_advice', 0, '15:00', true, 'all', '{"show_overlay": true}'),
  ('Consejo Lunes 3PM', 'Consejo del día - Lunes', 'daily_advice', 1, '15:00', true, 'all', '{"show_overlay": true}'),
  ('Consejo Martes 3PM', 'Consejo del día - Martes', 'daily_advice', 2, '15:00', true, 'all', '{"show_overlay": true}'),
  ('Consejo Miércoles 3PM', 'Consejo del día - Miércoles', 'daily_advice', 3, '15:00', true, 'all', '{"show_overlay": true}'),
  ('Consejo Jueves 3PM', 'Consejo del día - Jueves', 'daily_advice', 4, '15:00', true, 'all', '{"show_overlay": true}'),
  ('Consejo Viernes 3PM', 'Consejo del día - Viernes', 'daily_advice', 5, '15:00', true, 'all', '{"show_overlay": true}'),
  ('Consejo Sábado 3PM', 'Consejo del día - Sábado', 'daily_advice', 6, '15:00', true, 'all', '{"show_overlay": true}')
ON CONFLICT (name) DO NOTHING;