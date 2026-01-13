import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TrafficLightIndicator from '@/components/songs/TrafficLightIndicator';
import { SongRepetitionResult } from '@/hooks/useSongRepetitionCheck';
import { Loader2 } from 'lucide-react';

interface SongRepetitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  songName: string;
  result: SongRepetitionResult | null;
  isChecking: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SongRepetitionDialog: React.FC<SongRepetitionDialogProps> = ({
  isOpen,
  onClose,
  songName,
  result,
  isChecking,
  onConfirm,
  onCancel,
}) => {
  // Auto-confirm for green light
  React.useEffect(() => {
    if (result && result.color === 'green' && result.canProceed) {
      // Small delay to show the green light before auto-confirming
      const timer = setTimeout(() => {
        onConfirm();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [result, onConfirm]);

  // Auto-confirm for yellow light (can proceed but shows warning)
  React.useEffect(() => {
    if (result && result.color === 'yellow' && result.canProceed) {
      // Slightly longer delay to show the warning
      const timer = setTimeout(() => {
        onConfirm();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [result, onConfirm]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            🎵 Verificando: "{songName}"
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isChecking ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">
                Analizando historial de la canción...
              </p>
            </div>
          ) : (
            <TrafficLightIndicator
              result={result}
              isChecking={isChecking}
              onContinueAnyway={onConfirm}
              onChooseAnother={onCancel}
              showActions={true}
            />
          )}
        </div>

        {/* Auto-confirm message for green/yellow */}
        {result && result.canProceed && (
          <p className="text-xs text-center text-muted-foreground animate-pulse">
            {result.color === 'green' 
              ? 'Agregando canción automáticamente...' 
              : 'Continuando en unos segundos...'}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
