import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Lightbulb, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DailyAdviceOverlayProps {
  title?: string;
  message?: string;
  onClose: () => void;
}

export const DailyAdviceOverlay = ({ title: propTitle, message: propMessage, onClose }: DailyAdviceOverlayProps) => {
  const downloadRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(propTitle || '');
  const [message, setMessage] = useState(propMessage || '');
  const [loading, setLoading] = useState(!propTitle);

  // Auto-cargar consejo si no se proporcionaron props
  useEffect(() => {
    const loadAdvice = async () => {
      if (propTitle && propMessage) {
        setTitle(propTitle);
        setMessage(propMessage);
        setLoading(false);
        return;
      }

      try {
        // Cargar consejos activos de la base de datos
        const { data: adviceList } = await supabase
          .from('daily_advice')
          .select('*')
          .eq('is_active', true);

        if (adviceList && adviceList.length > 0) {
          // Seleccionar uno aleatorio
          const randomAdvice = adviceList[Math.floor(Math.random() * adviceList.length)];
          setTitle(randomAdvice.title);
          setMessage(randomAdvice.message);
        } else {
          // Fallback
          setTitle('Prepárate con tiempo');
          setMessage('Recuerda revisar el repertorio de canciones para el servicio del próximo domingo. La preparación anticipada mejora la calidad de la alabanza.');
        }
      } catch (error) {
        console.error('Error loading advice:', error);
        // Fallback
        setTitle('Consejo musical');
        setMessage('La práctica constante es la clave del éxito musical.');
      } finally {
        setLoading(false);
      }
    };

    loadAdvice();
  }, [propTitle, propMessage]);

  const handleDownload = async () => {
    if (!downloadRef.current) return;
    
    try {
      const canvas = await html2canvas(downloadRef.current, {
        backgroundColor: '#fefce8',
        scale: 2,
        useCORS: true,
        logging: false,
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
    const shareText = `💡 Consejo del Día: ${title}\n\n"${message}"\n\n— ARCANA`;
    
    await navigator.clipboard.writeText(shareText);
    toast.success('Copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="text-white text-lg">Cargando consejo...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-yellow-50 via-white to-orange-50 border-2 border-yellow-200 shadow-2xl relative overflow-hidden">
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
        <div ref={downloadRef} className="relative overflow-hidden" style={{ backgroundColor: '#fefce8' }}>
          {/* Background decoration - using solid colors for html2canvas compatibility */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 -translate-y-32 translate-x-32" style={{ backgroundColor: '#fef08a' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-20 translate-y-32 -translate-x-32" style={{ backgroundColor: '#fed7aa' }} />
          
          <div className="relative p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#f59e0b' }}>
                <Lightbulb className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title - using solid color instead of gradient for html2canvas */}
            <h2 className="text-3xl font-bold text-center mb-6" style={{ color: '#d97706' }}>
              Consejo del Día
            </h2>

            {/* Advice title */}
            <h3 className="text-2xl font-bold text-center mb-4" style={{ color: '#1f2937' }}>
              {title}
            </h3>

            {/* Advice text */}
            <div className="rounded-lg p-6 mb-4 shadow-inner" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #fef08a' }}>
              <p className="text-xl leading-relaxed text-center" style={{ color: '#1f2937' }}>
                {message}
              </p>
            </div>

            {/* Ministry signature for download */}
            <p className="text-center text-sm" style={{ color: '#6b7280' }}>
              ARCANA
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
      </Card>
    </div>
  );
};
