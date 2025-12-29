import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Mic, Users, Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import arcanaLogo from '@/assets/arca-noe-logo.png';

interface VoiceReplacementOverlayProps {
  serviceDate: string;
  serviceTime?: string;
  serviceTitle: string;
  originalMemberName: string;
  originalMemberPhoto?: string;
  replacementMemberName: string;
  replacementMemberPhoto?: string;
  voiceType?: string;
  micPosition?: number;
  groupName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  reason?: string;
  onClose: () => void;
}

const VoiceReplacementOverlay: React.FC<VoiceReplacementOverlayProps> = ({
  serviceDate,
  serviceTime = '9:00 AM',
  serviceTitle,
  originalMemberName,
  originalMemberPhoto,
  replacementMemberName,
  replacementMemberPhoto,
  voiceType = 'Soprano',
  micPosition,
  groupName,
  status,
  reason,
  onClose,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Fecha por confirmar';
      return format(date, "EEEE, dd 'de' MMMM", { locale: es });
    } catch {
      return 'Fecha por confirmar';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'accepted':
        return { text: 'Reemplazo Confirmado', color: 'bg-green-500' };
      case 'rejected':
        return { text: 'Reemplazo Rechazado', color: 'bg-red-500' };
      case 'expired':
        return { text: 'Solicitud Expirada', color: 'bg-gray-500' };
      default:
        return { text: 'Pendiente de Respuesta', color: 'bg-amber-500' };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-gradient-to-b from-violet-500 via-violet-600 to-violet-700 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-20 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2" />

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
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              <img src={arcanaLogo} alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <div className="flex-1">
              <p className="text-white/80 text-sm font-medium uppercase tracking-wide">Reemplazo de Corista</p>
              <p className="text-white font-semibold">{groupName}</p>
            </div>
          </div>

          {/* Status badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${statusInfo.color} rounded-full mb-4`}>
            <Mic className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">{statusInfo.text}</span>
          </div>

          {/* Service info */}
          <div className="bg-white/10 rounded-xl p-3 mb-4">
            <p className="text-white/70 text-xs mb-1">Servicio</p>
            <p className="text-white font-semibold">{serviceTitle}</p>
            <div className="flex items-center gap-3 mt-2 text-white/80 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="capitalize">{formatDate(serviceDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{serviceTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Replacement details */}
        <div className="px-6">
          <div className="bg-white/90 rounded-2xl p-5 shadow-lg">
            {/* Members comparison */}
            <div className="flex items-center justify-between gap-4 mb-4">
              {/* Original member */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-3 border-red-200 shadow-lg mb-2">
                  {originalMemberPhoto ? (
                    <img src={originalMemberPhoto} alt={originalMemberName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-red-100 flex items-center justify-center">
                      <Users className="w-8 h-8 text-red-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">No disponible</p>
                <p className="font-semibold text-gray-800 text-sm leading-tight">{originalMemberName}</p>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-violet-600" />
                </div>
              </div>

              {/* Replacement member */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-3 border-green-200 shadow-lg mb-2">
                  {replacementMemberPhoto ? (
                    <img src={replacementMemberPhoto} alt={replacementMemberName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-green-100 flex items-center justify-center">
                      <Users className="w-8 h-8 text-green-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">Reemplaza</p>
                <p className="font-semibold text-gray-800 text-sm leading-tight">{replacementMemberName}</p>
              </div>
            </div>

            {/* Voice info */}
            <div className="flex items-center justify-center gap-4 py-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-violet-500" />
                <span className="text-gray-700 font-medium">{voiceType}</span>
              </div>
              {micPosition && (
                <div className="text-gray-500 text-sm">
                  Micrófono #{micPosition}
                </div>
              )}
            </div>

            {/* Reason if provided */}
            {reason && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Razón del cambio:</p>
                <p className="text-sm text-gray-700">{reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="p-6 pt-5">
          <Button
            onClick={onClose}
            className="w-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 py-6 text-lg font-semibold rounded-xl shadow-lg backdrop-blur-sm"
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceReplacementOverlay;
