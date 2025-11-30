import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export function SwipeIndicator() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide after 8 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed left-0 top-20 z-40 pointer-events-none lg:hidden">
      <div className="relative flex items-center animate-pulse">
        {/* Swipe indicator tab - más visible */}
        <div className="w-2 h-20 bg-gradient-to-b from-primary/40 via-primary to-primary/40 rounded-r-lg shadow-lg" />
        
        {/* Arrow with glow */}
        <div className="absolute left-2 flex items-center">
          <ChevronRight className="w-6 h-6 text-white drop-shadow-lg animate-bounce-horizontal" />
        </div>
        
        {/* Hint text */}
        <div className="absolute left-10 bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs font-medium shadow-lg whitespace-nowrap">
          Desliza para abrir
        </div>
      </div>
    </div>
  );
}
