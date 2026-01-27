import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TrafficLightIndicator from '@/components/songs/TrafficLightIndicator';
import { SongRepetitionResult } from '@/hooks/useSongRepetitionCheck';
import { Loader2, Plus, Check, Search } from 'lucide-react';

interface SongRepetitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  songName: string;
  result: SongRepetitionResult | null;
  isChecking: boolean;
  onConfirm: (addAnother: boolean) => void;
  onCancel: () => void;
  onSearchAnother?: () => void;
  pendingSongsCount?: number;
}

export const SongRepetitionDialog: React.FC<SongRepetitionDialogProps> = ({
  isOpen,
  onClose,
  songName,
  result,
  isChecking,
  onConfirm,
  onCancel,
  onSearchAnother,
  pendingSongsCount = 0,
}) => {
  const [showAddAnotherOptions, setShowAddAnotherOptions] = useState(false);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setShowAddAnotherOptions(false);
    }
  }, [isOpen]);

  const handleConfirmAndAsk = () => {
    // Show options to add another song
    setShowAddAnotherOptions(true);
  };

  const handleAddAnother = (fromSearch: boolean) => {
    setShowAddAnotherOptions(false);
    onConfirm(true); // true = add another
    if (fromSearch && onSearchAnother) {
      onSearchAnother();
    }
  };

  const handleFinish = () => {
    setShowAddAnotherOptions(false);
    onConfirm(false); // false = no more songs, send notification
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            🎵 Verificando: "{songName}"
          </DialogTitle>
          {pendingSongsCount > 0 && (
            <p className="text-xs text-center text-muted-foreground mt-1">
              {pendingSongsCount} canción{pendingSongsCount > 1 ? 'es' : ''} pendiente{pendingSongsCount > 1 ? 's' : ''} de agregar
            </p>
          )}
        </DialogHeader>

        <div className="py-4">
          {isChecking ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">
                Analizando historial de la canción...
              </p>
            </div>
          ) : showAddAnotherOptions ? (
            // Post-confirmation: Ask if user wants to add another song
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg text-green-700">
                  ¡Canción agregada!
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  ¿Deseas agregar otra canción al servicio?
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => handleAddAnother(false)}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Sí, del repertorio
                </Button>
                
                {onSearchAnother && (
                  <Button
                    onClick={() => handleAddAnother(true)}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Sí, buscar con ARCANA
                  </Button>
                )}
                
                <Button
                  onClick={handleFinish}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  No, enviar notificación
                </Button>
              </div>
            </div>
          ) : (
            // Traffic light indicator with manual confirmation
            <div className="space-y-4">
              <TrafficLightIndicator
                result={result}
                isChecking={isChecking}
                onContinueAnyway={handleConfirmAndAsk}
                onChooseAnother={onCancel}
                showActions={true}
              />
              
              {/* Manual confirmation button for green/yellow - no auto-close */}
              {result && result.canProceed && (
                <div className="pt-2 border-t">
                  <Button
                    onClick={handleConfirmAndAsk}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    ✓ Agregar canción
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
