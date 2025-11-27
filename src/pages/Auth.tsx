import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { BiometricAuthSection } from '@/components/BiometricAuthSection';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [showSwipeMenu, setShowSwipeMenu] = useState(false);
  const [startY, setStartY] = useState(0);
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
      const genericPassword = 'ADN_2025';
      
      const { error } = await supabase.auth.signUp({
        email,
        password: genericPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;
      
      toast.success('¡Registro exitoso! Usa la contraseña "ADN_2025" para iniciar sesión.');
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

      const { error: notificationError } = await supabase
        .from('system_notifications')
        .insert([
          {
            type: 'password_reset_request',
            title: 'Solicitud de Restablecimiento de Contraseña',
            message: `El usuario ${email} ha solicitado restablecer su contraseña.`,
            recipient_id: null,
            notification_category: 'admin'
          }
        ]);

      if (notificationError) {
        console.error('Error sending admin notification:', notificationError);
      }

      toast.success('Solicitud enviada. El administrador será notificado.');
    } catch (error: any) {
      toast.error('Error al solicitar restablecimiento: ' + error.message);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = startY - currentY;
    
    if (diff > 50 && !showSwipeMenu) {
      setShowSwipeMenu(true);
    } else if (diff < -20 && showSwipeMenu) {
      setShowSwipeMenu(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const windowHeight = window.innerHeight;
    const mouseY = e.clientY;
    
    if (mouseY > windowHeight - 100 && !showSwipeMenu) {
      setShowSwipeMenu(true);
    } else if (mouseY < windowHeight - 150 && showSwipeMenu) {
      setShowSwipeMenu(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: "var(--gradient-primary)" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onMouseMove={handleMouseMove}
    >
      {/* Swipe Menu */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm rounded-t-3xl p-6 transform transition-transform duration-300 z-50 ${
          showSwipeMenu ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.2)" }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => {
              navigate('/');
              setShowSwipeMenu(false);
            }}
            className="bg-white hover:bg-gray-50 shadow-md"
          >
            Volver a la Pantalla Principal
          </Button>
        </div>
      </div>

      <div className={`auth-container ${isActive ? 'active' : ''}`}>
        {/* Login Form */}
        <div className="form-box login">
          <form onSubmit={isActive ? handleSignUp : handleSignIn}>
            <div className="text-center mb-6">
              <img 
                src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" 
                alt="ARCANA Logo" 
                className="w-16 h-16 mx-auto mb-4 object-contain"
              />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {isActive ? 'Registrarse' : 'Iniciar Sesión'}
              </h1>
            </div>
            
            {isActive && (
              <div className="input-box">
                <Input
                  type="text"
                  placeholder="Nombre Completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="auth-input"
                />
                <User className="input-icon" />
              </div>
            )}
            
            <div className="input-box">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
              <Mail className="input-icon" />
            </div>
            
            {!isActive && (
              <div className="input-box">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input"
                />
                <Lock className="input-icon" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}

            {isActive && (
              <div className="mb-4">
                <p className="text-blue-600 text-sm font-medium">
                  ℹ️ Contraseña inicial: <span className="font-bold">ADN_2025</span>
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Deberás cambiarla en tu primer inicio de sesión.
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="auth-btn"
              disabled={isLoading}
            >
              {isLoading ? "Cargando..." : (isActive ? "Solicitar Registro" : "Iniciar Sesión")}
            </Button>

            {!isActive && (
              <>
                <BiometricAuthSection userEmail={email} />
                
                <Button
                  type="button"
                  onClick={handleForgotPassword}
                  className="auth-btn-secondary"
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </>
            )}

            <Button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className="auth-btn-secondary"
            >
              {isActive ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </Button>
          </form>
        </div>

        {/* Info Panel */}
        <div className="form-box info">
          <div className="info-content">
            <h1 className="text-3xl font-bold text-white mb-4">¡Bienvenido!</h1>
            <p className="text-white/90 mb-6">
              Sistema de Gestión Musical ARCANA
            </p>
            <p className="text-white/80 text-sm">
              Accede con tus credenciales para gestionar el ministerio de alabanza
            </p>
          </div>
        </div>

        {/* Toggle Background */}
        <div className="toggle-box">
          <div className="toggle-background"></div>
        </div>
      </div>

      <style>{`
        .auth-container {
          position: relative;
          width: 850px;
          height: 550px;
          background: #fff;
          border-radius: 30px;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
          margin: 20px;
          overflow: hidden;
          max-width: 90vw;
        }

        .form-box {
          position: absolute;
          width: 50%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          transition: 0.6s ease-in-out;
        }

        .form-box.login {
          left: 0;
          background: #fff;
          z-index: 2;
        }

        .form-box.info {
          right: 0;
          background: transparent;
          color: #fff;
          z-index: 3;
        }

        .form-box form {
          width: 100%;
          max-width: 300px;
        }

        .input-box {
          position: relative;
          margin: 30px 0;
        }

        .auth-input {
          width: 100%;
          padding: 13px 50px 13px 20px !important;
          background: #eee !important;
          border-radius: 8px !important;
          border: none !important;
          outline: none !important;
          font-size: 16px !important;
          color: #333 !important;
          font-weight: 500 !important;
        }

        .auth-input::placeholder {
          color: #888 !important;
          font-weight: 400 !important;
        }

        .input-icon {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #888;
          pointer-events: none;
        }

        .auth-btn {
          width: 100%;
          height: 48px;
          background: hsl(var(--primary)) !important;
          border-radius: 8px !important;
          box-shadow: var(--shadow-form) !important;
          border: none !important;
          cursor: pointer !important;
          font-size: 16px !important;
          color: hsl(var(--primary-foreground)) !important;
          font-weight: 600 !important;
          margin-top: 20px;
          transition: var(--transition-smooth);
        }

        .auth-btn:hover {
          background: hsl(217 91% 55%) !important;
        }

        .auth-btn-secondary {
          width: 100%;
          height: 40px;
          background: transparent !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          font-size: 12px !important;
          color: hsl(var(--muted-foreground)) !important;
          font-weight: 500 !important;
          margin-top: 15px;
          transition: var(--transition-smooth);
        }

        .auth-btn-secondary:hover {
          background: hsl(var(--muted)/0.1) !important;
        }

        .info-content {
          text-align: center;
          z-index: 5;
          position: relative;
        }

        .toggle-box {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .toggle-background {
          content: '';
          position: absolute;
          right: 0;
          width: 50%;
          height: 100%;
          background: var(--gradient-blue-form);
          z-index: 2;
          transition: 1.8s ease-in-out;
        }

        /* Responsive Design */
        @media screen and (max-width: 768px) {
          .auth-container {
            width: 100%;
            height: 100vh;
            border-radius: 0;
            margin: 0;
          }

          .form-box {
            width: 100%;
            padding: 20px;
          }

          .form-box.login {
            position: relative;
            height: 70%;
            background: #fff;
          }

          .form-box.info {
            position: relative;
            height: 30%;
            background: var(--gradient-blue-form);
          }

          .toggle-background {
            display: none;
          }

          .input-box {
            margin: 20px 0;
          }
        }

        @media screen and (max-width: 400px) {
          .form-box {
            padding: 15px;
          }
          
          .info-content h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default Auth;
