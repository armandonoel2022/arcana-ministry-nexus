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
          icon: '🕯️',
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
      <Card className={`w-full max-w-2xl bg-gradient-to-br ${config.bgGradient} border-2 ${config.accentColor} shadow-2xl`}>
        <div className="relative p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-6xl">{config.icon}</span>
            <div>
              <p className="text-sm font-medium opacity-80">{config.label}</p>
              <h2 className="text-3xl font-bold mt-1">{title}</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`p-6 rounded-lg bg-white/10 border ${config.accentColor} backdrop-blur-sm`}>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{message}</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm opacity-70">
              Ministerio de Alabanza y Adoración
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GeneralAnnouncementOverlay;
