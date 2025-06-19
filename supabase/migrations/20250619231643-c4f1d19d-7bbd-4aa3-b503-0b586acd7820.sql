
-- Crear enum para instrumentos (verificar si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'instrument_type') THEN
        CREATE TYPE instrument_type AS ENUM ('vocal', 'guitar', 'bass', 'drums', 'piano', 'keyboard', 'violin', 'other');
    END IF;
END $$;

-- La tabla songs ya existe, pero vamos a asegurar que tenga todos los campos necesarios
-- Si algunos campos no existen, los agregamos
DO $$ 
BEGIN
    -- Verificar y agregar campos que podrían faltar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='songs' AND column_name='difficulty_level') THEN
        ALTER TABLE songs ADD COLUMN difficulty_level INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='songs' AND column_name='tempo') THEN
        ALTER TABLE songs ADD COLUMN tempo TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='songs' AND column_name='key_signature') THEN
        ALTER TABLE songs ADD COLUMN key_signature TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='songs' AND column_name='tags') THEN
        ALTER TABLE songs ADD COLUMN tags TEXT[];
    END IF;
END $$;

-- Habilitar RLS en las tablas si no está habilitado
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_song_knowledge ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla songs (acceso público para lectura, solo admins pueden escribir)
DROP POLICY IF EXISTS "Anyone can view songs" ON songs;
CREATE POLICY "Anyone can view songs" ON songs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only authenticated users can insert songs" ON songs;
CREATE POLICY "Only authenticated users can insert songs" ON songs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Only song creators can update their songs" ON songs;
CREATE POLICY "Only song creators can update their songs" ON songs
    FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Only song creators can delete their songs" ON songs;
CREATE POLICY "Only song creators can delete their songs" ON songs
    FOR DELETE USING (auth.uid() = created_by);

-- Políticas para user_song_knowledge
DROP POLICY IF EXISTS "Users can view their own song knowledge" ON user_song_knowledge;
CREATE POLICY "Users can view their own song knowledge" ON user_song_knowledge
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own song knowledge" ON user_song_knowledge;
CREATE POLICY "Users can insert their own song knowledge" ON user_song_knowledge
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own song knowledge" ON user_song_knowledge;
CREATE POLICY "Users can update their own song knowledge" ON user_song_knowledge
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own song knowledge" ON user_song_knowledge;
CREATE POLICY "Users can delete their own song knowledge" ON user_song_knowledge
    FOR DELETE USING (auth.uid() = user_id);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
CREATE INDEX IF NOT EXISTS idx_songs_tags ON songs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_song_knowledge_user_song ON user_song_knowledge(user_id, song_id);

-- Trigger para actualizar updated_at en songs
DROP TRIGGER IF EXISTS handle_updated_at_songs ON songs;
CREATE TRIGGER handle_updated_at_songs
    BEFORE UPDATE ON songs
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Trigger para actualizar last_updated en user_song_knowledge
DROP TRIGGER IF EXISTS handle_updated_at_user_song_knowledge ON user_song_knowledge;
CREATE TRIGGER handle_updated_at_user_song_knowledge
    BEFORE UPDATE ON user_song_knowledge
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();
