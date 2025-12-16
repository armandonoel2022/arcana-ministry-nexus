import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Lightbulb, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface DailyAdviceOverlayProps {
  title: string;
  message: string;
  onClose: () => void;
}

export const DailyAdviceOverlay = ({ title, message, onClose }: DailyAdviceOverlayProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `consejo-del-dia-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Imagen descargada');
    } catch (error) {
      console.error('Error al descargar:', error);
      toast.error('Error al descargar imagen');
    }
  };

  const handleShare = async () => {
    const shareText = `💡 Consejo del Día: ${title}\n\n"${message}"\n\n— Ministerio de Adoración ARCANA`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Consejo del Día',
          text: shareText,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareText);
          toast.success('Copiado al portapapeles');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Copiado al portapapeles');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card ref={cardRef} className="w-full max-w-2xl bg-gradient-to-br from-yellow-50 via-white to-orange-50 border-2 border-yellow-200 shadow-2xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-30 -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-30 translate-y-32 -translate-x-32" />
        
        <div className="relative p-8">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Lightbulb className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Consejo del Día
          </h2>

          {/* Advice title */}
          <h3 className="text-2xl font-bold text-center mb-4 text-gray-800">
            {title}
          </h3>

          {/* Advice text */}
          <div className="bg-white/80 rounded-lg p-6 mb-6 shadow-inner border border-yellow-100">
            <p className="text-xl text-gray-800 leading-relaxed text-center">
              {message}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="border-yellow-300 hover:bg-yellow-50"
              >
                <Download className="w-4 h-4 mr-1" />
                Descargar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-yellow-300 hover:bg-yellow-50"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Compartir
              </Button>
            </div>
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-8 py-3 text-lg"
            >
              Amén
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
