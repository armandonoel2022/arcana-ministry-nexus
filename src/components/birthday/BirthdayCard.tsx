import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import ConfettiEffect from './ConfettiEffect';

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
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();

  // Mostrar confeti cuando se monta el componente
  React.useEffect(() => {
    setShowConfetti(true);
  }, []);

  const playBirthdaySound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [
      { freq: 261.63, duration: 500 }, // C4 - Happy
      { freq: 261.63, duration: 500 }, // C4 - Birth-
      { freq: 293.66, duration: 1000 }, // D4 - day
      { freq: 261.63, duration: 500 }, // C4 - to
      { freq: 349.23, duration: 1000 }, // F4 - you
      { freq: 329.63, duration: 2000 }, // E4 - (hold)
    ];

    let startTime = audioContext.currentTime;
    
    notes.forEach((note, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(note.freq, startTime);
      gainNode.gain.setValueAtTime(0.1, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration / 1000);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + note.duration / 1000);
      
      startTime += note.duration / 1000;
    });
  };

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
      // Scroll al inicio para asegurar captura completa
      window.scrollTo(0, 0);
      
      // Esperar un momento para que se posicione correctamente
      await new Promise(resolve => setTimeout(resolve, 500));

      // Configuración simplificada y más compatible
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Reducido para mejor compatibilidad
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#f8fafc',
        logging: true, // Habilitado para debugging
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Asegurar que los estilos se apliquen correctamente
          const clonedElement = clonedDoc.querySelector('[data-birthday-card]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.position = 'relative';
          }
        }
      });

      // Crear enlace de descarga
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
    <>
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="space-y-6 animate-fade-in">
        {/* Vista previa de la tarjeta */}
        <div 
          ref={cardRef}
          data-birthday-card="true"
          className="mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
          style={{ 
            width: '600px', 
            height: '900px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            minHeight: '900px',
            maxWidth: '600px'
          }}
        >
          {/* Encabezado con logo */}
          <div className="text-center mb-8">
            <img 
              src="/lovable-uploads/74634c97-a2ef-403b-9fa0-89d9207b7b00.png" 
              alt="ADN Ministerio Logo" 
              className="w-24 h-auto mx-auto mb-3"
              style={{ 
                maxWidth: '96px',
                height: 'auto'
              }}
            />
            <div 
              className="text-xl font-bold text-blue-600" 
              style={{ 
                fontWeight: '700',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
              }}
            >
              Ministerio ADN
            </div>
            <div 
              className="text-base text-blue-500" 
              style={{ 
                fontWeight: '500',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
              }}
            >
              Arca de Noé
            </div>
          </div>

          {/* Foto del integrante */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-red-500 rounded-full blur-sm opacity-60"></div>
              <Avatar className="relative w-48 h-48 border-6 border-white shadow-xl">
                <AvatarImage
                  src={member.photo_url || undefined}
                  alt={`${member.nombres} ${member.apellidos}`}
                  className="object-cover"
                  style={{
                    objectFit: 'cover'
                  }}
                  crossOrigin="anonymous"
                  data-radix-avatar-image="true"
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-4xl font-bold">
                  {member.nombres.charAt(0)}{member.apellidos.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Mensaje principal */}
          <div className="text-center space-y-6">
            <div 
              className="text-4xl font-bold text-orange-500"
              style={{ 
                fontWeight: '900', 
                lineHeight: '1.1',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                color: '#f97316'
              }}
            >
              ¡Feliz Cumpleaños!
            </div>
            
            <div 
              className="text-3xl font-bold text-blue-600 text-center"
              style={{ 
                fontWeight: '700',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                lineHeight: '1.2'
              }}
            >
              <div className="mb-2">{member.nombres}</div>
              <div>{member.apellidos}</div>
            </div>
            
            <div 
              className="text-xl text-blue-500 font-medium"
              style={{ 
                fontWeight: '600',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
              }}
            >
              {getRoleLabel(member.cargo)}
            </div>

            {/* Pastel decorativo */}
            <div className="text-6xl mb-6" style={{ fontSize: '4rem', lineHeight: '1' }}>🎂</div>

            {/* Mensaje de felicitación */}
            <div className="bg-white/90 p-6 rounded-2xl shadow-lg mx-auto border border-gray-100" style={{ maxWidth: '480px' }}>
              <p 
                className="text-lg leading-relaxed text-gray-700 font-medium"
                style={{ 
                  fontWeight: '500', 
                  lineHeight: '1.4',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}
              >
                Gracias por tu entrega y pasión en el ministerio ADN Arca de Noé.
              </p>
              <p 
                className="text-2xl font-bold text-blue-600 mt-4"
                style={{ 
                  fontWeight: '700',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}
              >
                ¡Que Dios te bendiga!
              </p>
            </div>

            {/* Decoración inferior */}
            <div 
              className="flex justify-center items-center space-x-3 text-3xl mt-8"
              style={{ fontSize: '2.5rem' }}
            >
              <span>🎉</span>
              <span>🎈</span>
              <span>🎁</span>
              <span>🎊</span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-center">
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
    </>
  );
};

export default BirthdayCard;