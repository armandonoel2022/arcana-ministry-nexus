-- Add category column to songs table
ALTER TABLE songs ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- Add comment
COMMENT ON COLUMN songs.category IS 'Category of the song: general, himnario, villancicos, adn';

-- Update existing ADN songs based on tags
UPDATE songs 
SET category = 'adn' 
WHERE tags && ARRAY['adn', 'adnarcadenoe', 'arcadenoe'];

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_songs_category ON songs(category);