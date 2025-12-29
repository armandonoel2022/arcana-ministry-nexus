import React, { useEffect, useState } from 'react';
import { X, Heart, Baby, Sparkles, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 border-2 border-rose-200 shadow-2xl">
        <div className="relative p-6 md:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-rose-100 hover:bg-rose-200 transition-colors z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-rose-600" />
          </button>

          {/* Header con decoración */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              <Baby className="w-12 h-12 text-rose-400" />
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-rose-500 uppercase tracking-wider mb-2">
              ✨ Revelación de Embarazo ✨
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
              ¡Llegó un nuevo milagro al Ministerio ADN!
            </h2>
          </div>

          {/* Imagen de la sonografía */}
          {sonogramImageUrl && (
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-rose-200 via-amber-200 to-sky-200 rounded-2xl blur-sm" />
                <img
                  src={sonogramImageUrl}
                  alt="Sonografía del bebé"
                  className="relative w-full max-w-md h-auto rounded-xl shadow-lg object-cover border-4 border-white"
                />
              </div>
            </div>
          )}

          {/* Información de los padres */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-rose-100">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
              <span className="text-xl md:text-2xl font-semibold text-gray-800">
                {parentNames}
              </span>
              <Heart className="w-6 h-6 text-rose-500" fill="currentColor" />
            </div>
            
            <p className="text-center text-gray-600 text-lg">
              {message || "Estamos esperando una bendición de Dios que llegará a nuestras vidas para llenarnos de alegría."}
            </p>

            {dueDate && (
              <div className="mt-4 text-center">
                <p className="text-sm text-rose-500 font-medium">Fecha estimada de llegada</p>
                <p className="text-lg font-semibold text-gray-800">{dueDate}</p>
              </div>
            )}
          </div>

          {/* Footer con mensaje inspirador */}
          <div className="text-center p-4 bg-gradient-to-r from-rose-100 via-amber-100 to-sky-100 rounded-lg mb-5">
            <p className="text-sm text-gray-700 italic">
              "He aquí, herencia de Jehová son los hijos; cosa de estima el fruto del vientre."
            </p>
            <p className="text-xs text-gray-500 mt-1">— Salmos 127:3</p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoToCongratulate}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold px-8 py-3 text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Ir a Felicitar
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-8 py-3 text-base font-semibold transition-all duration-200"
            >
              Cerrar
            </Button>
          </div>

          {/* Decoraciones flotantes */}
          <div className="absolute top-8 left-8 w-3 h-3 bg-rose-300 rounded-full animate-bounce opacity-60" />
          <div className="absolute top-16 right-12 w-2 h-2 bg-amber-300 rounded-full animate-bounce delay-100 opacity-60" />
          <div className="absolute bottom-20 left-12 w-2 h-2 bg-sky-300 rounded-full animate-bounce delay-200 opacity-60" />
        </div>
      </Card>
    </div>
  );
};

export default PregnancyRevealOverlay;
