import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Heart, Sparkles, Star } from 'lucide-react';
import arcanaLogo from '@/assets/arca-noe-logo.png';

interface WomensDayOverlayProps {
  onClose: () => void;
}

const WomensDayOverlay: React.FC<WomensDayOverlayProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-gradient-to-b from-pink-400 via-pink-500 to-rose-600 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Animated decorations */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 animate-pulse" />
        <div className="absolute bottom-20 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2" />
        
        {/* Floating hearts */}
        <div className="absolute top-20 left-10 animate-bounce" style={{ animationDelay: '0s' }}>
          <Heart className="w-6 h-6 text-white/40 fill-white/40" />
        </div>
        <div className="absolute top-32 right-12 animate-bounce" style={{ animationDelay: '0.5s' }}>
          <Heart className="w-4 h-4 text-white/30 fill-white/30" />
        </div>
        <div className="absolute bottom-40 left-8 animate-bounce" style={{ animationDelay: '1s' }}>
          <Star className="w-5 h-5 text-white/40 fill-white/40" />
        </div>
        <div className="absolute top-48 right-8 animate-bounce" style={{ animationDelay: '1.5s' }}>
          <Sparkles className="w-5 h-5 text-white/40" />
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full text-white/80 hover:text-white hover:bg-white/20 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Content */}
        <div className="relative p-6 pt-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
              <img src={arcanaLogo} alt="Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>

          {/* Date badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full">
              <Heart className="w-4 h-4 text-white fill-white" />
              <span className="text-white font-medium">8 de Marzo</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-2 leading-tight">
            Día Internacional
            <br />de la Mujer
          </h1>

          {/* Message */}
          <div className="bg-white/90 rounded-2xl p-5 mt-6 shadow-lg">
            <p className="text-gray-800 text-center leading-relaxed mb-4">
              Hoy celebramos a todas las mujeres valientes, fuertes y llenas de fe que forman parte de nuestro ministerio.
            </p>
            
            <p className="text-gray-700 text-center text-sm leading-relaxed mb-4">
              Su dedicación, amor y servicio son fundamentales en la obra del Señor. 
              Gracias por inspirarnos cada día con su testimonio y entrega.
            </p>

            <div className="text-center">
              <p className="text-pink-600 font-semibold italic">
                "Encomienda a Jehová tu camino, y confía en él; y él hará."
              </p>
              <p className="text-pink-500 text-sm mt-1">- Salmos 37:5</p>
            </div>
          </div>

          {/* Special message */}
          <div className="mt-4 bg-white/20 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-white">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">¡Feliz Día!</span>
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-white/80 text-sm mt-1">
              Que Dios bendiga a cada una de ustedes
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="p-6 pt-4">
          <Button
            onClick={onClose}
            className="w-full bg-white hover:bg-white/90 text-pink-600 py-6 text-lg font-semibold rounded-xl shadow-lg"
          >
            <Heart className="w-5 h-5 mr-2 fill-pink-600" />
            Gracias
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WomensDayOverlay;
