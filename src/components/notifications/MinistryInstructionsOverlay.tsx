import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MinistryInstructionsOverlayProps {
  title: string;
  instructions: string;
  priority?: 'normal' | 'high' | 'urgent';
  onClose: () => void;
}

const MinistryInstructionsOverlay = ({ 
  title, 
  instructions,
  priority = 'normal',
  onClose 
}: MinistryInstructionsOverlayProps) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'urgent':
        return {
          bgGradient: 'from-red-900 via-red-800 to-red-900',
          accentColor: 'border-red-500',
          badge: 'bg-red-500',
          label: 'URGENTE'
        };
      case 'high':
        return {
          bgGradient: 'from-orange-900 via-orange-800 to-orange-900',
          accentColor: 'border-orange-500',
          badge: 'bg-orange-500',
          label: 'ALTA PRIORIDAD'
        };
      default:
        return {
          bgGradient: 'from-blue-900 via-blue-800 to-blue-900',
          accentColor: 'border-blue-500',
          badge: 'bg-blue-500',
          label: 'IMPORTANTE'
        };
    }
  };

  const config = getPriorityConfig();

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

          <div className="flex items-start gap-4 mb-6">
            <AlertCircle className="w-12 h-12 flex-shrink-0" />
            <div className="flex-1">
              <div className={`inline-block px-3 py-1 rounded-full ${config.badge} text-white text-xs font-bold mb-2`}>
                {config.label}
              </div>
              <h2 className="text-3xl font-bold">{title}</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`p-6 rounded-lg bg-white/10 border ${config.accentColor} backdrop-blur-sm`}>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                📋 Instrucciones
              </h3>
              <div className="text-base leading-relaxed whitespace-pre-wrap">
                {instructions}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm opacity-70">
              Por favor, lea estas instrucciones cuidadosamente
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MinistryInstructionsOverlay;
