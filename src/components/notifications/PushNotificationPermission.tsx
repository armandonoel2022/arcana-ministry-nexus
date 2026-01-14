import React from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const PushNotificationPermission: React.FC = () => {
  const { isSupported, permission, isRegistering, deviceToken, requestPermission, forceReRegister } = usePushNotifications();
  const [isReRegistering, setIsReRegistering] = React.useState(false);

  const handleForceReRegister = async () => {
    setIsReRegistering(true);
    try {
      await forceReRegister();
    } finally {
      setIsReRegistering(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <BellOff className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium mb-1">Notificaciones no disponibles</p>
              <p className="text-yellow-700">Tu navegador no soporta notificaciones push.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <BellOff className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-800">
              <p className="font-medium mb-1">Notificaciones bloqueadas</p>
              <p className="text-red-700">Has bloqueado las notificaciones. Habilítalas en la configuración de tu navegador.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (permission === 'granted') {
    // Check if device token is registered
    if (!deviceToken) {
      return (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div className="text-xs text-amber-800 font-medium">
                ⚠️ Notificaciones activadas pero dispositivo no registrado
              </div>
            </div>
            <Button
              onClick={handleForceReRegister}
              disabled={isReRegistering}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {isReRegistering ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Registrar dispositivo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="text-xs text-green-800 font-medium">
              ✅ Notificaciones push activadas
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Bell className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800">
            Activa las notificaciones push para recibir alertas de cumpleaños, turnos de alabanza y actualizaciones importantes incluso cuando ARCANA no esté abierta.
          </p>
        </div>
        <Button
          onClick={requestPermission}
          disabled={isRegistering}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          {isRegistering ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Configurando...
            </>
          ) : (
            <>
              <Bell className="w-3 h-3 mr-2" />
              Activar Notificaciones Push
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
