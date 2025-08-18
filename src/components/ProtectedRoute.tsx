import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, UserX, Clock } from 'lucide-react';
import PasswordChangePrompt from '@/components/admin/PasswordChangePrompt';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, needsPasswordChange, isApproved } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user is approved
  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Cuenta Pendiente de Aprobación
          </h2>
          <p className="text-gray-600 mb-4">
            Tu solicitud de registro está siendo revisada por el administrador. 
            Recibirás una notificación cuando tu cuenta sea aprobada y se te proporcionará 
            una contraseña provisional.
          </p>
          <p className="text-sm text-gray-500">
            Puedes cerrar sesión y volver más tarde.
          </p>
        </div>
      </div>
    );
  }

  // Check if user needs to change password
  if (needsPasswordChange) {
    return (
      <PasswordChangePrompt 
        onPasswordChanged={() => window.location.reload()} 
      />
    );
  }

  return <>{children}</>;
};