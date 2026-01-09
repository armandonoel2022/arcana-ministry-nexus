-- Primero eliminar la política existente
DROP POLICY IF EXISTS "Users can manage own devices" ON user_devices;

-- Crear políticas separadas más específicas
CREATE POLICY "Users can view own devices" 
ON user_devices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" 
ON user_devices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices" 
ON user_devices 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices" 
ON user_devices 
FOR DELETE 
USING (auth.uid() = user_id);