import React from 'react';
import { X, Calendar, Clock, Users, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import arcanaLogo from '@/assets/arca-noe-logo.png';

interface ExtraordinaryRehearsalOverlayProps {
  activityName: string;
  date: string;
  time: string;
  location?: string;
  additionalNotes?: string;
  specialEventName?: string;
  onClose: () => void;
}

const ExtraordinaryRehearsalOverlay = ({ 
  activityName,
  date,
  time,
  location,
  additionalNotes,
  specialEventName,
  onClose 
}: ExtraordinaryRehearsalOverlayProps) => {
  const formattedDate = format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  
  const formatTime = (time24: string) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'p.m.' : 'a.m.';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-20 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2" />
        <div className="absolute top-1/2 right-0 w-24 h-24 bg-amber-500/20 rounded-full translate-x-1/2" />

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full text-white/80 hover:text-white hover:bg-white/20 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              <img src={arcanaLogo} alt="Logo" className="w-14 h-14 object-contain" />
            </div>
            <div className="flex-1">
              <p className="text-amber-200/90 text-sm font-medium uppercase tracking-wide">Ensayo Extraordinario</p>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-amber-300" />
                <span className="text-amber-200 text-xs font-semibold">TODOS LOS GRUPOS</span>
              </div>
            </div>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
              <Flame className="w-10 h-10 text-amber-200" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center leading-tight">
            {activityName}
          </h2>

          {specialEventName && (
            <div className="mt-3 flex justify-center">
              <span className="bg-amber-500/30 text-amber-100 text-xs font-semibold px-4 py-1.5 rounded-full border border-amber-400/30">
                🌟 {specialEventName}
              </span>
            </div>
          )}
        </div>

        {/* Details card */}
        <div className="px-6">
          <div className="bg-white/90 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-semibold text-gray-800 capitalize">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Hora</p>
                <p className="font-semibold text-gray-800">{formatTime(time)}</p>
              </div>
            </div>

            {location && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">📍</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lugar</p>
                  <p className="font-semibold text-gray-800">{location}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Motivational message */}
        <div className="px-6 mt-4">
          <div className="bg-white/15 rounded-xl p-4 border border-amber-400/20">
            <p className="text-amber-100 text-center text-sm leading-relaxed">
              🙏 Recordemos que la adoración requiere preparación.
            </p>
            {additionalNotes && (
              <p className="text-white/80 text-center text-sm mt-2 leading-relaxed whitespace-pre-wrap">
                {additionalNotes}
              </p>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="p-6 pt-5">
          <Button
            onClick={onClose}
            className="w-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 py-6 text-lg font-semibold rounded-xl shadow-lg backdrop-blur-sm"
          >
            ¡Entendido!
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExtraordinaryRehearsalOverlay;
