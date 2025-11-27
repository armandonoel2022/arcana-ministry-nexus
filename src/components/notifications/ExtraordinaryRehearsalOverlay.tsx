import React from 'react';
import { X, Music, Calendar, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExtraordinaryRehearsalOverlayProps {
  activityName: string;
  date: string;
  time: string;
  location?: string;
  additionalNotes?: string;
  onClose: () => void;
}

const ExtraordinaryRehearsalOverlay = ({ 
  activityName,
  date,
  time,
  location,
  additionalNotes,
  onClose 
}: ExtraordinaryRehearsalOverlayProps) => {
  const formattedDate = format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  
  // Convertir hora de formato 24h a 12h con AM/PM
  const formatTime = (time24: string) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'p.m.' : 'a.m.';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-indigo-500 via-indigo-400 to-white border-2 border-indigo-400 shadow-2xl">
        <div className="relative p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-6">
            <Music className="w-16 h-16 text-white" />
            <div>
              <p className="text-sm font-medium text-white opacity-90">Ensayo Extraordinario</p>
              <h2 className="text-3xl font-bold mt-1 text-white">{activityName}</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-lg bg-white shadow-md space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-6 h-6 flex-shrink-0 mt-0.5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="text-xl font-semibold text-gray-800 capitalize">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 flex-shrink-0 mt-0.5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">Hora</p>
                  <p className="text-xl font-semibold text-gray-800">{formatTime(time)}</p>
                </div>
              </div>

              {location && (
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">📍</span>
                  <div>
                    <p className="text-sm text-gray-600">Lugar</p>
                    <p className="text-xl font-semibold text-gray-800">{location}</p>
                  </div>
                </div>
              )}

              {additionalNotes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Notas adicionales</p>
                  <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-700">{additionalNotes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-white opacity-90">
              Tu asistencia es importante • Confirma tu participación
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExtraordinaryRehearsalOverlay;
