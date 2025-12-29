import React from 'react';
import { X, Baby, Heart, Star, Calendar, Weight, Ruler, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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

  const handleGoToCongratulate = () => {
    onClose();
    navigate('/communication');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 border-2 border-amber-200 shadow-2xl">
        <div className="relative p-6 md:p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-amber-600" />
          </button>

          {/* Header celebratorio */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-amber-400 animate-pulse" />
              <Baby className="w-14 h-14 text-rose-400" />
              <Star className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-2">
              🎉 ¡Bienvenido al Mundo! 🎉
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
              {babyName ? `¡Ha nacido ${babyName}!` : '¡Ha llegado una nueva bendición!'}
            </h2>
          </div>

          {/* Foto del bebé */}
          {babyPhotoUrl && (
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-r from-amber-200 via-rose-200 to-violet-200 rounded-full blur-md" />
                <img
                  src={babyPhotoUrl}
                  alt={babyName ? `Foto de ${babyName}` : 'Foto del bebé'}
                  className="relative w-64 h-64 md:w-72 md:h-72 rounded-full shadow-xl object-cover border-4 border-white"
                />
              </div>
            </div>
          )}

          {/* Información de los padres */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 mb-5 border border-amber-100 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-rose-500" fill="currentColor" />
              <span className="text-lg md:text-xl font-semibold text-gray-800">
                Padres Orgullosos
              </span>
              <Heart className="w-5 h-5 text-rose-500" fill="currentColor" />
            </div>
            <p className="text-xl text-gray-700 font-medium">{parentNames}</p>
          </div>

          {/* Detalles del nacimiento */}
          {(birthDate || birthTime || weight || height) && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              {birthDate && (
                <div className="bg-white/70 rounded-lg p-4 text-center border border-rose-100">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-rose-400" />
                  <p className="text-xs text-gray-500 uppercase">Fecha</p>
                  <p className="text-sm font-semibold text-gray-800">{birthDate}</p>
                </div>
              )}
              {birthTime && (
                <div className="bg-white/70 rounded-lg p-4 text-center border border-violet-100">
                  <Star className="w-5 h-5 mx-auto mb-2 text-violet-400" />
                  <p className="text-xs text-gray-500 uppercase">Hora</p>
                  <p className="text-sm font-semibold text-gray-800">{birthTime}</p>
                </div>
              )}
              {weight && (
                <div className="bg-white/70 rounded-lg p-4 text-center border border-amber-100">
                  <Weight className="w-5 h-5 mx-auto mb-2 text-amber-400" />
                  <p className="text-xs text-gray-500 uppercase">Peso</p>
                  <p className="text-sm font-semibold text-gray-800">{weight}</p>
                </div>
              )}
              {height && (
                <div className="bg-white/70 rounded-lg p-4 text-center border border-sky-100">
                  <Ruler className="w-5 h-5 mx-auto mb-2 text-sky-400" />
                  <p className="text-xs text-gray-500 uppercase">Talla</p>
                  <p className="text-sm font-semibold text-gray-800">{height}</p>
                </div>
              )}
            </div>
          )}

          {/* Mensaje personalizado */}
          {message && (
            <div className="bg-white/80 rounded-xl p-5 mb-5 border border-violet-100">
              <p className="text-center text-gray-700 italic text-base leading-relaxed">
                "{message}"
              </p>
            </div>
          )}

          {/* Footer inspirador */}
          <div className="text-center p-4 bg-gradient-to-r from-amber-100 via-rose-100 to-violet-100 rounded-lg mb-5">
            <p className="text-sm text-gray-700 italic">
              "Antes que te formase en el vientre te conocí, y antes que nacieses te santifiqué."
            </p>
            <p className="text-xs text-gray-500 mt-1">— Jeremías 1:5</p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoToCongratulate}
              className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold px-8 py-3 text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
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

          {/* Decoraciones */}
          <div className="absolute top-10 left-6 w-3 h-3 bg-amber-300 rounded-full animate-bounce opacity-60" />
          <div className="absolute top-20 right-8 w-2 h-2 bg-rose-300 rounded-full animate-bounce delay-150 opacity-60" />
          <div className="absolute bottom-24 left-10 w-2 h-2 bg-violet-300 rounded-full animate-bounce delay-300 opacity-60" />
        </div>
      </Card>
    </div>
  );
};

export default BirthAnnouncementOverlay;
