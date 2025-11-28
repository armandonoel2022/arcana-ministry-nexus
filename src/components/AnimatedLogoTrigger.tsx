import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

export function AnimatedLogoTrigger() {
  const { toggleSidebar, open, state } = useSidebar();
  const { userProfile } = useAuth();
  const isMobile = useIsMobile();
  
  const isExpanded = state === "expanded";
  
  return (
    <div className="flex items-center gap-3 p-2">
      <button
        onClick={toggleSidebar}
        className="group relative p-2 hover:bg-primary/5 rounded-lg transition-all duration-300 animate-scale-in"
        aria-label="Toggle sidebar"
        title={isExpanded ? "Minimizar menú" : "Expandir menú"}
      >
        <img 
          src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" 
          alt="ARCANA Logo" 
          className={`h-8 w-8 object-cover rounded-2xl transition-all duration-500 ${
            isExpanded 
              ? 'opacity-100 scale-100 rotate-0' 
              : 'opacity-90 scale-95 group-hover:scale-110 group-hover:rotate-12'
          } group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]`}
        />
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
        
        {/* Ripple effect on click */}
        <div className="absolute inset-0 rounded-lg bg-primary/20 scale-0 group-active:scale-100 transition-transform duration-200" />
      </button>
      
      {!isMobile && (
        <span className={`text-sm font-medium text-foreground transition-all duration-300 ${
          isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
        }`}>
          {userProfile?.full_name?.split(' ')[0] || 'Usuario'}
        </span>
      )}
    </div>
  );
}
