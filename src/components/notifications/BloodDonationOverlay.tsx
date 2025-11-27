import React from 'react';
import { X, Heart, Phone, MapPin, User } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BloodDonationOverlayProps {
  recipientName: string;
  bloodType: string;
  contactPhone: string;
  medicalCenter: string;
  familyContact: string;
  urgencyLevel?: 'urgent' | 'high' | 'normal';
  additionalInfo?: string;
  onClose: () => void;
}

const BloodDonationOverlay = ({ 
  recipientName,
  bloodType,
  contactPhone,
  medicalCenter,
  familyContact,
  urgencyLevel = 'urgent',
  additionalInfo,
  onClose 
}: BloodDonationOverlayProps) => {
  const getUrgencyConfig = () => {
    switch (urgencyLevel) {
      case 'urgent':
        return {
          badge: 'bg-red-500 animate-pulse',
          label: 'URGENTE'
        };
      case 'high':
        return {
          badge: 'bg-orange-500',
          label: 'ALTA PRIORIDAD'
        };
      default:
        return {
          badge: 'bg-yellow-500',
          label: 'NECESARIO'
        };
    }
  };

  const config = getUrgencyConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-red-900 via-red-800 to-red-900 border-2 border-red-500 shadow-2xl">
        <div className="relative p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 mb-6">
            <Heart className="w-16 h-16 flex-shrink-0 animate-pulse" fill="currentColor" />
            <div className="flex-1">
              <div className={`inline-block px-3 py-1 rounded-full ${config.badge} text-white text-xs font-bold mb-2`}>
                {config.label}
              </div>
              <h2 className="text-3xl font-bold">Donación de Sangre Urgente</h2>
              <p className="text-xl mt-2 opacity-90">Se necesita tipo: <span className="font-bold text-2xl">{bloodType}</span></p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-lg bg-white/10 border border-red-500 backdrop-blur-sm space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm opacity-80">Paciente</p>
                  <p className="text-xl font-semibold">{recipientName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm opacity-80">Centro Médico</p>
                  <p className="text-xl font-semibold">{medicalCenter}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm opacity-80">Teléfono de Contacto</p>
                  <a 
                    href={`tel:${contactPhone}`}
                    className="text-xl font-semibold underline hover:text-red-200 transition-colors"
                  >
                    {contactPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm opacity-80">Familiar Cercano</p>
                  <p className="text-xl font-semibold">{familyContact}</p>
                </div>
              </div>

              {additionalInfo && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-sm opacity-80 mb-2">Información adicional</p>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{additionalInfo}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/5 rounded-lg text-center border border-red-500/30">
            <p className="text-sm font-semibold">
              🩸 Tu donación puede salvar una vida • Comunícate inmediatamente si puedes ayudar
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BloodDonationOverlay;
