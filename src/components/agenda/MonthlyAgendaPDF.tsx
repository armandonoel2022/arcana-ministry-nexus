import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, FileDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from "jspdf";
import arcanaLogo from "@/assets/arcana-logo.png";

interface Service {
  id: string;
  leader: string;
  service_date: string;
  month_name: string;
  month_order: number;
  title: string;
  service_type: string;
  worship_groups?: {
    name: string;
    color_theme: string;
  } | null;
}

interface MonthlyAgendaPDFProps {
  availableYears: number[];
}

// Helper para obtener el evento especial según el domingo del mes
const getSpecialEvent = (monthOrder: number): string => {
  switch (monthOrder) {
    case 1:
      return "Santa Comunión";
    case 2:
      return "Ninguno";
    case 3:
      return "Presentación de Niños";
    case 4:
      return "Culto Misionero";
    case 5:
      return "Ninguno";
    default:
      return "Ninguno";
  }
};

// Helper para obtener el nombre del orden
const getOrderName = (order: number): string => {
  const names: { [key: number]: string } = {
    1: "1er",
    2: "2do",
    3: "3er",
    4: "4to",
    5: "5to",
  };
  return names[order] || `${order}°`;
};

// Formatear hora en formato 12h
const formatTime12h = (dateStr: string): string => {
  const date = new Date(dateStr);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
  const hour12 = hours % 12 || 12;
  const minuteStr = minutes.toString().padStart(2, '0');
  return `${hour12.toString().padStart(2, '0')}:${minuteStr} ${ampm}`;
};

// Meses del año
const MONTHS = [
  { value: 0, label: "Enero" },
  { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" },
  { value: 5, label: "Junio" },
  { value: 6, label: "Julio" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" },
  { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" },
  { value: 11, label: "Diciembre" },
];

export const MonthlyAgendaPDF: React.FC<MonthlyAgendaPDFProps> = ({ availableYears }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [isGenerating, setIsGenerating] = useState(false);

  // Función para cargar imagen y convertirla a base64
  const loadImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // Función para dibujar imagen circular con clip
  const drawCircularImage = (
    doc: jsPDF,
    imageData: string,
    x: number,
    y: number,
    diameter: number
  ) => {
    const radius = diameter / 2;
    const centerX = x + radius;
    const centerY = y + radius;

    // Guardar estado gráfico
    doc.saveGraphicsState();

    // Crear path circular para clip
    // @ts-ignore - jsPDF tiene este método internamente
    doc.circle(centerX, centerY, radius, 'S');
    
    // Dibujar imagen (se cortará al círculo)
    try {
      doc.addImage(imageData, "JPEG", x, y, diameter, diameter);
    } catch {
      // Si falla, no hacer nada
    }

    // Restaurar estado
    doc.restoreGraphicsState();

    // Dibujar borde circular
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.8);
    doc.circle(centerX, centerY, radius, 'S');
  };

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      // Obtener servicios del mes seleccionado
      const startDate = startOfMonth(new Date(selectedYear, selectedMonth));
      const endDate = endOfMonth(new Date(selectedYear, selectedMonth));

      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select(`
          id,
          leader,
          service_date,
          month_name,
          month_order,
          title,
          service_type,
          worship_groups (
            name,
            color_theme
          )
        `)
        .gte("service_date", format(startDate, "yyyy-MM-dd"))
        .lte("service_date", format(endDate, "yyyy-MM-dd"))
        .order("service_date", { ascending: true });

      if (servicesError) throw servicesError;

      if (!services || services.length === 0) {
        toast.error("No hay servicios programados para este mes");
        setIsGenerating(false);
        return;
      }

      // Obtener directores únicos
      const uniqueLeaders = [...new Set(services.map((s) => s.leader))];

      // Buscar perfiles de los directores
      const { data: profiles } = await supabase
        .from("profiles")
        .select("full_name, photo_url")
        .in("full_name", uniqueLeaders);

      // También buscar en la tabla members como fallback
      const { data: members } = await supabase
        .from("members")
        .select("nombres, apellidos, photo_url");

      // Crear mapa de fotos de directores
      const directorPhotos: { [key: string]: string | null } = {};
      
      for (const leader of uniqueLeaders) {
        const profile = profiles?.find(
          (p) => p.full_name.toLowerCase() === leader.toLowerCase()
        );
        if (profile?.photo_url) {
          directorPhotos[leader] = profile.photo_url;
        } else {
          const member = members?.find(
            (m) => `${m.nombres} ${m.apellidos}`.toLowerCase() === leader.toLowerCase()
          );
          directorPhotos[leader] = member?.photo_url || null;
        }
      }

      // Cargar imágenes de directores
      const directorImagesBase64: { [key: string]: string | null } = {};
      for (const [leader, photoUrl] of Object.entries(directorPhotos)) {
        if (photoUrl) {
          directorImagesBase64[leader] = await loadImageAsBase64(photoUrl);
        }
      }

      // Cargar logo ARCANA
      const logoBase64 = await loadImageAsBase64(arcanaLogo);

      // Crear el PDF - una sola página
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const monthName = MONTHS[selectedMonth].label.toUpperCase();

      // Colores del diseño
      const primaryBlue: [number, number, number] = [59, 130, 246];
      const darkBlue: [number, number, number] = [30, 64, 175];
      const lightBg: [number, number, number] = [248, 250, 252];
      const accentGold: [number, number, number] = [234, 179, 8];

      // Fondo suave
      doc.setFillColor(...lightBg);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Header con degradado simulado (rectángulos apilados)
      const headerHeight = 35;
      doc.setFillColor(37, 99, 235); // blue-600
      doc.roundedRect(margin, margin, pageWidth - margin * 2, headerHeight, 4, 4, "F");

      // Logo ARCANA en el header (lado izquierdo)
      if (logoBase64) {
        try {
          const logoSize = 22;
          doc.addImage(logoBase64, "PNG", margin + 8, margin + 6, logoSize, logoSize);
        } catch {
          // Si falla, continuar sin logo
        }
      }

      // Título en el header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("AGENDA MINISTERIAL", pageWidth / 2 + 5, margin + 14, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Ministerio ADN Arca de Noé", pageWidth / 2 + 5, margin + 22, { align: "center" });
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`${monthName} ${selectedYear}`, pageWidth / 2 + 5, margin + 30, { align: "center" });

      // Calcular altura de cada card para que quepan todas en una página
      const contentStartY = margin + headerHeight + 10;
      const footerHeight = 15;
      const availableHeight = pageHeight - contentStartY - footerHeight - margin;
      const cardSpacing = 6;
      const numServices = services.length;
      const totalSpacing = (numServices - 1) * cardSpacing;
      const cardHeight = Math.min(38, (availableHeight - totalSpacing) / numServices);
      const photoSize = Math.min(28, cardHeight - 6);

      let yPosition = contentStartY;

      for (let i = 0; i < services.length; i++) {
        const service = services[i] as unknown as Service;
        const serviceDate = new Date(service.service_date);
        const dayNumber = serviceDate.getDate();
        const dayName = format(serviceDate, "EEEE", { locale: es });
        const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        const timeFormatted = formatTime12h(service.service_date);
        const orderName = getOrderName(service.month_order);
        const specialEvent = getSpecialEvent(service.month_order);
        const groupName = service.worship_groups?.name || "Sin asignar";

        // Card background con sombra suave
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, yPosition, pageWidth - margin * 2, cardHeight, 3, 3, "F");
        
        // Borde sutil
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, yPosition, pageWidth - margin * 2, cardHeight, 3, 3, "S");

        // Número del día (destacado a la izquierda)
        doc.setFillColor(...primaryBlue);
        doc.roundedRect(margin + 3, yPosition + 3, 18, cardHeight - 6, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(dayNumber.toString(), margin + 12, yPosition + cardHeight / 2 + 1, { align: "center" });
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(capitalizedDayName.substring(0, 3).toUpperCase(), margin + 12, yPosition + cardHeight / 2 + 6, { align: "center" });

        // Foto del director (circular)
        const photoX = margin + 25;
        const photoY = yPosition + (cardHeight - photoSize) / 2;
        
        const directorImage = directorImagesBase64[service.leader];
        if (directorImage) {
          try {
            // Dibujar círculo de fondo blanco
            doc.setFillColor(255, 255, 255);
            doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 1, "F");
            
            // Dibujar imagen
            doc.addImage(directorImage, "JPEG", photoX, photoY, photoSize, photoSize);
            
            // Borde circular
            doc.setDrawColor(...primaryBlue);
            doc.setLineWidth(0.8);
            doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, "S");
          } catch {
            // Placeholder si falla
            doc.setFillColor(226, 232, 240);
            doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, "F");
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(6);
            doc.text(service.leader.split(' ').map(n => n[0]).join(''), photoX + photoSize / 2, photoY + photoSize / 2 + 2, { align: "center" });
          }
        } else {
          // Placeholder circular con iniciales
          doc.setFillColor(226, 232, 240);
          doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, "F");
          doc.setDrawColor(...primaryBlue);
          doc.setLineWidth(0.5);
          doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, "S");
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const initials = service.leader.split(' ').map(n => n[0]).join('').substring(0, 2);
          doc.text(initials, photoX + photoSize / 2, photoY + photoSize / 2 + 3, { align: "center" });
        }

        // Información del servicio
        const textX = photoX + photoSize + 8;
        const textMaxWidth = pageWidth - textX - margin - 50;
        
        // Línea 1: Orden + Tipo de servicio + Hora
        doc.setTextColor(...darkBlue);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${orderName} Domingo • ${service.title} • ${timeFormatted}`, textX, yPosition + 10);

        // Línea 2: Director de alabanza
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Director: ${service.leader}`, textX, yPosition + 17);

        // Línea 3: Grupo coral con color distintivo
        // Determinar color según el nombre del grupo
        const getGroupColor = (name: string): [number, number, number] => {
          const nameLower = name.toLowerCase();
          if (nameLower.includes('aleida')) return [220, 38, 38]; // red-600
          if (nameLower.includes('keyla')) return [124, 58, 237]; // violet-600
          if (nameLower.includes('massy')) return [22, 163, 74]; // green-600
          return [71, 85, 105]; // slate-600 default
        };

        const groupColor = getGroupColor(groupName);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text("Coros: ", textX, yPosition + 24);
        
        const corosWidth = doc.getTextWidth("Coros: ");
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...groupColor);
        doc.text(groupName, textX + corosWidth, yPosition + 24);

        // Evento especial (a la derecha, más compacto)
        const eventX = pageWidth - margin - 5;
        if (specialEvent !== "Ninguno") {
          doc.setFillColor(...accentGold);
          const eventWidth = doc.getTextWidth(specialEvent) + 8;
          doc.roundedRect(eventX - eventWidth - 2, yPosition + 8, eventWidth + 4, 12, 2, 2, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.text(specialEvent, eventX, yPosition + 15, { align: "right" });
        } else {
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(7);
          doc.setFont("helvetica", "italic");
          doc.text("Sin evento especial", eventX, yPosition + 15, { align: "right" });
        }

        yPosition += cardHeight + cardSpacing;
      }

      // Footer elegante
      const footerY = pageHeight - margin - 5;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
      
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text(`Generado por ARCANA • ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}`, pageWidth / 2, footerY, { align: "center" });

      // Descargar
      const fileName = `Agenda_ADN_${MONTHS[selectedMonth].label}_${selectedYear}.pdf`;
      doc.save(fileName);
      
      toast.success(`Agenda de ${MONTHS[selectedMonth].label} ${selectedYear} descargada`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const yearsToShow = availableYears.length > 0 ? availableYears : [new Date().getFullYear()];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileDown className="w-5 h-5 text-primary" />
          Descargar Agenda Mensual
        </CardTitle>
        <CardDescription>
          Genera una plantilla PDF con los servicios del mes seleccionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {yearsToShow.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={generatePDF}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Descargar PDF
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyAgendaPDF;
