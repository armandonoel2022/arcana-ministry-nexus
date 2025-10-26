import { useEffect, useState } from 'react';
import arcanaAvatarImage from '@/assets/arcana-avatar.png';

interface ArcanaAvatarProps {
  isActive: boolean;
  expression?: 'greeting' | 'thinking' | 'happy' | 'idle';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const ArcanaAvatar = ({ 
  isActive, 
  expression = 'idle',
  position = 'bottom-right' 
}: ArcanaAvatarProps) => {
  const [show, setShow] = useState(false);
  const [floatOffset, setFloatOffset] = useState(0);

  useEffect(() => {
    if (isActive) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  // Animación de flotación
  useEffect(() => {
    if (!show) return;
    
    const interval = setInterval(() => {
      setFloatOffset(prev => (prev + 1) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [show]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-24 left-4',
    'bottom-right': 'bottom-24 right-4',
  };

  const getExpressionStyle = () => {
    switch (expression) {
      case 'greeting':
        return 'animate-bounce';
      case 'thinking':
        return 'animate-pulse';
      case 'happy':
        return 'scale-110';
      default:
        return '';
    }
  };

  const floatY = Math.sin(floatOffset * 0.05) * 10;

  if (!show) return null;

  return (
    <div 
      className={`
        fixed z-50 
        ${positionClasses[position]}
        transition-all duration-500 ease-out
        ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
      `}
      style={{
        transform: `translateY(${floatY}px)`,
      }}
    >
      <div className={`
        relative w-24 h-24 
        ${getExpressionStyle()}
        transition-transform duration-300
      `}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-purple-400/30 rounded-full blur-xl animate-pulse" />
        
        {/* Avatar container */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-br from-purple-100 to-blue-100">
          <img 
            src={arcanaAvatarImage} 
            alt="ARCANA Avatar" 
            className="w-full h-full object-cover"
            style={{
              clipPath: expression === 'happy' 
                ? 'polygon(33% 0%, 67% 0%, 100% 50%, 67% 100%, 33% 100%, 0% 50%)' 
                : 'circle(50%)'
            }}
          />
        </div>

        {/* Pensando dots */}
        {expression === 'thinking' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-white rounded-full px-3 py-1 shadow-lg">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        {/* Saludo wave */}
        {expression === 'greeting' && (
          <div className="absolute -top-2 -right-2 text-3xl animate-wave origin-bottom-right">
            👋
          </div>
        )}

        {/* Sparkles para happy */}
        {expression === 'happy' && (
          <>
            <div className="absolute -top-1 -left-1 text-xl animate-ping">✨</div>
            <div className="absolute -top-1 -right-1 text-xl animate-ping" style={{ animationDelay: '150ms' }}>✨</div>
            <div className="absolute -bottom-1 left-1/2 text-xl animate-ping" style={{ animationDelay: '300ms' }}>⭐</div>
          </>
        )}
      </div>

      {/* Speech bubble tooltip */}
      {isActive && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-fade-in">
            {expression === 'greeting' && '¡Hola! 👋'}
            {expression === 'thinking' && 'Procesando...'}
            {expression === 'happy' && '¡Listo! ✨'}
            {expression === 'idle' && 'Estoy aquí'}
          </div>
        </div>
      )}
    </div>
  );
};
