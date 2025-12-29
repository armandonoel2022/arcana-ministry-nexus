import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Calendar, ArrowRight, Music } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import arcanaLogo from '@/assets/arca-noe-logo.png';

interface DirectorChangeOverlayProps {
  serviceDate: string;
  serviceTime?: string;
  originalDirectorName: string;
  originalDirectorPhoto?: string;
  newDirectorName: string;
  newDirectorPhoto?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  hasSongSelection?: boolean;
  onClose: () => void;
}

const DirectorChangeOverlay: React.FC<DirectorChangeOverlayProps> = ({
  serviceDate,
  serviceTime = '10:45 a.m.',
  originalDirectorName,
  originalDirectorPhoto,
  newDirectorName,
  newDirectorPhoto,
  status = 'accepted',
  hasSongSelection = false,
  onClose,
}) => {
  // Parse and format date safely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Fecha por confirmar';
      }
      return format(date, "EEEE, dd 'de' MMMM", { locale: es });
    } catch {
      return 'Fecha por confirmar';
    }
  };

  const formattedDate = formatDate(serviceDate);

  const getStatusMessage = () => {
    if (status === 'pending') {
      return 'En espera de confirmación';
    }
    if (!hasSongSelection) {
      return 'En espera de la selección de canciones';
    }
    return 'Canciones seleccionadas';
  };

  const getStatusColor = () => {
    if (status === 'pending') {
      return 'bg-yellow-50 border-yellow-300 text-yellow-700';
    }
    if (!hasSongSelection) {
      return 'bg-orange-50 border-orange-300 text-orange-700';
    }
    return 'bg-green-50 border-green-300 text-green-700';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Background circles decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/30 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute top-20 left-0 w-24 h-24 bg-blue-400/20 rounded-full -translate-x-1/2" />
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full text-white/80 hover:text-white hover:bg-white/20 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Header with logo */}
        <div className="relative p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              <img src={arcanaLogo} alt="Logo" className="w-14 h-14 object-contain" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white leading-tight">
                Reemplazo de Dirección de Alabanza
              </h2>
            </div>
          </div>
        </div>

        {/* Service date/time card */}
        <div className="px-6">
          <div className="bg-white/90 rounded-2xl p-4 text-center shadow-lg">
            <p className="text-2xl font-bold text-gray-800">{serviceTime}</p>
            <div className="flex items-center justify-center gap-2 text-blue-600 mt-1">
              <Calendar className="w-4 h-4" />
              <p className="font-medium capitalize">{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Directors section */}
        <div className="p-6 pt-4">
          <div className="flex items-center justify-center gap-4">
            {/* Original director */}
            <div className="flex flex-col items-center">
              <p className="text-xs font-semibold text-white/80 uppercase mb-2">Solicitó</p>
              <div className="w-20 h-20 bg-white/20 rounded-xl overflow-hidden flex items-center justify-center shadow-lg">
                {originalDirectorPhoto ? (
                  <img 
                    src={originalDirectorPhoto} 
                    alt={originalDirectorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold">
                    {originalDirectorName.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-white font-bold mt-2 text-center leading-tight">
                {originalDirectorName.split(' ').slice(0, 2).join('\n')}
              </p>
              <p className="text-white/60 text-xs">Director Original</p>
            </div>

            {/* Arrow */}
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>

            {/* New director */}
            <div className="flex flex-col items-center">
              <p className="text-xs font-semibold text-white/80 uppercase mb-2">Aceptó</p>
              <div className="w-20 h-20 bg-blue-400/50 rounded-xl overflow-hidden flex items-center justify-center shadow-lg border-2 border-white/50">
                {newDirectorPhoto ? (
                  <img 
                    src={newDirectorPhoto} 
                    alt={newDirectorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-300 flex items-center justify-center text-blue-700 text-2xl font-bold">
                    {newDirectorName.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-white font-bold mt-2 text-center leading-tight">
                {newDirectorName.split(' ').slice(0, 2).join('\n')}
              </p>
              <p className="text-white/60 text-xs">Nuevo Director</p>
            </div>
          </div>

          {/* Status message */}
          <div className={`mt-6 rounded-xl p-3 border flex items-center justify-center gap-2 ${getStatusColor()}`}>
            <Music className="w-4 h-4" />
            <p className="text-sm font-medium">{getStatusMessage()}</p>
          </div>
        </div>

        {/* Action button */}
        <div className="p-6 pt-0">
          <Button
            onClick={onClose}
            className="w-full bg-blue-800 hover:bg-blue-900 text-white py-6 text-lg font-semibold rounded-xl shadow-lg"
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DirectorChangeOverlay;
