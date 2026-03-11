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

const GROUP_SHORT: Record<string, string> = {
  'Grupo de Aleida': 'Aleida',
  'Grupo de Keyla': 'Keyla',
  'Grupo de Massy': 'Massy',
};

const DIRECTOR_SHORT = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0]} ${parts[1].substring(0, 1)}.`;
  return name;
};

interface ServiceRow {
  service_date: string;
  title: string;
  leader: string;
  service_type: string;
  assigned_group_id: string | null;
  worship_groups?: { name: string } | null;
}

export const AgendaCalendarPDF: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

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
      const currentMonth = new Date().getMonth(); // 0-indexed (March = 2)
      const currentYear = 2026;

      // Fetch all services from current month to December
      const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      const endDate = `${currentYear}-12-31`;

      const { data: services, error } = await supabase
        .from("services")
        .select(`
          service_date,
          title,
          leader,
          service_type,
          assigned_group_id,
          worship_groups (name)
        `)
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

      // Group services by month
      const servicesByMonth: Record<number, ServiceRow[]> = {};
      for (let m = currentMonth; m < 12; m++) {
        servicesByMonth[m] = [];
      }

      services.forEach((s: any) => {
        const month = new Date(s.service_date).getMonth();
        if (servicesByMonth[month]) {
          servicesByMonth[month].push(s);
        }
      });

      // Load logo
      const logoBase64 = await loadImageAsBase64(arcanaLogo);

      // Create PDF - landscape for more width
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "letter",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;

      // Colors
      const primaryBlue: [number, number, number] = [59, 130, 246];
      const darkBlue: [number, number, number] = [30, 64, 175];

      // Background
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Header
      const headerHeight = 18;
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(margin, margin, pageWidth - margin * 2, headerHeight, 3, 3, "F");

      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", margin + 4, margin + 2, 14, 14);
        } catch {}
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("AGENDA DE SERVICIOS", pageWidth / 2, margin + 8, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Ministerio ADN Arca de Noé • ${currentYear}`, pageWidth / 2, margin + 14, { align: "center" });

      // Calculate months to show
      const monthsToShow = 12 - currentMonth; // e.g., March(2) to Dec(11) = 10 months
      
      // Grid layout: determine cols/rows based on month count
      let cols: number, rows: number;
      if (monthsToShow <= 4) { cols = 2; rows = 2; }
      else if (monthsToShow <= 6) { cols = 3; rows = 2; }
      else if (monthsToShow <= 9) { cols = 3; rows = 3; }
      else { cols = 5; rows = 2; }

      const gridStartY = margin + headerHeight + 4;
      const gapX = 3;
      const gapY = 3;
      const cellWidth = (pageWidth - margin * 2 - gapX * (cols - 1)) / cols;
      const cellHeight = (pageHeight - gridStartY - margin - 6) / rows;

      const monthColors: [number, number, number][] = [
        [59, 130, 246], [236, 72, 153], [34, 197, 94], [168, 85, 247],
        [234, 179, 8], [249, 115, 22], [14, 165, 233], [239, 68, 68],
        [139, 92, 246], [245, 158, 11], [6, 182, 212], [220, 38, 38],
      ];

      let monthIdx = 0;
      for (let month = currentMonth; month < 12; month++) {
        const col = monthIdx % cols;
        const row = Math.floor(monthIdx / cols);
        
        const cellX = margin + col * (cellWidth + gapX);
        const cellY = gridStartY + row * (cellHeight + gapY);

        // Cell background
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(cellX, cellY, cellWidth, cellHeight, 3, 3, "F");

        // Border
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(cellX, cellY, cellWidth, cellHeight, 3, 3, "S");

        // Month header bar
        doc.setFillColor(...monthColors[month]);
        doc.roundedRect(cellX, cellY, cellWidth, 6, 3, 3, "F");
        doc.rect(cellX, cellY + 3, cellWidth, 3, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.text(MONTHS[month], cellX + cellWidth / 2, cellY + 4.5, { align: "center" });

        // Services list
        const monthServices = servicesByMonth[month] || [];
        const contentY = cellY + 8;
        const lineHeight = 3.2;
        const maxLines = Math.floor((cellHeight - 10) / lineHeight);

        if (monthServices.length === 0) {
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(5);
          doc.setFont("helvetica", "italic");
          doc.text("Sin servicios", cellX + cellWidth / 2, contentY + 8, { align: "center" });
        } else {
          // Group by week (by Sunday date)
          const weeks: Map<string, ServiceRow[]> = new Map();
          monthServices.forEach((s) => {
            const d = new Date(s.service_date);
            // Find the Sunday of this week
            const dayOfWeek = d.getDay();
            const sunday = new Date(d);
            if (dayOfWeek !== 0) {
              // Find next Sunday
              sunday.setDate(d.getDate() + (7 - dayOfWeek));
            }
            const key = sunday.toISOString().split('T')[0];
            if (!weeks.has(key)) weeks.set(key, []);
            weeks.get(key)!.push(s);
          });

          let lineIdx = 0;
          const weeksArr = Array.from(weeks.entries()).sort((a, b) => a[0].localeCompare(b[0]));

          for (const [weekKey, weekServices] of weeksArr) {
            if (lineIdx >= maxLines) break;

            const sunDate = new Date(weekKey);
            const sunDay = sunDate.getDate();
            
            // Week separator line
            const lineY = contentY + lineIdx * lineHeight;
            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.15);
            if (lineIdx > 0) {
              doc.line(cellX + 2, lineY - 0.5, cellX + cellWidth - 2, lineY - 0.5);
            }

            // Find services by type
            const sun8 = weekServices.find(s => s.title === '08:00 a.m.');
            const sun1045 = weekServices.find(s => s.title === '10:45 a.m.');
            const wed = weekServices.find(s => s.service_type === 'Servicio de Miércoles');

            // Show Sunday services
            if (sun8 && lineIdx < maxLines) {
              const y = contentY + lineIdx * lineHeight + 2.5;
              const groupName = sun8.worship_groups ? GROUP_SHORT[sun8.worship_groups.name] || sun8.worship_groups.name : '?';
              
              doc.setTextColor(...monthColors[month]);
              doc.setFontSize(5);
              doc.setFont("helvetica", "bold");
              doc.text(`D${sunDay}`, cellX + 2, y);
              
              doc.setTextColor(51, 65, 85);
              doc.setFontSize(4.5);
              doc.setFont("helvetica", "normal");
              doc.text(`8AM ${groupName} - ${DIRECTOR_SHORT(sun8.leader)}`, cellX + 9, y);
              lineIdx++;
            }

            if (sun1045 && lineIdx < maxLines) {
              const y = contentY + lineIdx * lineHeight + 2.5;
              const groupName = sun1045.worship_groups ? GROUP_SHORT[sun1045.worship_groups.name] || sun1045.worship_groups.name : '?';
              
              doc.setTextColor(120, 120, 120);
              doc.setFontSize(4.5);
              doc.setFont("helvetica", "normal");
              doc.text(`     10:45 ${groupName} - ${DIRECTOR_SHORT(sun1045.leader)}`, cellX + 2, y);
              lineIdx++;
            }

            // Wednesday service
            if (wed && lineIdx < maxLines) {
              const wedDate = new Date(wed.service_date);
              const wedDay = wedDate.getDate();
              const y = contentY + lineIdx * lineHeight + 2.5;
              const groupName = wed.worship_groups ? GROUP_SHORT[wed.worship_groups.name] || wed.worship_groups.name : '?';
              
              doc.setTextColor(217, 119, 6);
              doc.setFontSize(4.5);
              doc.setFont("helvetica", "bold");
              doc.text(`M${wedDay}`, cellX + 2, y);
              doc.setFont("helvetica", "normal");
              doc.text(`7PM ${groupName} - ${DIRECTOR_SHORT(wed.leader)}`, cellX + 9, y);
              lineIdx++;
            }
          }

          // If truncated
          const totalEntries = monthServices.length;
          const shownEntries = lineIdx;
          if (shownEntries < weeksArr.reduce((acc, [, s]) => acc + s.length, 0)) {
            doc.setTextColor(148, 163, 184);
            doc.setFontSize(4);
            doc.setFont("helvetica", "italic");
            doc.text("...", cellX + cellWidth / 2, cellY + cellHeight - 2, { align: "center" });
          }
        }

        monthIdx++;
      }

      // Footer
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(6);
      doc.setFont("helvetica", "italic");
      doc.text(`Generado por ARCANA • ${new Date().toLocaleDateString('es-DO')}`, pageWidth / 2, pageHeight - 4, { align: "center" });

      // Legend
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(5);
      doc.text("D=Domingo  M=Miércoles  •  Formato: Hora Grupo - Director", pageWidth - margin, pageHeight - 4, { align: "right" });

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
