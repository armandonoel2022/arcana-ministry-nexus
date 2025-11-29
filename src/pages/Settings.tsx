import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";
import { BiometricSetup } from "@/components/BiometricSetup";
import { PushNotificationSettings } from "@/components/settings/PushNotificationSettings";

const Settings = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-blue-400">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <SettingsIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Configuración</h1>
              <p className="text-white/90 text-lg drop-shadow-md">Personaliza tu experiencia en ARCANA</p>
            </div>
          </div>
        </div>

        {/* Settings Cards */}
        <div className="space-y-6">
          {/* Push Notifications */}
          <PushNotificationSettings />

          {/* Theme Selector */}
          <Card className="bg-white shadow-xl">
            <CardHeader>
              <CardTitle>Tema de la Aplicación</CardTitle>
              <CardDescription>
                Selecciona el tema que prefieres para la interfaz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector />
            </CardContent>
          </Card>

          {/* Biometric Authentication */}
          <Card className="bg-white shadow-xl">
            <CardHeader>
              <CardTitle>Autenticación Biométrica</CardTitle>
              <CardDescription>
                Configura el acceso mediante huella digital o reconocimiento facial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BiometricSetup />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
