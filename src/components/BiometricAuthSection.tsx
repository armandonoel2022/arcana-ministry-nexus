import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Fingerprint, Scan, ShieldCheck } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { toast } from 'sonner';

interface BiometricAuthSectionProps {
  userEmail: string;
}

export function BiometricAuthSection({ userEmail }: BiometricAuthSectionProps) {
  const { isSupported, isLoading, authenticateBiometric, hasBiometric } = useBiometricAuth();
  const [hasSetup, setHasSetup] = useState(false);

  // Fixed the dependency issue to prevent infinite re-renders
  useEffect(() => {
    if (userEmail) {
      const setupStatus = hasBiometric(userEmail);
      setHasSetup(setupStatus);
    }
  }, [userEmail]); // Removed hasBiometric from dependencies

  const handleBiometricAuth = async () => {
    if (!userEmail) {
      toast.error('Por favor ingresa tu email primero');
      return;
    }

    const success = await authenticateBiometric(userEmail);
    if (success) {
      // For demo purposes, we'll sign in the user if biometric auth is successful
      // In production, you would implement a proper backend flow that verifies
      // the biometric authentication and provides a session token
      
      // For now, we'll show a success message and suggest using email/password
      toast.success('Autenticación biométrica exitosa! Usa tu email y contraseña para completar el inicio de sesión.');
    }
  };

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
          <span className="bg-white px-2 text-muted-foreground">
            O continúa con
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleBiometricAuth}
          disabled={isLoading || !userEmail || !hasSetup}
          className="w-full"
        >
          <Fingerprint className="mr-2 h-4 w-4" />
          {isLoading ? 'Autenticando...' : 'Huella'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleBiometricAuth}
          disabled={isLoading || !userEmail || !hasSetup}
          className="w-full"
        >
          <Scan className="mr-2 h-4 w-4" />
          {isLoading ? 'Autenticando...' : 'Face ID'}
        </Button>
      </div>

      {!hasSetup && userEmail && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">
            <ShieldCheck className="inline mr-1 h-3 w-3" />
            Configura autenticación biométrica después del primer inicio de sesión
          </p>
        </div>
      )}

      {hasSetup && (
        <div className="text-center">
          <p className="text-xs text-green-600">
            <ShieldCheck className="inline mr-1 h-3 w-3" />
            Autenticación biométrica configurada
          </p>
        </div>
      )}
    </div>
  );
}