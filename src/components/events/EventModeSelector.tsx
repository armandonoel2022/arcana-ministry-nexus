import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Settings, Calendar, Clock } from 'lucide-react';

interface EventModeSelectorProps {
  onSelectMode: (mode: 'live' | 'programming') => void;
}

const EventModeSelector: React.FC<EventModeSelectorProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Eventos Especiales</h1>
        <p className="text-muted-foreground text-lg">Selecciona el modo de trabajo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Modo En Vivo */}
        <Card 
          className="cursor-pointer hover:scale-105 transition-all duration-300 border-2 hover:border-green-500 hover:shadow-xl group"
          onClick={() => onSelectMode('live')}
        >
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[280px]">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 group-hover:bg-green-500/30 transition-colors">
              <Play className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-center">Modo En Vivo</h2>
            <p className="text-muted-foreground text-center max-w-xs">
              Ejecuta un evento en tiempo real con temporizadores, seguimiento de secciones y estadísticas de tiempo
            </p>
            <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Temporizador
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Seguimiento
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Modo Programación */}
        <Card 
          className="cursor-pointer hover:scale-105 transition-all duration-300 border-2 hover:border-primary hover:shadow-xl group"
          onClick={() => onSelectMode('programming')}
        >
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[280px]">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
              <Settings className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-center">Modo Programación</h2>
            <p className="text-muted-foreground text-center max-w-xs">
              Crea, edita y organiza programas de eventos, sets de adoración y asigna responsables
            </p>
            <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Settings className="w-4 h-4" />
                Configurar
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
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
