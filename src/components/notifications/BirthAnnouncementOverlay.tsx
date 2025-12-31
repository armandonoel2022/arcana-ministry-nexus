import React, { useEffect, useState, useRef } from 'react';
import { X, Baby, Heart, Star, Calendar, Weight, Ruler, MessageCircle, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface BirthAnnouncementOverlayProps {
  babyName?: string;
  parentNames: string;
  babyPhotoUrl?: string;
  birthDate?: string;
  birthTime?: string;
  weight?: string;
  height?: string;
  message?: string;
  onClose: () => void;
}

const BirthAnnouncementOverlay = ({ 
  babyName,
  parentNames,
  babyPhotoUrl,
  birthDate,
  birthTime,
  weight,
  height,
  message,
  onClose 
}: BirthAnnouncementOverlayProps) => {
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
        backgroundColor: '#fffbeb',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const link = document.createElement('a');
      const fileName = babyName 
        ? `nacimiento-${babyName.replace(/\s+/g, '-').toLowerCase()}.png`
        : `nacimiento-${parentNames.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.download = fileName;
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
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 border-2 border-amber-200 shadow-2xl">
        {/* Botones de acción fuera del área de descarga */}
        {!isDownloading && (
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={handleDownload}
              className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors"
              aria-label="Descargar"
            >
              <Download className="w-5 h-5 text-amber-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-amber-600" />
            </button>
          </div>
        )}

        <div ref={contentRef} className="relative p-5">
          {/* Header celebratorio */}
          <div className="text-center mb-4">
            <div className="flex justify-center items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-amber-400 animate-pulse" />
              <Baby className="w-12 h-12 text-rose-400" />
              <Star className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">
              🎉 ¡Bienvenido al Mundo! 🎉
            </p>
            <h2 className="text-xl font-bold text-gray-800 leading-tight">
              {babyName ? `¡Ha nacido ${babyName}!` : '¡Ha llegado una nueva bendición!'}
            </h2>
          </div>

          {/* Foto del bebé */}
          {babyPhotoUrl && (
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-200 via-rose-200 to-violet-200 rounded-full blur-md" />
                <img
                  src={babyPhotoUrl}
                  alt={babyName ? `Foto de ${babyName}` : 'Foto del bebé'}
                  className="relative w-48 h-48 rounded-full shadow-xl object-cover border-4 border-white"
                />
              </div>
            </div>
          )}

          {/* Información de los padres */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-amber-100 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
              <span className="text-sm font-semibold text-gray-800">
                Padres Orgullosos
              </span>
              <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
            </div>
            <p className="text-lg text-gray-700 font-medium">{parentNames}</p>
          </div>

          {/* Detalles del nacimiento */}
          {(birthDate || birthTime || weight || height) && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {birthDate && (
                <div className="bg-white/70 rounded-lg p-3 text-center border border-rose-100">
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                  <p className="text-xs text-gray-500 uppercase">Fecha</p>
                  <p className="text-sm font-semibold text-gray-800">{birthDate}</p>
                </div>
              )}
              {birthTime && (
                <div className="bg-white/70 rounded-lg p-3 text-center border border-violet-100">
                  <Star className="w-4 h-4 mx-auto mb-1 text-violet-400" />
                  <p className="text-xs text-gray-500 uppercase">Hora</p>
                  <p className="text-sm font-semibold text-gray-800">{birthTime}</p>
                </div>
              )}
              {weight && (
                <div className="bg-white/70 rounded-lg p-3 text-center border border-amber-100">
                  <Weight className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <p className="text-xs text-gray-500 uppercase">Peso</p>
                  <p className="text-sm font-semibold text-gray-800">{weight}</p>
                </div>
              )}
              {height && (
                <div className="bg-white/70 rounded-lg p-3 text-center border border-sky-100">
                  <Ruler className="w-4 h-4 mx-auto mb-1 text-sky-400" />
                  <p className="text-xs text-gray-500 uppercase">Talla</p>
                  <p className="text-sm font-semibold text-gray-800">{height}</p>
                </div>
              )}
            </div>
          )}

          {/* Mensaje personalizado */}
          {message && (
            <div className="bg-white/80 rounded-xl p-4 mb-4 border border-violet-100">
              <p className="text-center text-gray-700 italic text-sm leading-relaxed">
                "{message}"
              </p>
            </div>
          )}

          {/* Footer inspirador */}
          <div className="text-center p-3 bg-gradient-to-r from-amber-100 via-rose-100 to-violet-100 rounded-lg">
            <p className="text-xs text-gray-700 italic">
              "Antes que te formase en el vientre te conocí, y antes que nacieses te santifiqué."
            </p>
            <p className="text-xs text-gray-500 mt-1">— Jeremías 1:5</p>
          </div>

          {/* Decoraciones */}
          <div className="absolute top-8 left-4 w-2 h-2 bg-amber-300 rounded-full animate-bounce opacity-60" />
          <div className="absolute top-16 right-6 w-2 h-2 bg-rose-300 rounded-full animate-bounce delay-150 opacity-60" />
          <div className="absolute bottom-16 left-6 w-2 h-2 bg-violet-300 rounded-full animate-bounce delay-300 opacity-60" />
        </div>

        {/* Botones de acción fuera del área de descarga */}
        {!isDownloading && (
          <div className="flex flex-col gap-2 px-5 pb-5">
            <Button
              onClick={handleGoToCongratulate}
              className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold px-6 py-2.5 text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
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

export default BirthAnnouncementOverlay;
