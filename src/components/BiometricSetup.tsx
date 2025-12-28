import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, Scan, Shield, CheckCircle, AlertTriangle, Smartphone } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useNativeBiometric, getBiometryLabel } from '@/hooks/useNativeBiometric';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const BIOMETRIC_SERVER = 'arcana.app';

export function BiometricSetup() {
  const { user } = useAuth();
  const webBiometric = useBiometricAuth();
  const nativeBiometric = useNativeBiometric();
  const [isSetup, setIsSetup] = useState(false);
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(true);

  // Check if credentials exist on native
  useEffect(() => {
    const checkCredentials = async () => {
      if (nativeBiometric.isNative && user?.email) {
        const hasNativeCreds = await nativeBiometric.hasCredentials(BIOMETRIC_SERVER);
        if (hasNativeCreds) {
          setIsSetup(true);
        }
      }
      setIsCheckingCredentials(false);
    };
    checkCredentials();
  }, [nativeBiometric.isNative, user?.email]);

  // Use native biometric on mobile, WebAuthn on web
  const useNative = nativeBiometric.isNative && nativeBiometric.isAvailable;
  const isSupported = useNative || webBiometric.isSupported;
  const isLoading = webBiometric.isLoading || nativeBiometric.isLoading || isCheckingCredentials;
  const biometryType = useNative ? nativeBiometric.biometryType : 'fingerprint';

  const handleSetupBiometric = async () => {
    if (!user?.email || !user?.id) return;

    if (useNative) {
      // Native mobile setup
      const verified = await nativeBiometric.verifyIdentity({
        reason: 'Verificar tu identidad para configurar biometría',
        title: 'Configurar Biometría',
        subtitle: 'ARCANA',
        description: 'Usa tu huella o Face ID para habilitar inicio de sesión biométrico',
      });

      if (verified) {
        // Store credentials securely
        // Note: In production, you'd store a refresh token, not the password
        const success = await nativeBiometric.setCredentials({
          username: user.email,
          password: user.id, // This is a placeholder - in production use a secure token
          server: BIOMETRIC_SERVER,
        });

        if (success) {
          setIsSetup(true);
          toast.success('Autenticación biométrica configurada');
        } else {
          toast.error('Error al guardar credenciales');
        }
      }
    } else {
      // Web WebAuthn setup
      const success = await webBiometric.registerBiometric(user.email, user.id);
      if (success) {
        setIsSetup(true);
      }
    }
  };

  const handleRemoveBiometric = async () => {
    if (!user?.email) return;

    if (useNative) {
      const success = await nativeBiometric.deleteCredentials(BIOMETRIC_SERVER);
      if (success) {
        setIsSetup(false);
        toast.success('Autenticación biométrica eliminada');
      }
    } else {
      // For web, just remove from localStorage
      localStorage.removeItem(`biometric_${user.email}`);
      setIsSetup(false);
      toast.success('Autenticación biométrica eliminada');
    }
  };

  const hasExistingSetup = user?.email ? webBiometric.hasBiometric(user.email) : false;

  if (!isSupported) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Autenticación Biométrica
          </CardTitle>
          <CardDescription>
            {nativeBiometric.isNative 
              ? 'Tu dispositivo no tiene biometría configurada o habilitada'
              : 'Tu navegador no es compatible con autenticación biométrica'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Para usar esta función, asegúrate de tener configurado Touch ID o Face ID en tu dispositivo.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (hasExistingSetup || isSetup) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            Autenticación Biométrica Activa
          </CardTitle>
          <CardDescription>
            {useNative 
              ? `Usando ${getBiometryLabel(biometryType)}`
              : 'Configurada en este navegador'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Puedes usar {getBiometryLabel(biometryType).toLowerCase()} para iniciar sesión de forma rápida y segura.
          </p>
          
          <Button 
            variant="outline" 
            onClick={handleRemoveBiometric}
            className="w-full text-destructive hover:text-destructive"
          >
            Eliminar configuración biométrica
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {nativeBiometric.isNative ? (
            <Smartphone className="w-5 h-5" />
          ) : (
            <Shield className="w-5 h-5" />
          )}
          Configurar Autenticación Biométrica
        </CardTitle>
        <CardDescription>
          Agrega una capa extra de seguridad y comodidad a tu cuenta
          {useNative && ` • ${getBiometryLabel(biometryType)} disponible`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className={`text-center p-4 border rounded-lg ${biometryType === 'fingerprint' || biometryType === 'multiple' ? 'border-primary bg-primary/5' : ''}`}>
            <Fingerprint className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Touch ID</h3>
            <p className="text-sm text-muted-foreground">
              Usa tu huella dactilar
            </p>
          </div>
          <div className={`text-center p-4 border rounded-lg ${biometryType === 'face' || biometryType === 'multiple' ? 'border-primary bg-primary/5' : ''}`}>
            <Scan className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Face ID</h3>
            <p className="text-sm text-muted-foreground">
              Usa reconocimiento facial
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium">Beneficios:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Inicio de sesión más rápido</li>
            <li>• Mayor seguridad</li>
            <li>• No necesitas recordar contraseñas</li>
            <li>• Funciona sin conexión a internet</li>
          </ul>
        </div>

        <Button 
          onClick={handleSetupBiometric}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Configurando...' : 'Configurar Ahora'}
        </Button>
      </CardContent>
    </Card>
  );
}
