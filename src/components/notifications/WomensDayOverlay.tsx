import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Heart, Sparkles, Star, Download } from 'lucide-react';
import arcanaLogo from '@/assets/arca-noe-logo.png';
import { toast } from 'sonner';

interface WomensDayOverlayProps {
  onClose: () => void;
}

const WomensDayOverlay: React.FC<WomensDayOverlayProps> = ({ onClose }) => {
  const downloadImage = useCallback(async () => {
    try {
      const canvas = document.createElement('canvas');
      const W = 1080, H = 1920;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#ec4899');
      grad.addColorStop(0.5, '#db2777');
      grad.addColorStop(1, '#be123c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Decorative circles
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.arc(W - 80, 120, 200, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(60, H - 400, 160, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W / 2, H / 2 - 100, 300, 0, Math.PI * 2); ctx.fill();

      // Small hearts decoration
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '60px serif';
      ctx.fillText('♥', 100, 300);
      ctx.font = '40px serif';
      ctx.fillText('♥', W - 150, 350);
      ctx.font = '50px serif';
      ctx.fillText('♥', 150, H - 500);
      ctx.font = '35px serif';
      ctx.fillText('✦', W - 120, 500);
      ctx.fillText('✦', 80, 600);

      // Logo circle
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => resolve();
        logoImg.src = arcanaLogo;
      });

      const logoSize = 160;
      const logoCenterX = W / 2;
      const logoY = 200;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.arc(logoCenterX, logoY, logoSize / 2 + 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 20;
      ctx.drawImage(logoImg, logoCenterX - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize);
      ctx.shadowBlur = 0;

      // Date badge
      const badgeY = 340;
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      const badgeW = 320, badgeH = 60;
      const badgeX = (W - badgeW) / 2;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 30);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('♥  8 de Marzo  ♥', W / 2, badgeY + 40);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Día Internacional', W / 2, 500);
      ctx.fillText('de la Mujer', W / 2, 580);

      // White card
      const cardX = 60, cardY = 640, cardW = W - 120, cardH = 620;
      ctx.fillStyle = 'rgba(255,255,255,0.93)';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 30);
      ctx.fill();

      // Card content
      ctx.fillStyle = '#1f2937';
      ctx.font = '32px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const msg1 = 'Hoy celebramos a todas las mujeres';
      const msg2 = 'valientes, fuertes y llenas de fe que';
      const msg3 = 'forman parte de nuestro ministerio.';
      ctx.fillText(msg1, W / 2, cardY + 70);
      ctx.fillText(msg2, W / 2, cardY + 110);
      ctx.fillText(msg3, W / 2, cardY + 150);

      ctx.fillStyle = '#374151';
      ctx.font = '28px system-ui, sans-serif';
      const msg4 = 'Su dedicación, amor y servicio son';
      const msg5 = 'fundamentales en la obra del Señor.';
      const msg6 = 'Gracias por inspirarnos cada día';
      const msg7 = 'con su testimonio y entrega.';
      ctx.fillText(msg4, W / 2, cardY + 230);
      ctx.fillText(msg5, W / 2, cardY + 270);
      ctx.fillText(msg6, W / 2, cardY + 310);
      ctx.fillText(msg7, W / 2, cardY + 350);

      // Verse
      ctx.fillStyle = '#db2777';
      ctx.font = 'italic bold 30px system-ui, sans-serif';
      ctx.fillText('"Encomienda a Jehová tu camino,', W / 2, cardY + 440);
      ctx.fillText('y confía en él; y él hará."', W / 2, cardY + 480);
      ctx.font = '26px system-ui, sans-serif';
      ctx.fillStyle = '#ec4899';
      ctx.fillText('— Salmos 37:5', W / 2, cardY + 530);

      // Special message banner
      const bannerY = cardY + cardH + 40;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.roundRect(cardX, bannerY, cardW, 140, 20);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillText('✦  ¡Feliz Día!  ✦', W / 2, bannerY + 55);
      ctx.font = '26px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText('Que Dios bendiga a cada una de ustedes', W / 2, bannerY + 105);

      // Ministry footer (right after banner)
      const footerY = bannerY + 140 + 40;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.roundRect(60, footerY, W - 120, 120, 20);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText('Ministerio de Alabanza', W / 2, footerY + 50);
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText('Arca de Noé', W / 2, footerY + 85);

      // Trim canvas to actual content height
      const finalH = footerY + 120 + 60;
      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = W;
      trimmedCanvas.height = finalH;
      const trimCtx = trimmedCanvas.getContext('2d')!;
      trimCtx.drawImage(canvas, 0, 0);

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dia-internacional-mujer-2026.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Imagen descargada');
      }, 'image/png');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar la imagen');
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-gradient-to-b from-pink-400 via-pink-500 to-rose-600 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Animated decorations */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 animate-pulse" />
        <div className="absolute bottom-20 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2" />
        
        {/* Floating hearts */}
        <div className="absolute top-20 left-10 animate-bounce" style={{ animationDelay: '0s' }}>
          <Heart className="w-6 h-6 text-white/40 fill-white/40" />
        </div>
        <div className="absolute top-32 right-12 animate-bounce" style={{ animationDelay: '0.5s' }}>
          <Heart className="w-4 h-4 text-white/30 fill-white/30" />
        </div>
        <div className="absolute bottom-40 left-8 animate-bounce" style={{ animationDelay: '1s' }}>
          <Star className="w-5 h-5 text-white/40 fill-white/40" />
        </div>
        <div className="absolute top-48 right-8 animate-bounce" style={{ animationDelay: '1.5s' }}>
          <Sparkles className="w-5 h-5 text-white/40" />
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full text-white/80 hover:text-white hover:bg-white/20 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Content */}
        <div className="relative p-6 pt-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
              <img src={arcanaLogo} alt="Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>

          {/* Date badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full">
              <Heart className="w-4 h-4 text-white fill-white" />
              <span className="text-white font-medium">8 de Marzo</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-2 leading-tight">
            Día Internacional
            <br />de la Mujer
          </h1>

          {/* Message */}
          <div className="bg-white/90 rounded-2xl p-5 mt-6 shadow-lg">
            <p className="text-gray-800 text-center leading-relaxed mb-4">
              Hoy celebramos a todas las mujeres valientes, fuertes y llenas de fe que forman parte de nuestro ministerio.
            </p>
            
            <p className="text-gray-700 text-center text-sm leading-relaxed mb-4">
              Su dedicación, amor y servicio son fundamentales en la obra del Señor. 
              Gracias por inspirarnos cada día con su testimonio y entrega.
            </p>

            <div className="text-center">
              <p className="text-pink-600 font-semibold italic">
                "Encomienda a Jehová tu camino, y confía en él; y él hará."
              </p>
              <p className="text-pink-500 text-sm mt-1">- Salmos 37:5</p>
            </div>
          </div>

          {/* Special message */}
          <div className="mt-4 bg-white/20 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-white">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">¡Feliz Día!</span>
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-white/80 text-sm mt-1">
              Que Dios bendiga a cada una de ustedes
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-6 pt-4 flex flex-col gap-3">
          <Button
            onClick={downloadImage}
            className="w-full bg-white/20 hover:bg-white/30 text-white py-5 text-base font-semibold rounded-xl border border-white/30"
          >
            <Download className="w-5 h-5 mr-2" />
            Descargar Imagen
          </Button>
          <Button
            onClick={onClose}
            className="w-full bg-white hover:bg-white/90 text-pink-600 py-6 text-lg font-semibold rounded-xl shadow-lg"
          >
            <Heart className="w-5 h-5 mr-2 fill-pink-600" />
            Gracias
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WomensDayOverlay;
