import { useSidebar } from "@/components/ui/sidebar";

export function AnimatedLogoTrigger() {
  const { toggleSidebar, open } = useSidebar();
  
  return (
    <button
      onClick={toggleSidebar}
      className="group relative p-2 hover:bg-primary/5 rounded-lg transition-all duration-300"
      aria-label="Toggle sidebar"
    >
      <img 
        src="/lovable-uploads/a58d8d74-4ced-444f-b402-8a028fc7f65e.png" 
        alt="ARCANA Logo" 
        className={`h-8 w-auto transition-all duration-500 ${
          open 
            ? 'opacity-100 scale-100 rotate-0' 
            : 'opacity-90 scale-95 group-hover:scale-110 group-hover:rotate-12'
        } group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]`}
      />
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
    </button>
  );
}
