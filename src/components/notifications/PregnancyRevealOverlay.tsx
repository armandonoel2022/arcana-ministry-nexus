import React, { useEffect, useState, useRef } from 'react';
import { X, Heart, Baby, Sparkles, MessageCircle, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface PregnancyRevealOverlayProps {
  parentNames: string;
  sonogramImageUrl?: string;
  message?: string;
  dueDate?: string;
  onClose: () => void;
}

const PregnancyRevealOverlay = ({ 
  parentNames,
  sonogramImageUrl,
  message,
  dueDate,
  onClose 
}: PregnancyRevealOverlayProps) => {
  const navigate = useNavigate();
  const [generalRoomId, setGeneralRoomId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get the general chat room ID
  useEffect(() => {
    const fetchGeneralRoom = async () => {
      const { data } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('room_type', 'general')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setGeneralRoomId(data.id);
      }
    };
    fetchGeneralRoom();
  }, []);

  const handleGoToCongratulate = () => {
    onClose();
    if (generalRoomId) {
      navigate(`/communication?room=${generalRoomId}`);
    } else {
      navigate('/communication');
    }
  };

  const handleDownload = async () => {
    if (!contentRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#fdf2f8',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const link = document.createElement('a');
      link.download = `revelacion-embarazo-${parentNames.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Imagen descargada exitosamente');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Error al descargar la imagen');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 border-2 border-rose-200 shadow-2xl">
        {/* Botones de acción fuera del área de descarga */}
        {!isDownloading && (
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={handleDownload}
              className="p-2 rounded-full bg-rose-100 hover:bg-rose-200 transition-colors"
              aria-label="Descargar"
            >
              <Download className="w-5 h-5 text-rose-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-rose-100 hover:bg-rose-200 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-rose-600" />
            </button>
          </div>
        )}

        <div ref={contentRef} className="relative p-5">
          {/* Header con decoración */}
          <div className="text-center mb-4">
            <div className="flex justify-center items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <Baby className="w-10 h-10 text-rose-400" />
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <p className="text-xs font-medium text-rose-500 uppercase tracking-wider mb-1">
              ✨ Revelación de Embarazo ✨
            </p>
            <h2 className="text-xl font-bold text-gray-800 leading-tight">
              ¡Llegó un nuevo milagro al Ministerio ADN!
            </h2>
          </div>

          {/* Imagen de la sonografía */}
          {sonogramImageUrl && (
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-rose-200 via-amber-200 to-sky-200 rounded-xl blur-sm" />
                <img
                  src={sonogramImageUrl}
                  alt="Sonografía del bebé"
                  className="relative w-full max-w-xs h-auto rounded-lg shadow-lg object-cover border-4 border-white"
                />
              </div>
            </div>
          )}

          {/* Información de los padres */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-rose-100">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-rose-500" fill="currentColor" />
              <span className="text-lg font-semibold text-gray-800">
                {parentNames}
              </span>
              <Heart className="w-5 h-5 text-rose-500" fill="currentColor" />
            </div>
            
            <p className="text-center text-gray-600 text-sm">
              {message || "Estamos esperando una bendición de Dios que llegará a nuestras vidas para llenarnos de alegría."}
            </p>

            {dueDate && (
              <div className="mt-3 text-center">
                <p className="text-xs text-rose-500 font-medium">Fecha estimada de llegada</p>
                <p className="text-base font-semibold text-gray-800">{dueDate}</p>
              </div>
            )}
          </div>

          {/* Footer con mensaje inspirador */}
          <div className="text-center p-3 bg-gradient-to-r from-rose-100 via-amber-100 to-sky-100 rounded-lg">
            <p className="text-xs text-gray-700 italic">
              "He aquí, herencia de Jehová son los hijos; cosa de estima el fruto del vientre."
            </p>
            <p className="text-xs text-gray-500 mt-1">— Salmos 127:3</p>
          </div>

          {/* Decoraciones flotantes */}
          <div className="absolute top-6 left-6 w-2 h-2 bg-rose-300 rounded-full animate-bounce opacity-60" />
          <div className="absolute top-12 right-8 w-2 h-2 bg-amber-300 rounded-full animate-bounce delay-100 opacity-60" />
          <div className="absolute bottom-16 left-8 w-2 h-2 bg-sky-300 rounded-full animate-bounce delay-200 opacity-60" />
        </div>

        {/* Botones de acción fuera del área de descarga */}
        {!isDownloading && (
          <div className="flex flex-col gap-2 px-5 pb-5">
            <Button
              onClick={handleGoToCongratulate}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold px-6 py-2.5 text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Ir a Felicitar
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-6 py-2.5 text-sm font-semibold transition-all duration-200"
            >
              Cerrar
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PregnancyRevealOverlay;
