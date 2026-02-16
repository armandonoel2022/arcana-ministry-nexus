import React, { useRef } from 'react';
import { X, Calendar, Clock, Users, Flame, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import arcanaLogo from '@/assets/arca-noe-logo.png';

interface ExtraordinaryRehearsalOverlayProps {
  activityName: string;
  date: string;
  time: string;
  location?: string;
  additionalNotes?: string;
  specialEventName?: string;
  onClose: () => void;
}

const ExtraordinaryRehearsalOverlay = ({ 
  activityName,
  date,
  time,
  location,
  additionalNotes,
  specialEventName,
  onClose 
}: ExtraordinaryRehearsalOverlayProps) => {
  const { toast } = useToast();
  const formattedDate = format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  
  const formatTime = (time24: string) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'p.m.' : 'a.m.';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const downloadImage = async () => {
    try {
      const container = document.createElement("div");
      container.style.width = "480px";
      container.style.background = "linear-gradient(180deg, #92400e 0%, #78350f 50%, #451a03 100%)";
      container.style.borderRadius = "24px";
      container.style.overflow = "hidden";
      container.style.position = "relative";
      container.style.fontFamily = "system-ui, -apple-system, sans-serif";

      // Decorative circles
      const circle1 = document.createElement("div");
      circle1.style.cssText = "position:absolute;top:-40px;right:-20px;width:160px;height:160px;background:rgba(255,255,255,0.08);border-radius:50%;";
      container.appendChild(circle1);
      const circle2 = document.createElement("div");
      circle2.style.cssText = "position:absolute;bottom:120px;left:-40px;width:128px;height:128px;background:rgba(255,255,255,0.08);border-radius:50%;";
      container.appendChild(circle2);

      // Header
      const header = document.createElement("div");
      header.style.cssText = "padding:28px 28px 16px;position:relative;z-index:1;";

      // Logo row
      const logoRow = document.createElement("div");
      logoRow.style.cssText = "display:flex;align-items:center;gap:16px;margin-bottom:20px;";
      const logoCircle = document.createElement("div");
      logoCircle.style.cssText = "width:56px;height:56px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.2);";
      const logoImg = document.createElement("img");
      logoImg.src = arcanaLogo;
      logoImg.style.cssText = "width:48px;height:48px;object-fit:contain;";
      logoCircle.appendChild(logoImg);
      logoRow.appendChild(logoCircle);

      const headerText = document.createElement("div");
      const subtitle = document.createElement("div");
      subtitle.textContent = "ENSAYO EXTRAORDINARIO";
      subtitle.style.cssText = "font-size:11px;font-weight:600;letter-spacing:1.5px;color:rgba(253,230,138,0.9);text-transform:uppercase;";
      headerText.appendChild(subtitle);
      const groupLabel = document.createElement("div");
      groupLabel.textContent = "👥 TODOS LOS GRUPOS";
      groupLabel.style.cssText = "font-size:11px;font-weight:700;color:rgba(253,230,138,0.8);margin-top:4px;";
      headerText.appendChild(groupLabel);
      logoRow.appendChild(headerText);
      header.appendChild(logoRow);

      // Flame icon
      const iconWrap = document.createElement("div");
      iconWrap.style.cssText = "display:flex;justify-content:center;margin-bottom:16px;";
      const iconCircle = document.createElement("div");
      iconCircle.style.cssText = "width:72px;height:72px;background:rgba(255,255,255,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;";
      iconCircle.textContent = "🔥";
      iconCircle.style.fontSize = "36px";
      iconWrap.appendChild(iconCircle);
      header.appendChild(iconWrap);

      // Title
      const title = document.createElement("div");
      title.textContent = activityName;
      title.style.cssText = "font-size:26px;font-weight:800;color:white;text-align:center;line-height:1.2;";
      header.appendChild(title);

      // Special event badge
      if (specialEventName) {
        const badgeWrap = document.createElement("div");
        badgeWrap.style.cssText = "display:flex;justify-content:center;margin-top:12px;";
        const badge = document.createElement("span");
        badge.textContent = `🌟 ${specialEventName}`;
        badge.style.cssText = "background:rgba(245,158,11,0.3);color:#fef3c7;font-size:12px;font-weight:600;padding:6px 16px;border-radius:20px;border:1px solid rgba(245,158,11,0.3);";
        badgeWrap.appendChild(badge);
        header.appendChild(badgeWrap);
      }

      container.appendChild(header);

      // Details card
      const cardWrap = document.createElement("div");
      cardWrap.style.cssText = "padding:0 28px;position:relative;z-index:1;";
      const card = document.createElement("div");
      card.style.cssText = "background:rgba(255,255,255,0.92);border-radius:16px;padding:24px;box-shadow:0 4px 16px rgba(0,0,0,0.15);";

      // Date row
      const dateRow = document.createElement("div");
      dateRow.style.cssText = "display:flex;align-items:center;gap:12px;margin-bottom:16px;";
      const dateIcon = document.createElement("div");
      dateIcon.textContent = "📅";
      dateIcon.style.cssText = "width:40px;height:40px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;";
      dateRow.appendChild(dateIcon);
      const dateInfo = document.createElement("div");
      const dateLabel = document.createElement("div");
      dateLabel.textContent = "Fecha";
      dateLabel.style.cssText = "font-size:12px;color:#92400e;";
      dateInfo.appendChild(dateLabel);
      const dateVal = document.createElement("div");
      dateVal.textContent = formattedDate;
      dateVal.style.cssText = "font-size:16px;font-weight:700;color:#1f2937;text-transform:capitalize;";
      dateInfo.appendChild(dateVal);
      dateRow.appendChild(dateInfo);
      card.appendChild(dateRow);

      // Time row
      const timeRow = document.createElement("div");
      timeRow.style.cssText = "display:flex;align-items:center;gap:12px;margin-bottom:16px;";
      const timeIcon = document.createElement("div");
      timeIcon.textContent = "🕐";
      timeIcon.style.cssText = "width:40px;height:40px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;";
      timeRow.appendChild(timeIcon);
      const timeInfo = document.createElement("div");
      const timeLabel = document.createElement("div");
      timeLabel.textContent = "Hora";
      timeLabel.style.cssText = "font-size:12px;color:#92400e;";
      timeInfo.appendChild(timeLabel);
      const timeVal = document.createElement("div");
      timeVal.textContent = formatTime(time);
      timeVal.style.cssText = "font-size:16px;font-weight:700;color:#1f2937;";
      timeInfo.appendChild(timeVal);
      timeRow.appendChild(timeInfo);
      card.appendChild(timeRow);

      // Location row
      if (location) {
        const locRow = document.createElement("div");
        locRow.style.cssText = "display:flex;align-items:center;gap:12px;";
        const locIcon = document.createElement("div");
        locIcon.textContent = "📍";
        locIcon.style.cssText = "width:40px;height:40px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;";
        locRow.appendChild(locIcon);
        const locInfo = document.createElement("div");
        const locLabel = document.createElement("div");
        locLabel.textContent = "Lugar";
        locLabel.style.cssText = "font-size:12px;color:#92400e;";
        locInfo.appendChild(locLabel);
        const locVal = document.createElement("div");
        locVal.textContent = location;
        locVal.style.cssText = "font-size:16px;font-weight:700;color:#1f2937;";
        locInfo.appendChild(locVal);
        locRow.appendChild(locInfo);
        card.appendChild(locRow);
      }

      cardWrap.appendChild(card);
      container.appendChild(cardWrap);

      // Motivational message
      const msgWrap = document.createElement("div");
      msgWrap.style.cssText = "padding:16px 28px;position:relative;z-index:1;";
      const msgBox = document.createElement("div");
      msgBox.style.cssText = "background:rgba(255,255,255,0.12);border-radius:12px;padding:16px;border:1px solid rgba(245,158,11,0.2);";
      const msgText = document.createElement("div");
      msgText.textContent = "🙏 Recordemos que la adoración requiere preparación.";
      msgText.style.cssText = "color:#fef3c7;text-align:center;font-size:14px;line-height:1.5;";
      msgBox.appendChild(msgText);

      if (additionalNotes) {
        const notesEl = document.createElement("div");
        notesEl.textContent = additionalNotes;
        notesEl.style.cssText = "color:rgba(255,255,255,0.7);text-align:center;font-size:13px;margin-top:8px;line-height:1.4;white-space:pre-wrap;";
        msgBox.appendChild(notesEl);
      }

      msgWrap.appendChild(msgBox);
      container.appendChild(msgWrap);

      // Bottom padding
      const bottomPad = document.createElement("div");
      bottomPad.style.height = "24px";
      container.appendChild(bottomPad);

      // Render
      document.body.appendChild(container);
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      document.body.removeChild(container);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ensayo-extraordinario-${date}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");

      toast({ title: "Imagen descargada" });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({ title: "Error al descargar", variant: "destructive" });
    }
  };

  const shareImage = async () => {
    try {
      await downloadImage();
      toast({ title: "Imagen lista para compartir" });
    } catch {
      toast({ title: "Error al compartir", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 rounded-3xl shadow-2xl relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 pointer-events-none" />

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full text-white/80 hover:text-white hover:bg-white/20 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
              <img src={arcanaLogo} alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <div className="flex-1">
              <p className="text-amber-200/90 text-xs font-medium uppercase tracking-wide">Ensayo Extraordinario</p>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-amber-300" />
                <span className="text-amber-200 text-xs font-semibold">TODOS LOS GRUPOS</span>
              </div>
            </div>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
              <Flame className="w-8 h-8 text-amber-200" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-bold text-white text-center leading-tight">
            {activityName}
          </h2>

          {specialEventName && (
            <div className="mt-2 flex justify-center">
              <span className="bg-amber-500/30 text-amber-100 text-xs font-semibold px-3 py-1 rounded-full border border-amber-400/30">
                🌟 {specialEventName}
              </span>
            </div>
          )}
        </div>

        {/* Details card */}
        <div className="px-5">
          <div className="bg-white/90 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha</p>
                <p className="font-semibold text-sm text-gray-800 capitalize">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Hora</p>
                <p className="font-semibold text-sm text-gray-800">{formatTime(time)}</p>
              </div>
            </div>

            {location && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-base">📍</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Lugar</p>
                  <p className="font-semibold text-sm text-gray-800">{location}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Motivational message */}
        <div className="px-5 mt-3">
          <div className="bg-white/15 rounded-xl p-3 border border-amber-400/20">
            <p className="text-amber-100 text-center text-sm leading-relaxed">
              🙏 Recordemos que la adoración requiere preparación.
            </p>
            {additionalNotes && (
              <p className="text-white/80 text-center text-xs mt-1 leading-relaxed whitespace-pre-wrap">
                {additionalNotes}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-5 pt-4 space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={downloadImage}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/30 py-5 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
            <Button
              onClick={shareImage}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/30 py-5 rounded-xl"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>
          <Button
            onClick={onClose}
            className="w-full bg-amber-600/50 hover:bg-amber-600/70 text-white py-5 text-base font-semibold rounded-xl"
          >
            ¡Entendido!
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExtraordinaryRehearsalOverlay;
