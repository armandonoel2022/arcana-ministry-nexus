import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Music, X } from "lucide-react";

interface SongLimitOverlayProps {
  songCount: number;
  serviceName: string;
  onClose: () => void;
}

export const SongLimitOverlay = ({ songCount, serviceName, onClose }: SongLimitOverlayProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Auto-close after 10 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  if (!show) return null;

  const getMessage = () => {
    switch (songCount) {
      case 4:
        return {
          icon: <AlertCircle className="w-8 h-8 text-amber-500" />,
          title: "Tiempo de Adoración Completo",
          description: "Has agregado 4 canciones que completan el tiempo usual de adoración.",
          nextStep: "La siguiente canción será para el momento de ofrendas.",
          bgColor: "from-amber-50 to-orange-50",
          borderColor: "border-amber-300"
        };
      case 5:
        return {
          icon: <Music className="w-8 h-8 text-blue-500" />,
          title: "Canción de Ofrendas Agregada",
          description: "Esta es la canción designada para el momento de ofrendas.",
          nextStep: "Si agregas otra canción, será para el momento de Santa Comunión.",
          bgColor: "from-blue-50 to-indigo-50",
          borderColor: "border-blue-300"
        };
      case 6:
        return {
          icon: <CheckCircle className="w-8 h-8 text-purple-500" />,
          title: "Canción de Comunión Agregada",
          description: "Esta es la canción designada para el momento de Santa Comunión.",
          nextStep: "El repertorio para este servicio está completo.",
          bgColor: "from-purple-50 to-pink-50",
          borderColor: "border-purple-300"
        };
      default:
        return null;
    }
  };

  const messageData = getMessage();
  if (!messageData) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <Card 
        className={`w-[90%] max-w-md bg-gradient-to-br ${messageData.bgColor} border-2 ${messageData.borderColor} shadow-2xl transform transition-all duration-300 ${show ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            {messageData.icon}
            <div>
              <CardTitle className="text-xl">{messageData.title}</CardTitle>
              <CardDescription className="text-sm mt-1 text-muted-foreground">
                Servicio: {serviceName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {messageData.description}
            </p>
            <div className="bg-white/50 rounded-lg p-3 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong>Siguiente paso:</strong> {messageData.nextStep}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Music className="w-4 h-4" />
              <span>{songCount} {songCount === 1 ? 'canción' : 'canciones'} agregadas</span>
            </div>
            <Button
              onClick={handleClose}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              Entendido
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
