import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
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
  const [nextService, setNextService] = useState<{
    date: Date;
    dayName: string;
    isWednesday: boolean;
  } | null>(null);

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
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
        isAnimating ? "bg-black/70 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <Card
        className={`w-full max-w-md transform transition-all duration-500 overflow-hidden ${
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
        {/* Header con badge de cuarentena */}
        <div className="relative p-4 pb-2">
          {/* Botón cerrar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Badge de cuarentena */}
          <div className="flex items-center justify-center mb-3">
            <Badge
              className="px-4 py-1.5 text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#1a1a2e",
                border: "none",
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              PERÍODO DE CUARENTENA
            </Badge>
          </div>

          {/* Icono principal */}
          <div className="flex justify-center mb-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(255,193,7,0.3) 0%, rgba(255,152,0,0.2) 100%)",
                border: "2px solid rgba(255,193,7,0.5)",
              }}
            >
              <Church className="h-8 w-8 text-amber-400" />
            </div>
          </div>

          {/* Título */}
          <h2 className="text-xl font-bold text-center text-white mb-1">
            Servicio de {displayDayType}
          </h2>
          <p className="text-center text-amber-300/80 text-sm">
            Culto especial durante la cuarentena
          </p>
        </div>

        <CardContent className="p-4 pt-2 space-y-4">
          {/* Información del servicio */}
          <div
            className="rounded-lg p-4 space-y-3"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,193,7,0.2)",
            }}
          >
            {/* Fecha */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,193,7,0.2)" }}
              >
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">
                  Fecha
                </p>
                <p className="text-white font-semibold capitalize">
                  {displayDate}
                </p>
              </div>
            </div>

            {/* Hora */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,193,7,0.2)" }}
              >
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">
                  Hora
                </p>
                <p className="text-white font-semibold">{serviceTime}</p>
              </div>
            </div>

            {/* Ubicación */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,193,7,0.2)" }}
              >
                <MapPin className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wide">
                  Lugar
                </p>
                <p className="text-white font-semibold">{location}</p>
              </div>
            </div>
          </div>

          {/* Mensaje especial o información de cuarentena */}
          <div
            className="rounded-lg p-4 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(220,38,38,0.05) 100%)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-red-400" />
              <span className="text-red-300 font-semibold text-sm">
                Información Importante
              </span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              {specialMessage ||
                `Durante el período de cuarentena (12 de enero - 21 de febrero), 
                los servicios se realizan los miércoles y sábados a las 7:00 p.m.`}
            </p>
          </div>

          {/* Días restantes de cuarentena */}
          <div className="flex items-center justify-center gap-2 py-2">
            <Users className="h-4 w-4 text-amber-400/70" />
            <span className="text-white/60 text-sm">
              {getDaysRemaining()} días restantes de cuarentena
            </span>
          </div>

          {/* Botón de confirmación */}
          <Button
            onClick={handleClose}
            className="w-full py-3 font-semibold text-base"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#1a1a2e",
              border: "none",
            }}
          >
            Entendido
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuarantineServiceOverlay;
