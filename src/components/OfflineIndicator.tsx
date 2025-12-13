import React from 'react';
import { WifiOff, RefreshCw, Clock } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOfflineCache';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg",
      className
    )}>
      <WifiOff className="w-4 h-4" />
      <span>Sin conexión - Usando datos guardados</span>
    </div>
  );
};

interface StaleDataBannerProps {
  isStale: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
}

export const StaleDataBanner: React.FC<StaleDataBannerProps> = ({
  isStale,
  onRefresh,
  refreshing = false,
  className
}) => {
  const isOnline = useOnlineStatus();

  if (!isStale) return null;

  return (
    <div className={cn(
      "bg-muted/80 backdrop-blur-sm text-muted-foreground py-2 px-4 flex items-center justify-between gap-2 text-sm rounded-lg mb-4",
      className
    )}>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span>Datos guardados localmente</span>
      </div>
      {isOnline && onRefresh && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          disabled={refreshing}
          className="h-7 px-2"
        >
          <RefreshCw className={cn("w-3 h-3 mr-1", refreshing && "animate-spin")} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </Button>
      )}
    </div>
  );
};

export default OfflineIndicator;
