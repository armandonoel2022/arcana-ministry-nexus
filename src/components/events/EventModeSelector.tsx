import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Settings, Calendar, Clock } from 'lucide-react';

interface EventModeSelectorProps {
  onSelectMode: (mode: 'live' | 'programming') => void;
}

const EventModeSelector: React.FC<EventModeSelectorProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">Eventos Especiales</h1>
        <p className="text-muted-foreground text-sm sm:text-lg">Selecciona el modo de trabajo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 max-w-4xl w-full">
        {/* Modo En Vivo */}
        <Card 
          className="cursor-pointer hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 border-2 hover:border-green-500 hover:shadow-xl group active:scale-[0.98]"
          onClick={() => onSelectMode('live')}
        >
          <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[280px]">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-green-500/30 transition-colors">
              <Play className="w-8 h-8 sm:w-12 sm:h-12 text-green-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-center">Modo En Vivo</h2>
            <p className="text-muted-foreground text-center text-sm sm:text-base max-w-xs">
              Ejecuta un evento en tiempo real con temporizadores y estadísticas
            </p>
            <div className="flex items-center gap-3 sm:gap-4 mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                Timer
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                Seguimiento
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Modo Programación */}
        <Card 
          className="cursor-pointer hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 border-2 hover:border-primary hover:shadow-xl group active:scale-[0.98]"
          onClick={() => onSelectMode('programming')}
        >
          <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[280px]">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/30 transition-colors">
              <Settings className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-center">Modo Programación</h2>
            <p className="text-muted-foreground text-center text-sm sm:text-base max-w-xs">
              Crea y edita programas, sets de adoración y asigna responsables
            </p>
            <div className="flex items-center gap-3 sm:gap-4 mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                Configurar
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                Planificar
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventModeSelector;
