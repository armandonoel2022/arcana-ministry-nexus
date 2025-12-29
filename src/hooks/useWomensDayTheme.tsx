import { useState, useEffect, useMemo } from 'react';

export function useWomensDayTheme() {
  const [isWomensDay, setIsWomensDay] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const checkWomensDay = () => {
      const now = new Date();
      const month = now.getMonth(); // 0-indexed (March = 2)
      const day = now.getDate();
      
      // March 8th
      const isDay = month === 2 && day === 8;
      setIsWomensDay(isDay);

      // Check if we've shown the overlay today
      if (isDay) {
        const overlayShownKey = `womens_day_overlay_${now.getFullYear()}`;
        const wasShown = localStorage.getItem(overlayShownKey);
        
        if (!wasShown) {
          // Show overlay after a brief delay
          setTimeout(() => setShowOverlay(true), 2000);
        }
      }
    };

    checkWomensDay();

    // Check every hour in case date changes while app is open
    const interval = setInterval(checkWomensDay, 3600000);
    return () => clearInterval(interval);
  }, []);

  const dismissOverlay = () => {
    const now = new Date();
    const overlayShownKey = `womens_day_overlay_${now.getFullYear()}`;
    localStorage.setItem(overlayShownKey, 'true');
    setShowOverlay(false);
  };

  // CSS variables for pink theme
  const themeStyles = useMemo(() => {
    if (!isWomensDay) return null;

    return {
      '--primary': '330 80% 55%',
      '--primary-foreground': '0 0% 100%',
      '--accent': '330 60% 45%',
    };
  }, [isWomensDay]);

  return {
    isWomensDay,
    showOverlay,
    dismissOverlay,
    themeStyles,
  };
}
