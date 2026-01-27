import React from 'react';
import { cn } from '@/lib/utils';
import { TrafficLightColor, SongRepetitionResult } from '@/hooks/useSongRepetitionCheck';
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrafficLightIndicatorProps {
  result: SongRepetitionResult | null;
  isChecking: boolean;
  onContinueAnyway?: () => void;
  onChooseAnother?: () => void;
  showActions?: boolean;
}

const TrafficLightIndicator: React.FC<TrafficLightIndicatorProps> = ({
  result,
  isChecking,
  onContinueAnyway,
  onChooseAnother,
  showActions = true
}) => {
  if (isChecking) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Verificando historial de canción...</span>
      </div>
    );
  }

  if (!result) return null;

  const colorStyles = {
    green: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: CheckCircle,
      lightColor: 'bg-green-500',
      inactiveColor: 'bg-gray-300 dark:bg-gray-600'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: AlertTriangle,
      lightColor: 'bg-yellow-500',
      inactiveColor: 'bg-gray-300 dark:bg-gray-600'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: XCircle,
      lightColor: 'bg-red-500',
      inactiveColor: 'bg-gray-300 dark:bg-gray-600'
    }
  };

  const styles = colorStyles[result.color];
  const Icon = styles.icon;

  return (
    <div className={cn(
      'rounded-lg border p-4 space-y-3 transition-all duration-300',
      styles.bg,
      styles.border
    )}>
      <div className="flex items-start gap-3">
        {/* Traffic Light Visual */}
        <div className="flex flex-col gap-1 p-2 bg-gray-800 rounded-lg">
          <div className={cn(
            'w-4 h-4 rounded-full transition-all duration-300',
            result.color === 'red' ? 'bg-red-500 shadow-lg shadow-red-500/50' : styles.inactiveColor
          )} />
          <div className={cn(
            'w-4 h-4 rounded-full transition-all duration-300',
            result.color === 'yellow' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' : styles.inactiveColor
          )} />
          <div className={cn(
            'w-4 h-4 rounded-full transition-all duration-300',
            result.color === 'green' ? 'bg-green-500 shadow-lg shadow-green-500/50' : styles.inactiveColor
          )} />
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={cn('w-5 h-5', styles.text)} />
            <span className={cn('font-semibold text-sm', styles.text)}>
              {result.message}
            </span>
          </div>
          <p className={cn('text-sm opacity-80', styles.text)}>
            {result.details}
          </p>
        </div>
      </div>

      {/* Action Buttons for Red State ONLY */}
      {showActions && result.color === 'red' && !result.canProceed && (
        <div className="flex gap-2 pt-2 border-t border-red-200 dark:border-red-800">
          <Button
            size="sm"
            variant="outline"
            onClick={onChooseAnother}
            className="flex-1 border-red-300 text-red-700 hover:bg-red-100"
          >
            Elegir otra canción
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onContinueAnyway}
            className="flex-1"
          >
            Continuar de todas formas
          </Button>
        </div>
      )}
    </div>
  );
};

export default TrafficLightIndicator;
