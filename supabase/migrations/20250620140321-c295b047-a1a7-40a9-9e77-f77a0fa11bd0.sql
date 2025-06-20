
-- Crear tabla para almacenar versos bíblicos
CREATE TABLE public.bible_verses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  version TEXT DEFAULT 'RVR1960',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para el verso diario
CREATE TABLE public.daily_verses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verse_id UUID REFERENCES public.bible_verses(id) NOT NULL,
  date DATE NOT NULL UNIQUE,
  reflection TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para ambas tablas
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;

-- Políticas para bible_verses (todos pueden leer, solo admins pueden escribir)
CREATE POLICY "Anyone can view bible verses" ON public.bible_verses FOR SELECT USING (true);
CREATE POLICY "Only admins can manage bible verses" ON public.bible_verses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'administrator'
  )
);

-- Políticas para daily_verses (todos pueden leer, solo admins pueden escribir)
CREATE POLICY "Anyone can view daily verses" ON public.daily_verses FOR SELECT USING (true);
CREATE POLICY "Only admins can manage daily verses" ON public.daily_verses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'administrator'
  )
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_bible_verses_book_chapter_verse ON public.bible_verses(book, chapter, verse);
CREATE INDEX idx_daily_verses_date ON public.daily_verses(date);

-- Insertar algunos versos de ejemplo
INSERT INTO public.bible_verses (book, chapter, verse, text) VALUES
('Juan', 3, 16, 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.'),
('Filipenses', 4, 13, 'Todo lo puedo en Cristo que me fortalece.'),
('Salmos', 23, 1, 'Jehová es mi pastor; nada me faltará.'),
('Romanos', 8, 28, 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.'),
('Proverbios', 3, 5, 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.');
