-- Actualizar el enum notification_type para incluir los tipos de cumpleaños
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'birthday_daily';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'birthday_monthly';