import React, { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2, RefreshCw, Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Helper to detect native platform
const isNativePlatform = () => {
  return typeof (window as any).Capacitor !== 'undefined' && 
         (window as any).Capacitor.isNativePlatform?.();
};

export const PushNotificationPermission: React.FC = () => {
  const { isSupported, permission, isRegistering, deviceToken, requestPermission, forceReRegister } = usePushNotifications();
  const [isReRegistering, setIsReRegistering] = useState(false);
  const [registrationAttempted, setRegistrationAttempted] = useState(false);

  // Auto-attempt registration for native platforms when permissions are granted but no token
  useEffect(() => {
    if (isNativePlatform() && permission === 'granted' && !deviceToken && !registrationAttempted && !isReRegistering) {
      console.log('📱 [PushPermission] Auto-attempting registration for native device');
      setRegistrationAttempted(true);
      handleForceReRegister();
    }
  }, [permission, deviceToken, registrationAttempted, isReRegistering]);

  const handleForceReRegister = async () => {
    setIsReRegistering(true);
    try {
      const success = await forceReRegister();
      if (success) {
        console.log('📱 [PushPermission] Registration successful');
      } else {
        console.log('📱 [PushPermission] Registration returned false');
      }
    } catch (error) {
      console.error('📱 [PushPermission] Registration error:', error);
    } finally {
      setIsReRegistering(false);
    }
  };

  const handleRequestPermission = async () => {
    setIsReRegistering(true);
    try {
      await requestPermission();
    } finally {
      setIsReRegistering(false);
      setRegistrationAttempted(true);
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
              <p className="text-yellow-700">
                {isNativePlatform() 
                  ? 'Los permisos de notificaciones no están configurados correctamente.'
                  : 'Tu navegador no soporta notificaciones push.'}
              </p>
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
              <p className="text-red-700">
                {isNativePlatform()
                  ? 'Has bloqueado las notificaciones. Habilítalas en Ajustes > ARCANA > Notificaciones.'
                  : 'Has bloqueado las notificaciones. Habilítalas en la configuración de tu navegador.'}
              </p>
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
              <Smartphone className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div className="text-xs text-amber-800 font-medium">
                ⚠️ Dispositivo no registrado para push
              </div>
            </div>
            <p className="text-xs text-amber-700">
              {isNativePlatform() 
                ? 'Tu dispositivo iOS necesita registrarse para recibir notificaciones.'
                : 'Tu navegador necesita registrarse para recibir notificaciones.'}
            </p>
            <Button
              onClick={handleForceReRegister}
              disabled={isReRegistering || isRegistering}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {(isReRegistering || isRegistering) ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Registrando dispositivo...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Registrar este dispositivo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="text-xs text-green-800 font-medium">
              ✅ Notificaciones push activadas
            </div>
          </div>
          <p className="text-xs text-green-700 break-all">
            Token: {deviceToken.substring(0, 20)}...
          </p>
          <Button
            onClick={handleForceReRegister}
            disabled={isReRegistering || isRegistering}
            variant="outline"
            className="w-full border-green-300 text-green-700 hover:bg-green-100"
            size="sm"
          >
            {(isReRegistering || isRegistering) ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-2" />
                Re-registrar dispositivo
              </>
            )}
          </Button>
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
            {isNativePlatform()
              ? 'Activa las notificaciones para recibir alertas de cumpleaños, turnos de alabanza y actualizaciones importantes.'
              : 'Activa las notificaciones push para recibir alertas incluso cuando ARCANA no esté abierta.'}
          </p>
        </div>
        <Button
          onClick={handleRequestPermission}
          disabled={isRegistering || isReRegistering}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          {(isRegistering || isReRegistering) ? (
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
