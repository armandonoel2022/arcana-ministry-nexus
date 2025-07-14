import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, Share } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  photo_url?: string;
  cargo: string;
}

interface BirthdayCardProps {
  member: Member;
  onDownload?: () => void;
}

const BirthdayCard: React.FC<BirthdayCardProps> = ({ member, onDownload }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const getRoleLabel = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      'pastor': 'Pastor',
      'pastora': 'Pastora',
      'director_alabanza': 'Director de Alabanza',
      'directora_alabanza': 'Directora de Alabanza',
      'director_musical': 'Director Musical',
      'corista': 'Corista',
      'directora_danza': 'Directora de Danza',
      'director_multimedia': 'Director Multimedia',
      'camarografo': 'Camarógrafo',
      'camarógrafa': 'Camarógrafa',
      'encargado_piso': 'Encargado de Piso',
      'encargada_piso': 'Encargada de Piso',
      'musico': 'Músico',
      'sonidista': 'Sonidista',
      'encargado_luces': 'Encargado de Luces',
      'encargado_proyeccion': 'Encargado de Proyección',
      'encargado_streaming': 'Encargado de Streaming'
    };
    return roleLabels[role] || role;
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const downloadImage = async () => {
    if (!cardRef.current) return;

    try {
      // Configuración optimizada para alta calidad
      const canvas = await html2canvas(cardRef.current, {
        scale: 4, // Aumentado para mejor calidad
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 800,
        height: 1200,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: 1200,
        imageTimeout: 10000, // Tiempo suficiente para cargar imágenes
        removeContainer: true,
        foreignObjectRendering: false, // Mejora compatibilidad
        logging: false, // Desactivar logs para mejor rendimiento
      });

      // Crear enlace de descarga con máxima calidad
      const link = document.createElement('a');
      link.download = `cumpleanos-${member.nombres.toLowerCase()}-${member.apellidos.toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast({
        title: "¡Descarga exitosa!",
        description: "La tarjeta de cumpleaños se ha descargado correctamente",
      });

      onDownload?.();
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Vista previa de la tarjeta */}
      <div 
        ref={cardRef}
        className="mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 p-12 rounded-3xl shadow-2xl relative"
        style={{ 
          width: '800px', 
          height: '1200px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Encabezado con logo */}
        <div className="text-center mb-12">
          <img 
            src="/lovable-uploads/74634c97-a2ef-403b-9fa0-89d9207b7b00.png" 
            alt="ADN Ministerio Logo" 
            className="w-32 h-auto mx-auto mb-4"
            style={{ 
              maxWidth: '128px',
              height: 'auto',
              imageRendering: 'crisp-edges'
            }}
          />
          <div className="text-2xl font-bold text-blue-600" style={{ fontWeight: '700' }}>Ministerio ADN</div>
          <div className="text-lg text-blue-500" style={{ fontWeight: '500' }}>Arca de Noé</div>
        </div>

        {/* Foto del integrante */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-red-500 rounded-full blur-md opacity-75 animate-pulse"></div>
            <Avatar className="relative w-64 h-64 border-8 border-white shadow-2xl">
              <AvatarImage
                src={member.photo_url || undefined}
                alt={`${member.nombres} ${member.apellidos}`}
                className="object-cover"
                style={{
                  imageRendering: 'crisp-edges',
                  objectFit: 'cover'
                }}
              />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-6xl font-bold">
                {member.nombres.charAt(0)}{member.apellidos.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Mensaje principal */}
        <div className="text-center space-y-8">
          <div 
            className="text-6xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent"
            style={{ fontWeight: '900', lineHeight: '1.1' }}
          >
            ¡Feliz Cumpleaños!
          </div>
          
          <div 
            className="text-4xl font-bold text-blue-600 mb-4"
            style={{ fontWeight: '700' }}
          >
            {getFirstName(member.nombres)}
          </div>
          
          <div 
            className="text-2xl text-blue-500 font-medium mb-8"
            style={{ fontWeight: '600' }}
          >
            {getRoleLabel(member.cargo)}
          </div>

          {/* Pastel decorativo */}
          <div className="text-8xl mb-8" style={{ fontSize: '6rem', lineHeight: '1' }}>🎂</div>

          {/* Mensaje de felicitación */}
          <div className="bg-white/90 p-8 rounded-2xl shadow-lg max-w-2xl mx-auto border border-gray-100">
            <p 
              className="text-2xl leading-relaxed text-gray-700 font-medium"
              style={{ fontWeight: '500', lineHeight: '1.4' }}
            >
              Gracias por tu entrega y pasión en el ministerio ADN Arca de Noé.
            </p>
            <p 
              className="text-3xl font-bold text-blue-600 mt-6"
              style={{ fontWeight: '700' }}
            >
              ¡Que Dios te bendiga!
            </p>
          </div>

          {/* Decoración inferior */}
          <div 
            className="flex justify-center items-center space-x-4 text-4xl mt-12"
            style={{ fontSize: '3rem' }}
          >
            <span>🎉</span>
            <span>🎈</span>
            <span>🎁</span>
            <span>🎊</span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={downloadImage} 
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          size="lg"
        >
          <Download className="w-5 h-5" />
          Descargar PNG HD para WhatsApp
        </Button>
      </div>
    </div>
  );
};

export default BirthdayCard;