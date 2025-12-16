import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, BookOpen, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface DailyVerseOverlayProps {
  verseText: string;
  verseReference: string;
  onClose: () => void;
}

export const DailyVerseOverlay = ({ verseText, verseReference, onClose }: DailyVerseOverlayProps) => {
  const downloadRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!downloadRef.current) return;
    
    try {
      const canvas = await html2canvas(downloadRef.current, {
        backgroundColor: '#f0f9ff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `versiculo-del-dia-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Imagen descargada');
    } catch (error) {
      console.error('Error al descargar:', error);
      toast.error('Error al descargar imagen');
    }
  };

  const handleShare = async () => {
    const shareText = `📖 Versículo del Día\n\n"${verseText}"\n\n— ${verseReference}\n\n— Ministerio de Adoración ARCANA`;
    
    await navigator.clipboard.writeText(shareText);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-blue-200 shadow-2xl relative overflow-hidden">
        {/* Close button - outside downloadable area */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full hover:bg-gray-200 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Downloadable content */}
        <div ref={downloadRef} className="bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30 -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-30 translate-y-32 -translate-x-32" />
          
          <div className="relative p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Versículo del Día
            </h2>

            {/* Verse text */}
            <div className="bg-white/80 rounded-lg p-6 mb-4 shadow-inner border border-blue-100">
              <p className="text-xl text-gray-800 leading-relaxed text-center font-serif italic">
                "{verseText}"
              </p>
            </div>

            {/* Reference */}
            <p className="text-center text-lg font-semibold text-blue-700 mb-4">
              - {verseReference}
            </p>

            {/* Ministry signature for download */}
            <p className="text-center text-sm text-gray-500">
              Ministerio de Adoración ARCANA
            </p>
          </div>
        </div>

        {/* Action buttons - outside downloadable area */}
        <div className="relative p-4 pt-0 flex flex-col sm:flex-row justify-center gap-3">
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="border-blue-300 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-1" />
              Descargar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="border-blue-300 hover:bg-blue-50"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Compartir
            </Button>
          </div>
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            Amén
          </Button>
        </div>
      </Card>
    </div>
  );
};
