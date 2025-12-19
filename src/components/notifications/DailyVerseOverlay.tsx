import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, BookOpen, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DailyVerseOverlayProps {
  verseText?: string;
  verseReference?: string;
  onClose: () => void;
}

export const DailyVerseOverlay = ({ verseText: propVerseText, verseReference: propVerseReference, onClose }: DailyVerseOverlayProps) => {
  const downloadRef = useRef<HTMLDivElement>(null);
  const [verseText, setVerseText] = useState(propVerseText || '');
  const [verseReference, setVerseReference] = useState(propVerseReference || '');
  const [loading, setLoading] = useState(!propVerseText);

  // Auto-cargar versículo si no se proporcionaron props
  useEffect(() => {
    const loadVerse = async () => {
      if (propVerseText && propVerseReference) {
        setVerseText(propVerseText);
        setVerseReference(propVerseReference);
        setLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Intentar cargar versículo del día
        const { data: dailyVerse } = await supabase
          .from('daily_verses')
          .select(`*, bible_verses (*)`)
          .eq('date', today)
          .single();

        if (dailyVerse?.bible_verses) {
          const verse = dailyVerse.bible_verses as any;
          setVerseText(verse.text);
          setVerseReference(`${verse.book} ${verse.chapter}:${verse.verse}`);
        } else {
          // Fallback: cargar versículo aleatorio
          const { data: randomVerses } = await supabase
            .from('bible_verses')
            .select('*')
            .limit(50);

          if (randomVerses && randomVerses.length > 0) {
            const verse = randomVerses[Math.floor(Math.random() * randomVerses.length)];
            setVerseText(verse.text);
            setVerseReference(`${verse.book} ${verse.chapter}:${verse.verse}`);
          } else {
            // Fallback final
            setVerseText('Confía en el Señor de todo corazón, y no en tu propia inteligencia. Reconócelo en todos tus caminos, y él allanará tus sendas.');
            setVerseReference('Proverbios 3:5-6');
          }
        }
      } catch (error) {
        console.error('Error loading verse:', error);
        // Fallback
        setVerseText('Confía en el Señor de todo corazón, y no en tu propia inteligencia.');
        setVerseReference('Proverbios 3:5');
      } finally {
        setLoading(false);
      }
    };

    loadVerse();
  }, [propVerseText, propVerseReference]);

  const handleDownload = async () => {
    if (!downloadRef.current) return;
    
    try {
      const canvas = await html2canvas(downloadRef.current, {
        backgroundColor: '#f0f9ff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `versiculo-del-dia-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Imagen descargada');
    } catch (error) {
      console.error('Error al descargar:', error);
      toast.error('Error al descargar imagen');
    }
  };

  const handleShare = async () => {
    const shareText = `📖 Versículo del Día\n\n"${verseText}"\n\n— ${verseReference}\n\n— ARCANA`;
    
    await navigator.clipboard.writeText(shareText);
    toast.success('Copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="text-white text-lg">Cargando versículo...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-blue-200 shadow-2xl relative overflow-hidden">
        {/* Close button - outside downloadable area */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full hover:bg-gray-200 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Downloadable content */}
        <div ref={downloadRef} className="bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30 -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-30 translate-y-32 -translate-x-32" />
          
          <div className="relative p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Versículo del Día
            </h2>

            {/* Verse text */}
            <div className="bg-white/80 rounded-lg p-6 mb-4 shadow-inner border border-blue-100">
              <p className="text-xl text-gray-800 leading-relaxed text-center font-serif italic">
                "{verseText}"
              </p>
            </div>

            {/* Reference */}
            <p className="text-center text-lg font-semibold text-blue-700 mb-4">
              - {verseReference}
            </p>

            {/* Ministry signature for download */}
            <p className="text-center text-sm text-gray-500">
              ARCANA
            </p>
          </div>
        </div>

        {/* Action buttons - outside downloadable area */}
        <div className="relative p-4 pt-0 flex flex-col sm:flex-row justify-center gap-3">
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="border-blue-300 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-1" />
              Descargar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="border-blue-300 hover:bg-blue-50"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Compartir
            </Button>
          </div>
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            Amén
          </Button>
        </div>
      </Card>
    </div>
  );
};
