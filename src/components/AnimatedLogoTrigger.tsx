import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu, X } from "lucide-react";

export function AnimatedLogoTrigger() {
  const { open, setOpen, isMobile } = useSidebar();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 z-10"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        {open ? <X className="h-4 w-4 text-gray-700" /> : <Menu className="h-4 w-4 text-gray-700" />}
      </Button>

      {/* Efecto que se expande fuera del botón pero con containimiento */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 -inset-1 blur-sm -z-10" />
    </div>
  );
}
