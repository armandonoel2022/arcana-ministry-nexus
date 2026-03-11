import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Loader2, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import arcanaLogo from "@/assets/arcana-logo.png";

const MONTHS = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const GROUP_COLORS: Record<string, [number, number, number]> = {
  'Grupo de Aleida': [220, 38, 38],   // Red
  'Grupo de Keyla': [139, 92, 246],    // Purple
  'Grupo de Massy': [34, 197, 94],     // Green
};

const MONTH_COLORS: [number, number, number][] = [
  [59, 130, 246], [236, 72, 153], [34, 197, 94], [168, 85, 247],
  [234, 179, 8], [249, 115, 22], [14, 165, 233], [239, 68, 68],
  [139, 92, 246], [245, 158, 11], [6, 182, 212], [220, 38, 38],
];

interface ServiceRow {
  service_date: string;
  title: string;
  leader: string;
  service_type: string;
  assigned_group_id: string | null;
  worship_groups?: { name: string } | null;
}

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

const drawHeader = (doc: jsPDF, pageWidth: number, margin: number, logoBase64: string | null, year: number) => {
  const headerHeight = 16;
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, margin, pageWidth - margin * 2, headerHeight, 3, 3, "F");

  if (logoBase64) {
    try { doc.addImage(logoBase64, "PNG", margin + 3, margin + 1.5, 13, 13); } catch {}
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("AGENDA DE SERVICIOS", pageWidth / 2, margin + 7, { align: "center" });
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(`Ministerio ADN Arca de Noé • ${year}`, pageWidth / 2, margin + 13, { align: "center" });

  return margin + headerHeight + 4;
};

const drawFooter = (doc: jsPDF, pageWidth: number, pageHeight: number) => {
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.text(`Generado por ARCANA • ${new Date().toLocaleDateString('es-DO')}`, pageWidth / 2, pageHeight - 5, { align: "center" });
};

const renderMonthBlock = (
  doc: jsPDF,
  monthServices: ServiceRow[],
  month: number,
  x: number,
  y: number,
  width: number,
  maxHeight: number
): number => {
  const color = MONTH_COLORS[month];
  const padding = 3;
  const rowHeight = 5.5;

  // Month title bar
  doc.setFillColor(...color);
  doc.roundedRect(x, y, width, 8, 2, 2, "F");
  doc.rect(x, y + 5, width, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(MONTHS[month], x + width / 2, y + 5.8, { align: "center" });

  let curY = y + 11;

  if (monthServices.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("Sin servicios programados", x + width / 2, curY + 6, { align: "center" });
    return curY + 12;
  }

  // Sort services by date
  const sorted = [...monthServices].sort((a, b) => a.service_date.localeCompare(b.service_date));

  // Column headers
  doc.setFillColor(241, 245, 249);
  doc.rect(x, curY, width, rowHeight, "F");
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  const col1 = x + 2;
  const col2 = x + 28;
  const col3 = x + 48;
  const col4 = x + width * 0.58;
  doc.text("DÍA", col1, curY + 3.8);
  doc.text("HORA", col2, curY + 3.8);
  doc.text("GRUPO", col3, curY + 3.8);
  doc.text("DIRIGE", col4, curY + 3.8);
  curY += rowHeight;

  // Separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(x + 1, curY, x + width - 1, curY);

  for (const service of sorted) {
    if (curY + rowHeight > y + maxHeight) break;

    const d = new Date(service.service_date);
    const dayName = DAY_NAMES[d.getDay()];
    const dayNum = d.getDate();
    const groupName = service.worship_groups?.name || '—';
    const groupColor = GROUP_COLORS[groupName] || [100, 100, 100];

    // Determine hour display
    let hora = '';
    if (service.service_type === 'Servicio de Miércoles') {
      hora = '7:00 PM';
    } else if (service.title === '08:00 a.m.') {
      hora = '8:00 AM';
    } else if (service.title === '10:45 a.m.') {
      hora = '10:45 AM';
    } else {
      hora = service.title;
    }

    // Alternating row background
    const rowIdx = sorted.indexOf(service);
    if (rowIdx % 2 === 0) {
      doc.setFillColor(250, 251, 252);
      doc.rect(x, curY, width, rowHeight, "F");
    }

    // Day column - bold with color
    const isWednesday = service.service_type === 'Servicio de Miércoles';
    doc.setTextColor(isWednesday ? 217 : 51, isWednesday ? 119 : 65, isWednesday ? 6 : 85);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(`${dayName} ${dayNum}`, col1, curY + 3.8);

    // Hour column
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(hora, col2, curY + 3.8);

    // Group column - colored
    doc.setTextColor(...groupColor);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(groupName, col3, curY + 3.8);

    // Director column
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(service.leader, col4, curY + 3.8);

    curY += rowHeight;

    // Light separator
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.15);
    doc.line(x + 1, curY, x + width - 1, curY);
  }

  return curY + 2;
};

export const AgendaCalendarPDF: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const currentMonth = new Date().getMonth();
      const currentYear = 2026;

      const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${currentYear}-12-31`;

      const { data: services, error } = await supabase
        .from("services")
        .select(`service_date, title, leader, service_type, assigned_group_id, worship_groups (name)`)
        .gte("service_date", startDate)
        .lte("service_date", endDate)
        .in("service_type", ["Servicio Dominical", "Servicio de Miércoles"])
        .order("service_date", { ascending: true });

      if (error) throw error;
      if (!services || services.length === 0) {
        toast.error("No hay servicios programados");
        setIsGenerating(false);
        return;
      }

      const servicesByMonth: Record<number, ServiceRow[]> = {};
      for (let m = currentMonth; m < 12; m++) servicesByMonth[m] = [];
      services.forEach((s: any) => {
        const month = new Date(s.service_date).getMonth();
        if (servicesByMonth[month]) servicesByMonth[month].push(s);
      });

      const logoBase64 = await loadImageAsBase64(arcanaLogo);

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;

      // Layout: 2 months side-by-side per page
      const monthsList = [];
      for (let m = currentMonth; m < 12; m++) monthsList.push(m);

      const colWidth = (pageWidth - margin * 2 - 6) / 2;

      for (let i = 0; i < monthsList.length; i += 2) {
        if (i > 0) doc.addPage();

        const contentStartY = drawHeader(doc, pageWidth, margin, logoBase64, currentYear);

        // Left month
        const leftMonth = monthsList[i];
        const leftServices = servicesByMonth[leftMonth] || [];
        renderMonthBlock(doc, leftServices, leftMonth, margin, contentStartY, colWidth, pageHeight - contentStartY - 12);

        // Right month (if exists)
        if (i + 1 < monthsList.length) {
          const rightMonth = monthsList[i + 1];
          const rightServices = servicesByMonth[rightMonth] || [];
          renderMonthBlock(doc, rightServices, rightMonth, margin + colWidth + 6, contentStartY, colWidth, pageHeight - contentStartY - 12);
        }

        // Draw card borders
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, contentStartY - 1, colWidth, pageHeight - contentStartY - 10, 3, 3, "S");
        if (i + 1 < monthsList.length) {
          doc.roundedRect(margin + colWidth + 6, contentStartY - 1, colWidth, pageHeight - contentStartY - 10, 3, 3, "S");
        }

        drawFooter(doc, pageWidth, pageHeight);
      }

      doc.save(`Agenda_Servicios_${currentYear}.pdf`);
      toast.success("Agenda de servicios descargada");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-blue-300/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
          <CalendarDays className="w-5 h-5" />
          Calendario de Turnos
        </CardTitle>
        <CardDescription>
          Descarga un calendario con todos los turnos de servicios del año
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={generatePDF}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
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
      </CardContent>
    </Card>
  );
};

export default AgendaCalendarPDF;
