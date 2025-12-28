import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Fingerprint, Scan, Loader2, ShieldCheck } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useNativeBiometric, getBiometryLabel } from '@/hooks/useNativeBiometric';
import { toast } from 'sonner';

interface BiometricAuthSectionProps {
  userEmail: string;
  onSuccess?: () => void;
}

const BIOMETRIC_SERVER = 'arcana.app';

export function BiometricAuthSection({ userEmail, onSuccess }: BiometricAuthSectionProps) {
  const webBiometric = useBiometricAuth();
  const nativeBiometric = useNativeBiometric();
  const [hasBiometricSetup, setHasBiometricSetup] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if biometric is set up
  useEffect(() => {
    const checkSetup = async () => {
      if (nativeBiometric.isNative) {
        const hasNative = await nativeBiometric.hasCredentials(BIOMETRIC_SERVER);
        setHasBiometricSetup(hasNative);
      } else if (userEmail) {
        setHasBiometricSetup(webBiometric.hasBiometric(userEmail));
      }
      setIsChecking(false);
    };
    checkSetup();
  }, [userEmail, nativeBiometric.isNative]);

  // Use native on mobile, WebAuthn on web
  const useNative = nativeBiometric.isNative && nativeBiometric.isAvailable;
  const isSupported = useNative || webBiometric.isSupported;
  const isLoading = webBiometric.isLoading || nativeBiometric.isLoading || isChecking;
  const biometryType = useNative ? nativeBiometric.biometryType : 'fingerprint';

  const handleBiometricAuth = async () => {
    if (!userEmail) {
      toast.error('Ingresa tu correo electrónico primero');
      return;
    }

    if (useNative) {
      // Native biometric auth
      const verified = await nativeBiometric.verifyIdentity({
        reason: 'Iniciar sesión en ARCANA',
        title: 'Autenticación',
        subtitle: 'ARCANA',
        description: 'Usa tu huella o Face ID para iniciar sesión',
      });

      if (verified) {
        const credentials = await nativeBiometric.getCredentials(BIOMETRIC_SERVER);
        if (credentials) {
          toast.success('Autenticación biométrica exitosa');
          onSuccess?.();
        } else {
          toast.error('No se encontraron credenciales guardadas');
        }
      }
    } else {
      // Web WebAuthn auth
      const success = await webBiometric.authenticateBiometric(userEmail);
      if (success) {
        toast.success('Autenticación biométrica exitosa');
        onSuccess?.();
      }
    }
  };

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            O continúa con
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleBiometricAuth}
          disabled={isLoading || !hasBiometricSetup}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Fingerprint className="w-4 h-4 mr-2" />
          )}
          Huella
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={handleBiometricAuth}
          disabled={isLoading || !hasBiometricSetup}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Scan className="w-4 h-4 mr-2" />
          )}
          Face ID
        </Button>
      </div>

      {!isChecking && (
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          {hasBiometricSetup 
            ? `${getBiometryLabel(biometryType)} configurado` 
            : 'Configura biometría en Ajustes'}
        </p>
      )}
    </div>
  );
}