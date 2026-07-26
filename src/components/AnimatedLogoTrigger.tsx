import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

export function AnimatedLogoTrigger() {
  const { toggleSidebar, open } = useSidebar();
  const { userProfile } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <div className="flex items-center gap-3 p-2">
      <button
        onClick={toggleSidebar}
        className="group relative p-2 hover:bg-primary/5 rounded-lg transition-all duration-300"
        aria-label="Toggle sidebar"
      >
        <img 
          src="/__l5e/assets-v1/30f1f077-4c41-44bd-9b74-0f1051f26bd1/arcana-logo.png" 
          alt="ARCANA Logo" 
          className={`h-8 w-8 object-cover rounded-2xl transition-all duration-500 ${
            open 
              ? 'opacity-100 scale-100 rotate-0' 
              : 'opacity-90 scale-95 group-hover:scale-110 group-hover:rotate-12'
          } group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]`}
        />
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
      </button>
      
      {!isMobile && (
        <span className="text-sm font-medium text-foreground">
          {userProfile?.full_name?.split(' ')[0] || 'Usuario'}
        </span>
      )}
    </div>
  );
}
