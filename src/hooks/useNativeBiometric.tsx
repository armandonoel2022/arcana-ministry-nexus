import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

// Types for the native biometric plugin
interface BiometricOptions {
  reason?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  maxAttempts?: number;
  useFallback?: boolean;
}

interface CredentialOptions {
  username: string;
  password: string;
  server: string;
}

// Check if we're on a native platform
const isNative = Capacitor.isNativePlatform();

// Dynamic import for native biometric plugin
let NativeBiometric: any = null;

if (isNative) {
  import('@capgo/capacitor-native-biometric').then(module => {
    NativeBiometric = module.NativeBiometric;
  }).catch(err => {
    console.log('Native biometric plugin not available:', err);
  });
}

export type BiometricType = 'none' | 'fingerprint' | 'face' | 'iris' | 'multiple';

export function useNativeBiometric() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometricType>('none');
  const [isLoading, setIsLoading] = useState(false);

  // Check if biometric authentication is available
  const checkAvailability = useCallback(async () => {
    if (!isNative || !NativeBiometric) {
      setIsAvailable(false);
      setBiometryType('none');
      return { isAvailable: false, biometryType: 'none' as BiometricType };
    }

    try {
      const result = await NativeBiometric.isAvailable();
      setIsAvailable(result.isAvailable);
      setBiometryType(result.biometryType || 'none');
      return { isAvailable: result.isAvailable, biometryType: result.biometryType || 'none' };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
      setBiometryType('none');
      return { isAvailable: false, biometryType: 'none' as BiometricType };
    }
  }, []);

  // Verify user identity with biometrics
  const verifyIdentity = useCallback(async (options?: BiometricOptions): Promise<boolean> => {
    if (!isNative || !NativeBiometric) {
      toast.error('Autenticación biométrica no disponible');
      return false;
    }

    setIsLoading(true);
    try {
      await NativeBiometric.verifyIdentity({
        reason: options?.reason || 'Verificar identidad',
        title: options?.title || 'Autenticación biométrica',
        subtitle: options?.subtitle || 'ARCANA',
        description: options?.description || 'Usa tu huella o Face ID para continuar',
        maxAttempts: options?.maxAttempts || 3,
        useFallback: options?.useFallback ?? true,
      });
      return true;
    } catch (error: any) {
      console.error('Biometric verification failed:', error);
      if (error.message?.includes('cancelled') || error.code === 10) {
        toast.info('Autenticación cancelada');
      } else if (error.message?.includes('locked') || error.code === 11) {
        toast.error('Biometría bloqueada. Intenta de nuevo más tarde');
      } else {
        toast.error('Error en autenticación biométrica');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Store credentials securely
  const setCredentials = useCallback(async (options: CredentialOptions): Promise<boolean> => {
    if (!isNative || !NativeBiometric) {
      // Fallback to localStorage for web
      try {
        localStorage.setItem(`biometric_creds_${options.server}`, JSON.stringify({
          username: options.username,
          // Note: In production, never store plain passwords - this is for demo
          passwordHash: btoa(options.password),
        }));
        return true;
      } catch (error) {
        console.error('Error storing credentials:', error);
        return false;
      }
    }

    try {
      await NativeBiometric.setCredentials({
        username: options.username,
        password: options.password,
        server: options.server,
      });
      return true;
    } catch (error) {
      console.error('Error storing credentials:', error);
      return false;
    }
  }, []);

  // Get stored credentials
  const getCredentials = useCallback(async (server: string): Promise<{ username: string; password: string } | null> => {
    if (!isNative || !NativeBiometric) {
      // Fallback to localStorage for web
      try {
        const stored = localStorage.getItem(`biometric_creds_${server}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            username: parsed.username,
            password: atob(parsed.passwordHash),
          };
        }
        return null;
      } catch (error) {
        console.error('Error getting credentials:', error);
        return null;
      }
    }

    try {
      const credentials = await NativeBiometric.getCredentials({ server });
      return credentials;
    } catch (error) {
      console.error('Error getting credentials:', error);
      return null;
    }
  }, []);

  // Delete stored credentials
  const deleteCredentials = useCallback(async (server: string): Promise<boolean> => {
    if (!isNative || !NativeBiometric) {
      try {
        localStorage.removeItem(`biometric_creds_${server}`);
        return true;
      } catch (error) {
        console.error('Error deleting credentials:', error);
        return false;
      }
    }

    try {
      await NativeBiometric.deleteCredentials({ server });
      return true;
    } catch (error) {
      console.error('Error deleting credentials:', error);
      return false;
    }
  }, []);

  // Check if credentials exist
  const hasCredentials = useCallback(async (server: string): Promise<boolean> => {
    const creds = await getCredentials(server);
    return creds !== null;
  }, [getCredentials]);

  // Initialize on mount
  useEffect(() => {
    // Wait for NativeBiometric to be loaded
    const timer = setTimeout(() => {
      checkAvailability();
    }, 100);
    return () => clearTimeout(timer);
  }, [checkAvailability]);

  return {
    isAvailable,
    biometryType,
    isLoading,
    isNative,
    checkAvailability,
    verifyIdentity,
    setCredentials,
    getCredentials,
    deleteCredentials,
    hasCredentials,
  };
}

// Helper to get biometry type label in Spanish
export function getBiometryLabel(type: BiometricType): string {
  switch (type) {
    case 'fingerprint':
      return 'Huella dactilar';
    case 'face':
      return 'Face ID';
    case 'iris':
      return 'Reconocimiento de iris';
    case 'multiple':
      return 'Biométrico múltiple';
    default:
      return 'No disponible';
  }
}
