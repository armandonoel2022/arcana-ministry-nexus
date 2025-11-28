import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export function SwipeIndicator() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide after 5 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none md:hidden">
      <div className="relative flex items-center animate-pulse">
        {/* Swipe indicator bar */}
        <div className="w-1 h-16 bg-gradient-to-b from-primary/0 via-primary/60 to-primary/0 rounded-r-full" />
        
        {/* Arrow */}
        <div className="absolute left-1 flex items-center">
          <ChevronRight className="w-4 h-4 text-primary animate-bounce-horizontal" />
        </div>
      </div>
    </div>
  );
}
