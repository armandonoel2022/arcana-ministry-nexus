import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, FileDown, Loader2, Cake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import arcanaLogo from "@/assets/arcana-logo.png";

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  cargo: string;
  photo_url?: string;
}

const MONTHS = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

const getRoleLabel = (role: string) => {
  const roleLabels: { [key: string]: string } = {
    'pastor': 'Pastor',
    'pastora': 'Pastora',
    'director_alabanza': 'Dir. Alabanza',
    'directora_alabanza': 'Dir. Alabanza',
    'director_musical': 'Dir. Musical',
    'corista': 'Corista',
    'directora_danza': 'Dir. Danza',
    'director_multimedia': 'Dir. Multimedia',
    'camarografo': 'Camarógrafo',
    'camarógrafa': 'Camarógrafa',
    'encargado_piso': 'Enc. Piso',
    'encargada_piso': 'Enc. Piso',
    'musico': 'Músico',
    'sonidista': 'Sonidista',
    'encargado_luces': 'Enc. Luces',
    'encargado_proyeccion': 'Enc. Proyección',
    'encargado_streaming': 'Enc. Streaming'
  };
  return roleLabels[role] || role;
};

export const BirthdayCalendarPDF: React.FC = () => {
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
      // Obtener todos los miembros activos con fecha de nacimiento
      const { data: members, error } = await supabase
        .from("members")
        .select("id, nombres, apellidos, fecha_nacimiento, cargo, photo_url")
        .eq("is_active", true)
        .not("fecha_nacimiento", "is", null)
        .order("nombres", { ascending: true });

      if (error) throw error;

      if (!members || members.length === 0) {
        toast.error("No hay miembros con fechas de nacimiento registradas");
        setIsGenerating(false);
        return;
      }

      // Agrupar por mes
      const membersByMonth: { [key: number]: Member[] } = {};
      for (let i = 0; i < 12; i++) {
        membersByMonth[i] = [];
      }

      members.forEach((member) => {
        if (member.fecha_nacimiento) {
          const parts = member.fecha_nacimiento.split('-');
          if (parts.length === 3) {
            const month = parseInt(parts[1]) - 1; // 0-indexed
            membersByMonth[month].push(member as Member);
          }
        }
      });

      // Ordenar cada mes por día
      for (let i = 0; i < 12; i++) {
        membersByMonth[i].sort((a, b) => {
          const dayA = parseInt(a.fecha_nacimiento.split('-')[2]);
          const dayB = parseInt(b.fecha_nacimiento.split('-')[2]);
          return dayA - dayB;
        });
      }

      // Cargar logo
      const logoBase64 = await loadImageAsBase64(arcanaLogo);

      // Crear PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;

      // Colores
      const primaryBlue: [number, number, number] = [59, 130, 246];
      const darkBlue: [number, number, number] = [30, 64, 175];
      const lightBg: [number, number, number] = [254, 252, 232]; // yellow-50
      const warmPink: [number, number, number] = [251, 207, 232]; // pink-200
      const accentGold: [number, number, number] = [234, 179, 8];

      // Fondo suave cremoso
      doc.setFillColor(255, 251, 235);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Header elegante
      const headerHeight = 40;
      
      // Decoración superior izquierda
      doc.setFillColor(...primaryBlue);
      doc.circle(margin, margin, 8, "F");
      doc.circle(margin + 12, margin + 5, 5, "F");
      doc.circle(margin + 5, margin + 12, 4, "F");

      // Logo ARCANA
      if (logoBase64) {
        try {
          const logoSize = 25;
          doc.addImage(logoBase64, "PNG", pageWidth / 2 - logoSize / 2, margin, logoSize, logoSize);
        } catch {
          // Continuar sin logo
        }
      }

      // Título
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("C A L E N D A R I O   D E", pageWidth / 2, margin + 30, { align: "center" });
      
      doc.setTextColor(...darkBlue);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("CUMPLEAÑOS", pageWidth / 2, margin + 40, { align: "center" });

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Ministerio ADN Arca de Noé", pageWidth / 2, margin + 47, { align: "center" });

      // Grid de meses (4 columnas x 3 filas)
      const gridStartY = margin + 55;
      const cols = 3;
      const rows = 4;
      const cellWidth = (pageWidth - margin * 2 - 10) / cols;
      const cellHeight = (pageHeight - gridStartY - margin - 10) / rows;
      const cellPadding = 3;
      const gapX = 5;
      const gapY = 3;

      for (let month = 0; month < 12; month++) {
        const col = month % cols;
        const row = Math.floor(month / cols);
        
        const cellX = margin + col * (cellWidth + gapX);
        const cellY = gridStartY + row * (cellHeight + gapY);

        // Fondo de celda
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(cellX, cellY, cellWidth, cellHeight, 4, 4, "F");

        // Borde sutil
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(cellX, cellY, cellWidth, cellHeight, 4, 4, "S");

        // Barra de color en la parte superior
        const monthColors: [number, number, number][] = [
          [59, 130, 246], // Enero - blue
          [236, 72, 153], // Febrero - pink
          [34, 197, 94],  // Marzo - green
          [168, 85, 247], // Abril - purple
          [234, 179, 8],  // Mayo - yellow
          [249, 115, 22], // Junio - orange
          [14, 165, 233], // Julio - sky
          [239, 68, 68],  // Agosto - red
          [139, 92, 246], // Septiembre - violet
          [245, 158, 11], // Octubre - amber
          [6, 182, 212],  // Noviembre - cyan
          [220, 38, 38],  // Diciembre - red-600
        ];
        
        doc.setFillColor(...monthColors[month]);
        doc.roundedRect(cellX, cellY, cellWidth, 8, 4, 4, "F");
        doc.setFillColor(...monthColors[month]);
        doc.rect(cellX, cellY + 4, cellWidth, 4, "F");

        // Nombre del mes
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(MONTHS[month], cellX + cellWidth / 2, cellY + 5.5, { align: "center" });

        // Lista de cumpleaños
        const birthdaysInMonth = membersByMonth[month];
        const contentY = cellY + 12;
        const maxLines = Math.floor((cellHeight - 15) / 5);

        if (birthdaysInMonth.length === 0) {
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(7);
          doc.setFont("helvetica", "italic");
          doc.text("Sin cumpleaños", cellX + cellWidth / 2, contentY + 10, { align: "center" });
        } else {
          birthdaysInMonth.slice(0, maxLines).forEach((member, idx) => {
            const day = parseInt(member.fecha_nacimiento.split('-')[2]);
            const lineY = contentY + (idx * 5);
            
            // Día
            doc.setTextColor(...monthColors[month]);
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.text(day.toString().padStart(2, '0'), cellX + cellPadding + 3, lineY + 3);
            
            // Nombre
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(6.5);
            doc.setFont("helvetica", "normal");
            const displayName = `${member.nombres.split(' ')[0]} ${member.apellidos.split(' ')[0]}`;
            doc.text(displayName, cellX + cellPadding + 12, lineY + 3);
          });

          // Indicar si hay más
          if (birthdaysInMonth.length > maxLines) {
            doc.setTextColor(148, 163, 184);
            doc.setFontSize(6);
            doc.setFont("helvetica", "italic");
            doc.text(`+${birthdaysInMonth.length - maxLines} más`, cellX + cellWidth / 2, cellY + cellHeight - 3, { align: "center" });
          }
        }
      }

      // Footer
      const footerY = pageHeight - margin;
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text(`Generado por ARCANA • ${new Date().getFullYear()}`, pageWidth / 2, footerY, { align: "center" });

      // Icono decorativo de pastel
      doc.setTextColor(...accentGold);
      doc.setFontSize(10);
      doc.text("🎂", pageWidth - margin - 5, footerY, { align: "right" });

      // Descargar
      const fileName = `Calendario_Cumpleanos_ADN_${new Date().getFullYear()}.pdf`;
      doc.save(fileName);
      
      toast.success("Calendario de cumpleaños descargado");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-yellow-300/50 bg-gradient-to-br from-yellow-50/50 to-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-yellow-700">
          <Cake className="w-5 h-5" />
          Calendario de Cumpleaños
        </CardTitle>
        <CardDescription>
          Descarga un calendario anual con todos los cumpleaños del ministerio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={generatePDF}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
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

export default BirthdayCalendarPDF;
