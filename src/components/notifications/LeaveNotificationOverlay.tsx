import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Heart, Calendar, Clock, Share2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import arcanaLogo from '@/assets/arca-noe-logo.png';
import {
  MemberLeave,
  LEAVE_TYPE_LABELS,
} from '@/hooks/useMemberLeaves';

interface LeaveNotificationOverlayProps {
  leave: MemberLeave;
  onClose: () => void;
}

const LeaveNotificationOverlay: React.FC<LeaveNotificationOverlayProps> = ({
  leave,
  onClose,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "dd 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const getLeaveMessage = () => {
    switch (leave.leave_type) {
      case 'enfermedad':
        return 'se encuentra en reposo por motivos de salud';
      case 'maternidad':
        return 'se encuentra en licencia por maternidad/paternidad';
      case 'estudios':
        return 'se encuentra en licencia por estudios';
      case 'trabajo':
        return 'se encuentra en licencia por compromisos laborales';
      case 'vacaciones':
        return 'se encuentra disfrutando de sus vacaciones';
      case 'disciplina':
        return 'se encuentra en período de disciplina';
      case 'suspension':
        return 'se encuentra suspendido/a temporalmente';
      case 'baja_definitiva':
        return 'ha sido dado/a de baja del ministerio';
      default:
        return 'se encuentra en licencia';
    }
  };

  const getGradientColors = () => {
    switch (leave.leave_type) {
      case 'enfermedad':
        return 'from-red-500 via-red-600 to-rose-700';
      case 'maternidad':
        return 'from-pink-500 via-pink-600 to-fuchsia-700';
      case 'estudios':
        return 'from-blue-500 via-blue-600 to-indigo-700';
      case 'trabajo':
        return 'from-amber-500 via-amber-600 to-orange-700';
      case 'vacaciones':
        return 'from-green-500 via-green-600 to-emerald-700';
      case 'disciplina':
        return 'from-orange-500 via-orange-600 to-red-700';
      case 'suspension':
        return 'from-purple-500 via-purple-600 to-violet-700';
      case 'baja_definitiva':
        return 'from-gray-600 via-gray-700 to-slate-800';
      default:
        return 'from-slate-500 via-slate-600 to-gray-700';
    }
  };

  const getIcon = () => {
    switch (leave.leave_type) {
      case 'enfermedad':
        return '🏥';
      case 'maternidad':
        return '👶';
      case 'estudios':
        return '📚';
      case 'trabajo':
        return '💼';
      case 'vacaciones':
        return '🌴';
      case 'disciplina':
        return '⚠️';
      case 'suspension':
        return '🚫';
      case 'baja_definitiva':
        return '👋';
      default:
        return '📋';
    }
  };

  const handleShare = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: null,
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], 'licencia-ministerio.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Notificación de Licencia',
              text: `${leave.profile?.full_name} ${getLeaveMessage()}`,
            });
          } catch (err) {
            // User cancelled or error
            console.log('Share cancelled');
          }
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'licencia-ministerio.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md">
        {/* Contenido capturado para la imagen */}
        <div
          ref={contentRef}
          className={`bg-gradient-to-b ${getGradientColors()} rounded-3xl shadow-2xl relative overflow-hidden`}
        >
          {/* Decoraciones */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-20 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2" />

          {/* Header */}
          <div className="relative p-6 pb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                <img src={arcanaLogo} alt="Logo" className="w-12 h-12 object-contain" />
              </div>
              <div className="flex-1">
                <p className="text-white/80 text-sm font-medium uppercase tracking-wide">
                  Comunicado Oficial
                </p>
                <p className="text-white font-semibold">Ministerio de Alabanza</p>
              </div>
            </div>

            {/* Tipo de licencia */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-4">
              <span className="text-2xl">{getIcon()}</span>
              <span className="text-white font-semibold">
                {LEAVE_TYPE_LABELS[leave.leave_type]}
              </span>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="px-6">
            <div className="bg-white/90 rounded-2xl p-6 shadow-lg">
              {/* Foto y nombre */}
              <div className="flex flex-col items-center text-center mb-6">
                <div
                  className={`w-24 h-24 rounded-full overflow-hidden border-4 shadow-lg mb-4 ${
                    leave.leave_type === 'baja_definitiva'
                      ? 'border-gray-300 grayscale'
                      : 'border-white'
                  }`}
                >
                  {leave.profile?.photo_url ? (
                    <img
                      src={leave.profile.photo_url}
                      alt={leave.profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-500">
                        {leave.profile?.full_name?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800">{leave.profile?.full_name}</h2>
                <p className="text-gray-600 mt-2">{getLeaveMessage()}</p>
              </div>

              {/* Fechas */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Desde: {formatDate(leave.start_date)}</span>
                  </div>
                </div>
                {leave.is_indefinite ? (
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Duración indefinida</span>
                  </div>
                ) : leave.end_date ? (
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Hasta: {formatDate(leave.end_date)}</span>
                  </div>
                ) : null}
              </div>

              {/* Razón (si es visible) */}
              {leave.reason && leave.reason_visible && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 text-center italic">"{leave.reason}"</p>
                </div>
              )}

              {/* Mensaje de apoyo */}
              {leave.leave_type !== 'disciplina' &&
                leave.leave_type !== 'suspension' &&
                leave.leave_type !== 'baja_definitiva' && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-gray-500">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-sm">
                      Oramos por su pronta recuperación y regreso
                    </span>
                    <Heart className="w-4 h-4 text-red-400" />
                  </div>
                )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 text-center">
            <p className="text-white/60 text-xs">
              Ministerio Arca de Noé • {format(new Date(), 'yyyy')}
            </p>
          </div>
        </div>

        {/* Botones fuera del área de captura */}
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleShare}
            className="flex-1 bg-white/90 hover:bg-white text-gray-800 border-0 py-6"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Compartir
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 bg-transparent border-white/30 text-white hover:bg-white/20 py-6"
          >
            <X className="w-5 h-5 mr-2" />
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeaveNotificationOverlay;
