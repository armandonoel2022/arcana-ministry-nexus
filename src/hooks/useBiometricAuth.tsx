import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BiometricCredential {
  id: string;
  publicKey: string;
  userId: string;
}

export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check if WebAuthn is supported - run once on mount
  const checkSupport = useCallback(() => {
    const supported = !!(window.PublicKeyCredential && navigator.credentials);
    setIsSupported(supported);
    return supported;
  }, []);

  // Initialize support check on mount
  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  // Register biometric credential
  const registerBiometric = useCallback(async (userEmail: string, userId: string) => {
    if (!isSupported) { // Use the state value instead of calling checkSupport()
      toast.error('La autenticación biométrica no es compatible con este navegador');
      return false;
    }

    setIsLoading(true);
    try {
      // Generate challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "ARCANA",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userEmail,
          displayName: userEmail,
        },
        pubKeyCredParams: [
          {
            alg: -7, // ES256 algorithm
            type: "public-key",
          },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Built-in authenticators
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "direct",
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('No se pudo crear la credencial biométrica');
      }

      // Store credential info (in a real app, you'd send this to your server)
      const response = credential.response as AuthenticatorAttestationResponse;
      const publicKeyBytes = response.getPublicKey();
      const credentialData: BiometricCredential = {
        id: credential.id,
        publicKey: publicKeyBytes ? btoa(String.fromCharCode(...new Uint8Array(publicKeyBytes))) : '',
        userId,
      };

      // Store in localStorage for demo purposes
      // In production, this would be stored securely on the server
      localStorage.setItem(`biometric_${userEmail}`, JSON.stringify(credentialData));

      toast.success('Autenticación biométrica configurada correctamente');
      return true;
    } catch (error: any) {
      console.error('Error registering biometric:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Acceso denegado por el usuario');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Autenticación biométrica no soportada');
      } else {
        toast.error('Error al configurar autenticación biométrica: ' + error.message);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]); // Updated dependency

  // Authenticate with biometric
  const authenticateBiometric = useCallback(async (userEmail: string) => {
    if (!isSupported) { // Use the state value instead of calling checkSupport()
      toast.error('La autenticación biométrica no es compatible con este navegador');
      return false;
    }

    setIsLoading(true);
    try {
      // Check if user has biometric credential
      const storedCredential = localStorage.getItem(`biometric_${userEmail}`);
      if (!storedCredential) {
        toast.error('No se encontró configuración biométrica para este usuario');
        return false;
      }

      const credentialData: BiometricCredential = JSON.parse(storedCredential);

      // Generate challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [
          {
            id: new TextEncoder().encode(credentialData.id),
            type: "public-key",
          },
        ],
        userVerification: "required",
        timeout: 60000,
      };

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('No se pudo autenticar con biometría');
      }

      // In a real app, you would verify the signature on the server
      // For this demo, we'll assume success and sign in the user
      
      // Sign in with Supabase (you might need to implement a custom auth flow)
      // For now, we'll just show success - in production you'd need a backend endpoint
      // that verifies the biometric authentication and returns a session token
      
      toast.success('Autenticación biométrica exitosa');
      return true;
    } catch (error: any) {
      console.error('Error authenticating biometric:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Acceso biométrico denegado');
      } else if (error.name === 'InvalidStateError') {
        toast.error('Error de estado en autenticación biométrica');
      } else {
        toast.error('Error en autenticación biométrica: ' + error.message);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]); // Updated dependency

  // Check if user has biometric setup - memoized to prevent infinite re-renders
  const hasBiometric = useCallback((userEmail: string) => {
    return !!localStorage.getItem(`biometric_${userEmail}`);
  }, []);

  return {
    isSupported, // Return the state value, not the function call!
    isLoading,
    registerBiometric,
    authenticateBiometric,
    hasBiometric,
  };
}