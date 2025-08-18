import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Music, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/');
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('¡Bienvenido a ARCANA!');
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;
      
      toast.success('¡Solicitud de registro enviada! El administrador revisará tu cuenta y te contactará con una contraseña provisional.');
    } catch (error: any) {
      toast.error(error.message || 'Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Por favor ingresa tu email');
      return;
    }

    try {
      // Create password reset request that notifies admin
      const { error } = await supabase
        .from('password_reset_requests')
        .insert([
          {
            user_email: email,
            requested_by: null,
            admin_notified: false
          }
        ]);

      if (error) throw error;

      // Send notification to admin
      const { error: notificationError } = await supabase
        .from('system_notifications')
        .insert([
          {
            type: 'password_reset_request',
            title: 'Solicitud de Restablecimiento de Contraseña',
            message: `El usuario ${email} ha solicitado restablecer su contraseña.`,
            recipient_id: null, // Admin notification
            notification_category: 'admin'
          }
        ]);

      if (notificationError) {
        console.error('Error sending admin notification:', notificationError);
      }

      toast.success('Solicitud enviada. El administrador será notificado para generar una contraseña provisional.');
    } catch (error: any) {
      toast.error('Error al solicitar restablecimiento: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-modern-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <Card className="w-full max-w-md relative z-10 modern-glass border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-28 h-28 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border-4 border-white/20 shadow-xl">
            <img 
              src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" 
              alt="ARCANA Logo" 
              className="w-20 h-20 object-cover rounded-2xl"
            />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-white mb-2">
              ARCANA
            </CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              Sistema de Gestión Musical
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20">
              <TabsTrigger value="signin" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-100" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-100 focus:border-white/40 focus:ring-white/40"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-white">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-100" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-blue-100 focus:border-white/40 focus:ring-white/40"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-blue-100" />
                      ) : (
                        <Eye className="h-4 w-4 text-blue-100" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleForgotPassword}
                    className="text-blue-100 hover:text-white text-sm p-0 h-auto"
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold rounded-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-white">Nombre Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-blue-100" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-100 focus:border-white/40 focus:ring-white/40"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-blue-100" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-100 focus:border-white/40 focus:ring-white/40"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-white">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-blue-100" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-blue-100 focus:border-white/40 focus:ring-white/40"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-blue-100" />
                      ) : (
                        <Eye className="h-4 w-4 text-blue-100" />
                      )}
                    </Button>
                  </div>
                  <p className="text-blue-100 text-xs">
                    Los nuevos usuarios requieren aprobación del administrador antes de poder acceder al sistema.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold rounded-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creando cuenta...' : 'Solicitar Registro'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;