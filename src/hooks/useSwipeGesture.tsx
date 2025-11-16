import { useEffect } from 'react';

interface SwipeGestureOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  minSwipeDistance?: number;
  edgeThreshold?: number;
}

export const useSwipeGesture = ({
  onSwipeRight,
  onSwipeLeft,
  minSwipeDistance = 100,
  edgeThreshold = 30,
}: SwipeGestureOptions) => {
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwipeFromEdge = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      
      // Detectar si el toque inició desde el borde izquierdo
      isSwipeFromEdge = touch.clientX < edgeThreshold;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const deltaTime = touchEndTime - touchStartTime;

      // Verificar que sea un deslizamiento horizontal rápido
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      const isFastSwipe = deltaTime < 300;

      if (isHorizontalSwipe && isFastSwipe && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && isSwipeFromEdge && onSwipeRight) {
          // Deslizamiento hacia la derecha desde el borde izquierdo
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          // Deslizamiento hacia la izquierda
          onSwipeLeft();
        }
      }
    };

    // Solo en dispositivos táctiles
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [onSwipeRight, onSwipeLeft, minSwipeDistance, edgeThreshold]);
};
