import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Church,
  Users,
  Heart,
  Download,
} from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface QuarantineServiceOverlayProps {
  forceShow?: boolean;
  onClose?: () => void;
  serviceDate?: string;
  serviceTime?: string;
  serviceDay?: "wednesday" | "saturday";
  location?: string;
  specialMessage?: string;
}

// Fechas de la cuarentena
const QUARANTINE_START = new Date("2025-01-12");
const QUARANTINE_END = new Date("2025-02-21");

const QuarantineServiceOverlay: React.FC<QuarantineServiceOverlayProps> = ({
  forceShow = false,
  onClose,
  serviceDate,
  serviceTime = "7:00 PM",
  serviceDay,
  location = "Templo Principal",
  specialMessage,
}) => {
  const [isVisible, setIsVisible] = useState(forceShow);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [nextService, setNextService] = useState<{
    date: Date;
    dayName: string;
    isWednesday: boolean;
  } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Determinar el próximo servicio de cuarentena (miércoles o sábado)
  useEffect(() => {
    const findNextQuarantineService = () => {
      const now = new Date();
      const dominicanTime = new Date(
        now.toLocaleString("en-US", { timeZone: "America/Santo_Domingo" })
      );

      // Si ya pasó la cuarentena, no mostrar
      if (dominicanTime > QUARANTINE_END) {
        console.log("📅 [QuarantineOverlay] La cuarentena ya terminó");
        return null;
      }

      // Buscar el próximo miércoles o sábado
      let checkDate = new Date(dominicanTime);
      
      // Si es después de las 8pm, empezar desde mañana
      if (dominicanTime.getHours() >= 20) {
        checkDate.setDate(checkDate.getDate() + 1);
      }

      for (let i = 0; i < 7; i++) {
        const dayOfWeek = checkDate.getDay();
        
        // Miércoles = 3, Sábado = 6
        if (dayOfWeek === 3 || dayOfWeek === 6) {
          // Verificar que esté dentro del período de cuarentena
          if (
            isWithinInterval(checkDate, {
              start: QUARANTINE_START,
              end: QUARANTINE_END,
            })
          ) {
            return {
              date: checkDate,
              dayName: dayOfWeek === 3 ? "Miércoles" : "Sábado",
              isWednesday: dayOfWeek === 3,
            };
          }
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }

      return null;
    };

    const service = findNextQuarantineService();
    setNextService(service);

    if (forceShow || service) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 100);
    }
  }, [forceShow]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const handleDownload = async () => {
    if (!contentRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const dateStr = serviceDate 
        ? format(parseISO(serviceDate), "yyyy-MM-dd")
        : nextService 
        ? format(nextService.date, "yyyy-MM-dd")
        : "cuarentena";
      
      const link = document.createElement('a');
      link.download = `servicio-cuarentena-${dateStr}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Imagen descargada exitosamente');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Error al descargar la imagen');
    } finally {
      setIsDownloading(false);
    }
  };

  // Calcular días restantes de cuarentena
  const getDaysRemaining = () => {
    const now = new Date();
    const dominicanTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Santo_Domingo" })
    );
    const diffTime = QUARANTINE_END.getTime() - dominicanTime.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (!isVisible) return null;

  const displayDate = serviceDate
    ? format(parseISO(serviceDate), "EEEE, d 'de' MMMM", { locale: es })
    : nextService
    ? format(nextService.date, "EEEE, d 'de' MMMM", { locale: es })
    : "";

  const displayDayType = serviceDay === "wednesday" || nextService?.isWednesday
    ? "Miércoles"
    : "Sábado";

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-3 transition-all duration-300 ${
        isAnimating ? "bg-black/80 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <Card
        className={`w-full max-w-sm transform transition-all duration-500 overflow-hidden ${
          isAnimating
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          border: "2px solid rgba(255, 193, 7, 0.3)",
          boxShadow: "0 0 40px rgba(255, 193, 7, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Botones de acción fuera del área de descarga */}
        {!isDownloading && (
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <button
              onClick={handleDownload}
              className="p-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
              aria-label="Descargar"
            >
              <Download className="w-4 h-4 text-amber-400" />
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Contenido descargable */}
        <div ref={contentRef} className="p-4">
          {/* Header con badge de cuarentena */}
          <div className="relative pb-2">
            {/* Badge de cuarentena */}
            <div className="flex items-center justify-center mb-3">
              <Badge
                className="px-3 py-1 text-xs font-semibold"
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "#1a1a2e",
                  border: "none",
                }}
              >
                <AlertTriangle className="h-3 w-3 mr-1.5" />
                PERÍODO DE CUARENTENA
              </Badge>
            </div>

            {/* Icono principal */}
            <div className="flex justify-center mb-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(255,193,7,0.3) 0%, rgba(255,152,0,0.2) 100%)",
                  border: "2px solid rgba(255,193,7,0.5)",
                }}
              >
                <Church className="h-7 w-7 text-amber-400" />
              </div>
            </div>

            {/* Título */}
            <h2 className="text-lg font-bold text-center text-white mb-0.5">
              Servicio de {displayDayType}
            </h2>
            <p className="text-center text-amber-300/80 text-xs">
              Culto especial durante la cuarentena
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {/* Información del servicio */}
            <div
              className="rounded-lg p-3 space-y-2.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,193,7,0.2)",
              }}
            >
              {/* Fecha */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,193,7,0.2)" }}
                >
                  <Calendar className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/60 text-[10px] uppercase tracking-wide">
                    Fecha
                  </p>
                  <p className="text-white font-semibold text-sm capitalize truncate">
                    {displayDate}
                  </p>
                </div>
              </div>

              {/* Hora */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,193,7,0.2)" }}
                >
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-white/60 text-[10px] uppercase tracking-wide">
                    Hora
                  </p>
                  <p className="text-white font-semibold text-sm">{serviceTime}</p>
                </div>
              </div>

              {/* Ubicación */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,193,7,0.2)" }}
                >
                  <MapPin className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-white/60 text-[10px] uppercase tracking-wide">
                    Lugar
                  </p>
                  <p className="text-white font-semibold text-sm">{location}</p>
                </div>
              </div>
            </div>

            {/* Mensaje especial o información de cuarentena */}
            <div
              className="rounded-lg p-3 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(220,38,38,0.05) 100%)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <Heart className="h-3.5 w-3.5 text-red-400" />
                <span className="text-red-300 font-semibold text-xs">
                  Información Importante
                </span>
              </div>
              <p className="text-white/80 text-xs leading-relaxed">
                {specialMessage ||
                  `Durante el período de cuarentena (12 de enero - 21 de febrero), 
                  los servicios se realizan los miércoles y sábados a las 7:00 p.m.`}
              </p>
            </div>

            {/* Días restantes de cuarentena */}
            <div className="flex items-center justify-center gap-1.5 py-1">
              <Users className="h-3.5 w-3.5 text-amber-400/70" />
              <span className="text-white/60 text-xs">
                {getDaysRemaining()} días restantes de cuarentena
              </span>
            </div>
          </div>
        </div>

        {/* Botón de confirmación fuera del área de descarga */}
        {!isDownloading && (
          <div className="px-4 pb-4">
            <Button
              onClick={handleClose}
              className="w-full py-2.5 font-semibold text-sm"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#1a1a2e",
                border: "none",
              }}
            >
              Entendido
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default QuarantineServiceOverlay;
