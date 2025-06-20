
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Share2, BookOpen, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DailyVerseData {
  id: string;
  date: string;
  reflection: string | null;
  bible_verses: {
    book: string;
    chapter: number;
    verse: number;
    text: string;
    version: string;
  };
}

export const DailyVerse = () => {
  const [dailyVerse, setDailyVerse] = useState<DailyVerseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayVerse();
  }, []);

  const fetchTodayVerse = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_verses')
        .select(`
          *,
          bible_verses (
            book,
            chapter,
            verse,
            text,
            version
          )
        `)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setDailyVerse(data);
      } else {
        // Si no hay verso para hoy, obtener un verso aleatorio
        await createRandomDailyVerse();
      }
    } catch (error) {
      console.error('Error fetching daily verse:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el verso del día",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createRandomDailyVerse = async () => {
    try {
      // Obtener un verso aleatorio
      const { data: verses, error: versesError } = await supabase
        .from('bible_verses')
        .select('*');

      if (versesError) throw versesError;

      if (verses && verses.length > 0) {
        const randomVerse = verses[Math.floor(Math.random() * verses.length)];
        const today = new Date().toISOString().split('T')[0];

        // Crear el verso diario
        const { data: dailyVerseData, error: dailyVerseError } = await supabase
          .from('daily_verses')
          .insert({
            verse_id: randomVerse.id,
            date: today,
            reflection: "Que este verso te inspire y fortalezca tu fe hoy."
          })
          .select(`
            *,
            bible_verses (
              book,
              chapter,
              verse,
              text,
              version
            )
          `)
          .single();

        if (dailyVerseError) throw dailyVerseError;

        setDailyVerse(dailyVerseData);
      }
    } catch (error) {
      console.error('Error creating random daily verse:', error);
    }
  };

  const handleShare = () => {
    if (dailyVerse) {
      const verseText = `${dailyVerse.bible_verses.text}\n\n- ${dailyVerse.bible_verses.book} ${dailyVerse.bible_verses.chapter}:${dailyVerse.bible_verses.verse} (${dailyVerse.bible_verses.version})`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Verso del Día - ARCANA',
          text: verseText,
        });
      } else {
        navigator.clipboard.writeText(verseText);
        toast({
          title: "¡Copiado!",
          description: "El verso ha sido copiado al portapapeles"
        });
      }
    }
  };

  const toggleLike = () => {
    setLiked(!liked);
    toast({
      title: liked ? "Quitado de favoritos" : "Agregado a favoritos",
      description: liked ? "Has quitado este verso de tus favoritos" : "Has agregado este verso a tus favoritos"
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4 animate-pulse" />
            <p className="text-gray-500">Cargando verso del día...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dailyVerse) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No hay verso disponible para hoy</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-arcana-blue-600" />
          <span className="text-sm text-gray-600">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </span>
        </div>
        <CardTitle className="text-2xl text-arcana-blue-700">Verso del Día</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-arcana-blue-50 to-arcana-gold-50 p-6 rounded-lg border-l-4 border-arcana-blue-500">
          <blockquote className="text-lg leading-relaxed text-gray-800 italic mb-4">
            "{dailyVerse.bible_verses.text}"
          </blockquote>
          
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-arcana-blue-100 text-arcana-blue-800">
              {dailyVerse.bible_verses.book} {dailyVerse.bible_verses.chapter}:{dailyVerse.bible_verses.verse}
            </Badge>
            <span className="text-sm text-gray-600">
              {dailyVerse.bible_verses.version}
            </span>
          </div>
        </div>

        {dailyVerse.reflection && (
          <div className="bg-arcana-gold-50 p-4 rounded-lg border border-arcana-gold-200">
            <h4 className="font-semibold text-arcana-gold-700 mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Reflexión
            </h4>
            <p className="text-gray-700 leading-relaxed">
              {dailyVerse.reflection}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLike}
            className={`flex items-center gap-2 ${
              liked ? 'text-red-600 border-red-600' : ''
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            {liked ? 'Favorito' : 'Me gusta'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
