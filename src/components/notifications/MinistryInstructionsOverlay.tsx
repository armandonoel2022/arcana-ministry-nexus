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
          bgColor: 'bg-red-500',
          accentColor: 'border-red-400',
          badge: 'bg-red-600',
          label: 'URGENTE'
        };
      case 'high':
        return {
          bgColor: 'bg-orange-500',
          accentColor: 'border-orange-400',
          badge: 'bg-orange-600',
          label: 'ALTA PRIORIDAD'
        };
      default:
        return {
          bgColor: 'bg-blue-500',
          accentColor: 'border-blue-400',
          badge: 'bg-blue-600',
          label: 'IMPORTANTE'
        };
    }
  };

  const config = getPriorityConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className={`w-full max-w-2xl ${config.bgColor} border-2 ${config.accentColor} shadow-2xl`}>
        <div className="relative p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 mb-6">
            <AlertCircle className="w-12 h-12 flex-shrink-0 text-white" />
            <div className="flex-1">
              <div className={`inline-block px-3 py-1 rounded-full ${config.badge} text-white text-xs font-bold mb-2`}>
                {config.label}
              </div>
              <h2 className="text-3xl font-bold text-white">{title}</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-lg bg-white shadow-md">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
                📋 Instrucciones
              </h3>
              <div className="text-base leading-relaxed whitespace-pre-wrap text-gray-700">
                {instructions}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-white opacity-90">
              Por favor, lea estas instrucciones cuidadosamente
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MinistryInstructionsOverlay;
