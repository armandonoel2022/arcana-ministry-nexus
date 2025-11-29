import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";

export function AnimatedLogoTrigger() {
  const { toggleSidebar, open, isMobile } = useSidebar();
  const { userProfile } = useAuth();
  
  return (
    <div className="flex items-center justify-between w-full px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="group relative p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300 flex items-center gap-2"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          <div className="relative">
            <img 
              src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" 
              alt="ARCANA Logo" 
              className={`h-10 w-10 object-cover rounded-2xl transition-all duration-500 ${
                open 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-90 scale-95 group-hover:scale-105'
              } group-hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]`}
            />
            
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-blue-500/30 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg -z-10" />
          </div>
          
          {/* Menú icon indicator */}
          <div className="flex items-center gap-1">
            {open ? (
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            )}
          </div>
        </button>
        
        {!isMobile && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {userProfile?.full_name?.split(' ')[0] || 'Usuario'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {open ? 'Cerrar menú' : 'Abrir menú'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
