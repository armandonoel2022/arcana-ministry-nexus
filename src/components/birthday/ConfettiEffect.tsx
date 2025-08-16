import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ trigger, onComplete }) => {
  useEffect(() => {
    if (trigger) {
      // Configuración del confeti para cumpleaños
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999
      };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
          spread: 100,
          startVelocity: 30,
          colors: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#32CD32', '#DA70D6']
        });
      }

      // Crear múltiples ráfagas de confeti
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fire(0.2, {
        spread: 60,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });

      // Llamar onComplete después de la animación
      if (onComplete) {
        setTimeout(onComplete, 3000);
      }
    }
  }, [trigger, onComplete]);

  return null; // Este componente no renderiza nada visible
};

export default ConfettiEffect;