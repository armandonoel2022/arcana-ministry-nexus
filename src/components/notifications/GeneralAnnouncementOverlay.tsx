import React from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface GeneralAnnouncementOverlayProps {
  title: string;
  message: string;
  announcementType: 'death_announcement' | 'meeting_announcement' | 'special_service' | 'prayer_request';
  onClose: () => void;
}

const GeneralAnnouncementOverlay = ({ 
  title, 
  message, 
  announcementType,
  onClose 
}: GeneralAnnouncementOverlayProps) => {
  const getTypeConfig = () => {
    switch (announcementType) {
      case 'death_announcement':
        return {
          bgGradient: 'from-gray-900 via-gray-800 to-gray-900',
          accentColor: 'border-gray-500',
          icon: '🎗️',
          label: 'Anuncio de Fallecimiento'
        };
      case 'meeting_announcement':
        return {
          bgGradient: 'from-blue-900 via-blue-800 to-blue-900',
          accentColor: 'border-blue-500',
          icon: '📅',
          label: 'Convocatoria a Reunión'
        };
      case 'special_service':
        return {
          bgGradient: 'from-purple-900 via-purple-800 to-purple-900',
          accentColor: 'border-purple-500',
          icon: '⛪',
          label: 'Servicio Especial'
        };
      case 'prayer_request':
        return {
          bgGradient: 'from-amber-900 via-amber-800 to-amber-900',
          accentColor: 'border-amber-500',
          icon: '🙏',
          label: 'Solicitud de Oración'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className={`w-full max-w-2xl max-h-[90vh] flex flex-col bg-gradient-to-br ${config.bgGradient} border-2 ${config.accentColor} shadow-2xl`}>
        <div className="relative flex-shrink-0 p-6 pb-4 text-white border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 pr-12">
            <span className="text-5xl md:text-6xl flex-shrink-0">{config.icon}</span>
            <div className="min-w-0">
              <p className="text-xs md:text-sm font-medium opacity-80">{config.label}</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-1 break-words">{title}</h2>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <div className="space-y-4">
            <div className={`p-4 md:p-6 rounded-lg bg-white border ${config.accentColor} backdrop-blur-sm`}>
              <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap text-gray-900">{message}</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs md:text-sm opacity-70 text-white">
              Ministerio de Alabanza y Adoración
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GeneralAnnouncementOverlay;
