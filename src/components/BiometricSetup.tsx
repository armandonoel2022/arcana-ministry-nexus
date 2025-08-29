import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, Scan, Shield, CheckCircle } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useAuth } from '@/hooks/useAuth';

export function BiometricSetup() {
  const { user } = useAuth();
  const { isSupported, isLoading, registerBiometric, hasBiometric } = useBiometricAuth();
  const [isSetup, setIsSetup] = useState(false);

  const handleSetupBiometric = async () => {
    if (!user?.email || !user?.id) return;

    const success = await registerBiometric(user.email, user.id);
    if (success) {
      setIsSetup(true);
    }
  };

  const hasExistingSetup = user?.email ? hasBiometric(user.email) : false;

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Autenticación Biométrica
          </CardTitle>
          <CardDescription>
            Tu navegador no es compatible con autenticación biométrica
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (hasExistingSetup || isSetup) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            Autenticación Biométrica Activa
          </CardTitle>
          <CardDescription className="text-green-700">
            Ya tienes configurada la autenticación biométrica para tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600">
            Puedes usar tu huella dactilar o Face ID para iniciar sesión de forma rápida y segura.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Configurar Autenticación Biométrica
        </CardTitle>
        <CardDescription>
          Agrega una capa extra de seguridad y comodidad a tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <Fingerprint className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-medium">Touch ID</h3>
            <p className="text-sm text-muted-foreground">
              Usa tu huella dactilar
            </p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <Scan className="w-8 h-8 mx-auto mb-2 text-blue-600" />
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