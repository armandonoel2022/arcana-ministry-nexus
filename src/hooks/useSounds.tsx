import { useRef, useCallback } from 'react';

export type SoundType = 'notification' | 'alert' | 'msn';

export const useSounds = () => {
  const audioRefs = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

  // Precargar sonidos
  const preloadSounds = useCallback(() => {
    const sounds: { type: SoundType; src: string }[] = [
      { type: 'notification', src: '/sounds/notification.mp3' },
      { type: 'alert', src: '/sounds/alert.mp3' },
      { type: 'msn', src: '/sounds/msn-sound.mp3' },
    ];

    sounds.forEach(({ type, src }) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audioRefs.current.set(type, audio);
    });
  }, []);

  // Reproducir sonido
  const playSound = useCallback((type: SoundType, volume: number = 0.7) => {
    const audio = audioRefs.current.get(type);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.currentTime = 0; // Reiniciar si ya está reproduciéndose
      
      // Usar play() con manejo de errores
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`Error reproduciendo sonido ${type}:`, error);
        });
      }
    } else {
      console.warn(`Sonido ${type} no encontrado`);
    }
  }, []);

  // Detener sonido
  const stopSound = useCallback((type: SoundType) => {
    const audio = audioRefs.current.get(type);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  // Vibrar (para dispositivos móviles)
  const vibrate = useCallback((pattern: number | number[] = 200) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Combinar sonido y vibración
  const playNotification = useCallback((type: SoundType = 'notification') => {
    playSound(type);
    vibrate([100, 50, 100]); // Patrón de vibración: vibrar, pausa, vibrar
  }, [playSound, vibrate]);

  return {
    preloadSounds,
    playSound,
    stopSound,
    playNotification,
    vibrate,
  };
};
