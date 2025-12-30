import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, FileDown, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface DirectorProfile {
  full_name: string;
  photo_url: string | null;
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
    1: "Primer",
    2: "Segundo",
    3: "Tercer",
    4: "Cuarto",
    5: "Quinto",
  };
  return names[order] || `${order}°`;
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
        // Primero buscar en profiles
        const profile = profiles?.find(
          (p) => p.full_name.toLowerCase() === leader.toLowerCase()
        );
        if (profile?.photo_url) {
          directorPhotos[leader] = profile.photo_url;
        } else {
          // Buscar en members
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

      // Crear el PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const monthName = MONTHS[selectedMonth].label;

      // Colores del diseño
      const primaryColor: [number, number, number] = [59, 130, 246]; // Blue-500
      const secondaryColor: [number, number, number] = [30, 64, 175]; // Blue-800
      const lightBg: [number, number, number] = [239, 246, 255]; // Blue-50

      // Header con gradiente simulado
      doc.setFillColor(...secondaryColor);
      doc.rect(0, 0, pageWidth, 45, "F");

      // Franja decorativa
      doc.setFillColor(...primaryColor);
      doc.rect(0, 45, pageWidth, 3, "F");

      // Título principal
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("AGENDA", pageWidth / 2, 18, { align: "center" });
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("Ministerio ADN Arca de Noé", pageWidth / 2, 28, { align: "center" });
      
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(`${monthName} ${selectedYear}`, pageWidth / 2, 40, { align: "center" });

      // Generar contenido
      let yPosition = 58;
      const cardHeight = 40;
      const cardSpacing = 8;
      const photoSize = 25;

      for (let i = 0; i < services.length; i++) {
        const service = services[i] as unknown as Service;
        const serviceDate = new Date(service.service_date);
        const dayName = format(serviceDate, "EEEE", { locale: es });
        const dateFormatted = format(serviceDate, "dd 'de' MMMM", { locale: es });
        const timeFormatted = format(serviceDate, "HH:mm");
        const orderName = getOrderName(service.month_order);
        const specialEvent = getSpecialEvent(service.month_order);

        // Verificar si necesitamos nueva página
        if (yPosition + cardHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Card background
        doc.setFillColor(...lightBg);
        doc.roundedRect(margin, yPosition, pageWidth - margin * 2, cardHeight, 3, 3, "F");

        // Borde izquierdo con color
        doc.setFillColor(...primaryColor);
        doc.rect(margin, yPosition, 4, cardHeight, "F");

        // Foto del director
        const photoX = margin + 10;
        const photoY = yPosition + (cardHeight - photoSize) / 2;
        
        const directorImage = directorImagesBase64[service.leader];
        if (directorImage) {
          try {
            // Círculo de fondo para la foto
            doc.setFillColor(255, 255, 255);
            doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 1, "F");
            doc.addImage(directorImage, "JPEG", photoX, photoY, photoSize, photoSize);
          } catch {
            // Si falla la imagen, mostrar placeholder
            doc.setFillColor(200, 200, 200);
            doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, "F");
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(8);
            doc.text("Sin foto", photoX + photoSize / 2, photoY + photoSize / 2 + 2, { align: "center" });
          }
        } else {
          // Placeholder circular
          doc.setFillColor(200, 200, 200);
          doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, "F");
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(8);
          doc.text("Sin foto", photoX + photoSize / 2, photoY + photoSize / 2 + 2, { align: "center" });
        }

        // Información del servicio
        const textX = photoX + photoSize + 8;
        
        // Línea 1: Orden + Tipo de servicio
        doc.setTextColor(...secondaryColor);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${orderName} Domingo - ${service.title}`, textX, yPosition + 10);

        // Línea 2: Fecha y hora
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        doc.text(`${capitalizedDayName}, ${dateFormatted} | ${timeFormatted} hrs`, textX, yPosition + 17);

        // Línea 3: Director de alabanza
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Director: ${service.leader}`, textX, yPosition + 25);

        // Línea 4: Grupo coral y evento especial
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const groupName = service.worship_groups?.name || "Sin asignar";
        doc.text(`Coros: ${groupName}`, textX, yPosition + 32);

        // Evento especial a la derecha
        const eventX = pageWidth - margin - 5;
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text(`Evento: ${specialEvent}`, eventX, yPosition + 32, { align: "right" });

        yPosition += cardHeight + cardSpacing;
      }

      // Footer
      const footerY = pageHeight - 10;
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(`Generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}`, pageWidth / 2, footerY, { align: "center" });

      // Descargar
      const fileName = `Agenda_ADN_${monthName}_${selectedYear}.pdf`;
      doc.save(fileName);
      
      toast.success(`Agenda de ${monthName} ${selectedYear} descargada correctamente`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  // Si no hay años disponibles, usar el año actual
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
