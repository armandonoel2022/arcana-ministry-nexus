-- Modificar la tabla scheduled_notifications para permitir múltiples días
-- Primero eliminamos la columna day_of_week existente
ALTER TABLE scheduled_notifications DROP COLUMN IF EXISTS day_of_week;

-- Ahora agregamos la nueva columna como array de integers
ALTER TABLE scheduled_notifications ADD COLUMN days_of_week integer[] NOT NULL DEFAULT ARRAY[1];

-- Actualizar índice para mejorar búsqueda
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_days_time ON scheduled_notifications USING gin(days_of_week);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_active ON scheduled_notifications(is_active) WHERE is_active = true;