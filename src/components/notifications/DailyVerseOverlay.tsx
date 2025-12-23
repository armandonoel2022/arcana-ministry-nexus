import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, BookOpen, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { createBroadcastNotification } from '@/services/notificationService';

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
  const [notificationSaved, setNotificationSaved] = useState(false);

  // Guardar notificación cuando tenemos los datos del versículo
  useEffect(() => {
    const saveNotification = async () => {
      if (verseText && verseReference && !notificationSaved) {
        try {
          console.log("📖 [DailyVerseOverlay] Guardando versículo en centro de notificaciones...");
          
          await createBroadcastNotification({
            type: 'daily_verse',
            title: 'Versículo del Día',
            message: `"${verseText}" — ${verseReference}`,
            metadata: {
              verse_text: verseText,
              verse_reference: verseReference,
              saved_from_overlay: true,
            },
            showOverlay: false,
          });
          
          setNotificationSaved(true);
          console.log("📖 [DailyVerseOverlay] ✅ Versículo guardado en notificaciones");
        } catch (error) {
          console.error("📖 [DailyVerseOverlay] Error guardando notificación:", error);
        }
      }
    };

    saveNotification();
  }, [verseText, verseReference, notificationSaved]);

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
        const dominicanNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santo_Domingo' }));
        const today = dominicanNow.toISOString().split('T')[0];

        // Intentar cargar versículo del día (por fecha RD)
        const { data: dailyVerse } = await supabase
          .from('daily_verses')
          .select(`*, bible_verses (*)`)
          .eq('date', today)
          .maybeSingle();

        if (dailyVerse?.bible_verses) {
          const verse = dailyVerse.bible_verses as any;
          setVerseText(verse.text);
          setVerseReference(`${verse.book} ${verse.chapter}:${verse.verse}`);
        } else {
          // Fallback: selección determinística por día
          const { data: verses } = await supabase.from('bible_verses').select('*');

          if (verses && verses.length > 0) {
            const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
            const idx = dayOfYear % verses.length;
            const verse = verses[idx];
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
        <div ref={downloadRef} className="relative overflow-hidden" style={{ backgroundColor: '#f0f9ff' }}>
          {/* Background decoration - using solid colors for html2canvas compatibility */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 -translate-y-32 translate-x-32" style={{ backgroundColor: '#dbeafe' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-20 translate-y-32 -translate-x-32" style={{ backgroundColor: '#e9d5ff' }} />
          
          <div className="relative p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#6366f1' }}>
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title - using solid color instead of gradient for html2canvas */}
            <h2 className="text-3xl font-bold text-center mb-6" style={{ color: '#4f46e5' }}>
              Versículo del Día
            </h2>

            {/* Verse text */}
            <div className="rounded-lg p-6 mb-4 shadow-inner" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #dbeafe' }}>
              <p className="text-xl leading-relaxed text-center font-serif italic" style={{ color: '#1f2937' }}>
                "{verseText}"
              </p>
            </div>

            {/* Reference */}
            <p className="text-center text-lg font-semibold mb-4" style={{ color: '#3b82f6' }}>
              - {verseReference}
            </p>

            {/* Ministry signature for download */}
            <p className="text-center text-sm" style={{ color: '#6b7280' }}>
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
