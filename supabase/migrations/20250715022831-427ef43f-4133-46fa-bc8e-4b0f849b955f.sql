-- Insert reflections for the Bible verses with themes
UPDATE public.bible_verses SET 
  text = text || ' (Reflexión: Que tu adoración sea genuina y humilde ante el Señor.)'
WHERE book = 'Salmo' AND chapter = 95 AND verse = 6;

UPDATE public.bible_verses SET 
  text = REPLACE(text, 'Dios es Espíritu; y los que le adoran, en espíritu y en verdad es necesario que adoren.', 'Dios es Espíritu; y los que le adoran, en espíritu y en verdad es necesario que adoren.')
WHERE book = 'Juan' AND chapter = 4 AND verse = 24;

-- Actually, let's create a separate table for themed reflections instead
CREATE TABLE IF NOT EXISTS public.verse_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verse_id UUID NOT NULL REFERENCES public.bible_verses(id),
  theme_name TEXT NOT NULL,
  reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verse_themes ENABLE ROW LEVEL SECURITY;

-- Create policies for verse themes
CREATE POLICY "Anyone can view verse themes" 
ON public.verse_themes 
FOR SELECT 
USING (true);

CREATE POLICY "Administrators can manage verse themes" 
ON public.verse_themes 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'administrator');

-- Insert theme data for the verses we added
INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Adoración', 'Que tu adoración sea genuina y humilde ante el Señor.'
FROM public.bible_verses bv 
WHERE bv.book = 'Salmo' AND bv.chapter = 95 AND bv.verse = 6;

INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Adoración', 'Adora con corazón sincero y en comunión con Dios.'
FROM public.bible_verses bv 
WHERE bv.book = 'Juan' AND bv.chapter = 4 AND bv.verse = 24;

INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Adoración', 'La adoración nace de un corazón gozoso.'
FROM public.bible_verses bv 
WHERE bv.book = 'Salmo' AND bv.chapter = 100 AND bv.verse = 2;

INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Adoración', 'Honra a Dios con una vida santa y llena de gratitud.'
FROM public.bible_verses bv 
WHERE bv.book = 'Salmo' AND bv.chapter = 29 AND bv.verse = 2;

INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Adoración', 'Alaba a Dios en todo tiempo, incluso en las pruebas.'
FROM public.bible_verses bv 
WHERE bv.book = 'Hebreos' AND bv.chapter = 13 AND bv.verse = 15;

-- Entrega theme verses
INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Entrega', 'Entrega todo tu ser a Dios como acto de adoración.'
FROM public.bible_verses bv 
WHERE bv.book = 'Romanos' AND bv.chapter = 12 AND bv.verse = 1;

INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Entrega', 'La entrega implica renunciar al yo para seguir a Cristo.'
FROM public.bible_verses bv 
WHERE bv.book = 'Mateo' AND bv.chapter = 16 AND bv.verse = 24;

INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Entrega', 'Vive para glorificar a quien te redimió.'
FROM public.bible_verses bv 
WHERE bv.book = '2 Corintios' AND bv.chapter = 5 AND bv.verse = 15;

INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Entrega', 'Deja que Cristo sea el centro de tu existencia.'
FROM public.bible_verses bv 
WHERE bv.book = 'Gálatas' AND bv.chapter = 2 AND bv.verse = 20;

INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Entrega', 'Que tu vida refleje total dependencia de Él.'
FROM public.bible_verses bv 
WHERE bv.book = 'Filipenses' AND bv.chapter = 1 AND bv.verse = 21;

-- Fe theme verses
INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Fe', 'Confía en las promesas de Dios, aunque no las veas aún.'
FROM public.bible_verses bv 
WHERE bv.book = 'Hebreos' AND bv.chapter = 11 AND bv.verse = 1;

INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Fe', 'Ora con fe, sabiendo que Dios escucha.'
FROM public.bible_verses bv 
WHERE bv.book = 'Marcos' AND bv.chapter = 11 AND bv.verse = 24;

INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Fe', 'La fe mueve montañas en la oración.'
FROM public.bible_verses bv 
WHERE bv.book = 'Mateo' AND bv.chapter = 21 AND bv.verse = 22;

INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Fe', 'Alimenta tu fe con la Palabra diariamente.'
FROM public.bible_verses bv 
WHERE bv.book = 'Romanos' AND bv.chapter = 10 AND bv.verse = 17;

INSERT INTO public.verse_themes (verse_id, theme_name, reflection)
SELECT bv.id, 'Fe', 'Mantén una fe firme en medio de las tormentas.'
FROM public.bible_verses bv 
WHERE bv.book = 'Santiago' AND bv.chapter = 1 AND bv.verse = 6;