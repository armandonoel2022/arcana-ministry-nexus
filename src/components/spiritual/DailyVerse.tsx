import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Share2, BookOpen, Calendar, Bell, X } from "lucide-react";
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayVerse();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

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
        // Si no hay versículo para hoy, obtener un versículo aleatorio
        await createRandomDailyVerse();
      }
    } catch (error) {
      console.error('Error fetching daily verse:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el versículo del día",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createRandomDailyVerse = async () => {
    try {
      // Obtener un versículo aleatorio
      const { data: verses, error: versesError } = await supabase
        .from('bible_verses')
        .select('*');

      if (versesError) throw versesError;

      if (verses && verses.length > 0) {
        const randomVerse = verses[Math.floor(Math.random() * verses.length)];
        const today = new Date().toISOString().split('T')[0];

        // Crear el versículo diario
        const { data: dailyVerseData, error: dailyVerseError } = await supabase
          .from('daily_verses')
          .insert({
            verse_id: randomVerse.id,
            date: today,
            reflection: "Que este versículo te inspire y fortalezca tu fe hoy."
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

  const testNotification = async () => {
    setSendingNotification(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-verse-notification', {
        body: { test: true }
      });

      if (error) throw error;

      // Mostrar el diálogo de notificación en lugar del toast
      setShowNotificationDialog(true);
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación de prueba",
        variant: "destructive"
      });
    } finally {
      setSendingNotification(false);
    }
  };

  const handleNotificationAmen = () => {
    setShowNotificationDialog(false);
    toast({
      title: "¡Amén! 🙏",
      description: "Que Dios te bendiga con su palabra"
    });
  };

  const handleNotificationClose = () => {
    setShowNotificationDialog(false);
  };

  const handleShare = () => {
    if (dailyVerse) {
      const verseText = `${dailyVerse.bible_verses.text}\n\n${dailyVerse.bible_verses.book} ${dailyVerse.bible_verses.chapter}:${dailyVerse.bible_verses.verse} (${dailyVerse.bible_verses.version})`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Versículo del Día - ARCANA',
          text: verseText,
        });
      } else {
        navigator.clipboard.writeText(verseText);
        toast({
          title: "¡Copiado!",
          description: "El versículo ha sido copiado al portapapeles"
        });
      }
    }
  };

  const toggleLike = () => {
    setLiked(!liked);
    toast({
      title: liked ? "Quitado de favoritos" : "Agregado a favoritos",
      description: liked ? "Has quitado este versículo de tus favoritos" : "Has agregado este versículo a tus favoritos"
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4 animate-pulse" />
            <p className="text-gray-500">Cargando versículo del día...</p>
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
            <p className="text-gray-500">No hay versículo disponible para hoy</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-arcana-blue-600" />
              <span className="text-sm text-gray-600">
                {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
            {userRole === 'administrator' && (
              <Button
                variant="outline"
                size="sm"
                onClick={testNotification}
                disabled={sendingNotification}
                className="flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                {sendingNotification ? 'Enviando...' : 'Probar Notificación'}
              </Button>
            )}
          </div>
          <CardTitle className="text-2xl text-arcana-blue-700">Versículo del Día</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-arcana-blue-50 to-arcana-gold-50 p-6 rounded-lg border-l-4 border-arcana-blue-500">
            <div className="text-center space-y-4">
              <div className="text-lg leading-relaxed text-gray-800 font-serif">
                <sup className="text-sm font-bold text-arcana-blue-600 mr-1">
                  {dailyVerse.bible_verses.verse}
                </sup>
                {dailyVerse.bible_verses.text}
              </div>
              
              <div className="text-right">
                <span className="text-base font-semibold text-arcana-blue-700">
                  {dailyVerse.bible_verses.book} {dailyVerse.bible_verses.chapter}:{dailyVerse.bible_verses.verse}
                </span>
                <br />
                <span className="text-sm text-gray-600 italic">
                  {dailyVerse.bible_verses.version}
                </span>
              </div>
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

      {/* Diálogo de Notificación */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <DialogHeader className="text-center space-y-4">            
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-blue-800">
                Versículo del Día - ARCANA
              </DialogTitle>
              <p className="text-sm text-blue-600 font-medium">
                Ministerio ADN
              </p>
              <p className="text-xs text-blue-500">
                Arca de Noé
              </p>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Contenido del Versículo */}
            {dailyVerse && (
              <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                <div className="text-center space-y-3">
                  <div className="text-base leading-relaxed text-gray-800 font-serif">
                    <sup className="text-sm font-bold text-blue-600 mr-1">
                      {dailyVerse.bible_verses.verse}
                    </sup>
                    {dailyVerse.bible_verses.text}
                  </div>
                  
                  <div className="text-right">
                    <span className="text-sm font-semibold text-blue-700">
                      {dailyVerse.bible_verses.book} {dailyVerse.bible_verses.chapter}:{dailyVerse.bible_verses.verse}
                    </span>
                    <br />
                    <span className="text-xs text-gray-600 italic">
                      {dailyVerse.bible_verses.version}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center text-sm text-blue-700 font-medium">
              ¡Que este versículo bendiga tu día! 🙏
            </div>
            
            {/* Botones de Acción */}
            <div className="flex gap-3 justify-center pt-2">
              <Button 
                onClick={handleNotificationAmen}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <Heart className="w-4 h-4 mr-2" />
                Amén
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleNotificationClose}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 px-6 py-2 rounded-full shadow-md transition-all duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
