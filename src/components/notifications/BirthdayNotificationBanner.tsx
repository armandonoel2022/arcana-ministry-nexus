import React, { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Clock, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConfettiEffect from "@/components/birthday/ConfettiEffect";

interface BirthdayNotificationBannerProps {
  notification: {
    id: string;
    title: string;
    message: string;
    metadata: {
      birthday_member_name?: string;
      birthday_member_photo?: string;
      birthday_date: string;
      is_birthday_person?: boolean;
    };
  };
  onDismiss: () => void;
}

const BirthdayNotificationBanner: React.FC<BirthdayNotificationBannerProps> = ({
  notification,
  onDismiss
}) => {
  const navigate = useNavigate();

  // Reproducir sonido de cumpleaños al montar el componente
  useEffect(() => {
    playBirthdaySound();
  }, []);

  const playBirthdaySound = () => {
    try {
      // Crear un audio con una melodía de cumpleaños simple usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Melodía de "Happy Birthday" simplificada
      const notes = [
        { freq: 261.63, duration: 0.3 }, // C
        { freq: 261.63, duration: 0.2 }, // C
        { freq: 293.66, duration: 0.4 }, // D
        { freq: 261.63, duration: 0.4 }, // C
        { freq: 349.23, duration: 0.4 }, // F
        { freq: 329.63, duration: 0.8 }, // E
      ];

      let currentTime = audioContext.currentTime;
      
      notes.forEach((note) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(note.freq, currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + note.duration);
        
        currentTime += note.duration + 0.1;
      });
    } catch (error) {
      console.log('No se pudo reproducir el sonido de cumpleaños:', error);
    }
  };

  const goToChatRoom = () => {
    navigate('/communication');
    onDismiss();
  };

  const dismissNotification = () => {
    onDismiss();
  };

  return (
    <>
      <ConfettiEffect trigger={true} onComplete={() => {}} />
      <Card className="border-pink-200 bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 shadow-lg border-2">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {/* Icono de regalo y foto */}
            <div className="flex-shrink-0">
              <div className="relative">
                <Gift className="w-8 h-8 text-pink-500 absolute -top-2 -right-2 z-10" />
                <Avatar className="w-16 h-16 border-3 border-pink-300">
                  <AvatarImage
                    src={notification.metadata.birthday_member_photo}
                    alt={notification.metadata.birthday_member_name || 'Integrante del ministerio'}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-r from-pink-400 to-purple-400 text-white text-lg font-bold">
                    {notification.metadata.birthday_member_name 
                      ? notification.metadata.birthday_member_name.split(' ').map(n => n[0]).join('')
                      : '?'
                    }
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Contenido de la notificación */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-bold text-pink-800 mb-1 flex items-center gap-2">
                  {notification.title}
                  <span className="text-2xl">🎉</span>
                </h3>
                {notification.metadata.is_birthday_person ? (
                  <p className="text-pink-700 font-medium">
                    ¡{notification.metadata.birthday_member_name?.split(' ')[0] || 'Amigo/a'}, hoy es tu día especial!
                    Que Dios te bendiga grandemente en este nuevo año de vida. ✨
                  </p>
                ) : (
                  <p className="text-pink-700">
                    ¡Hoy está de cumpleaños <strong>{notification.metadata.birthday_member_name || 'un integrante del ministerio'}</strong>!
                    Recuerda ir a la sala de chat general y dedicarle un mensaje de felicitación. 
                    ¡Hagamos que se sienta especial en su día! ✨
                  </p>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={goToChatRoom}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white flex items-center gap-2"
                  size="sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Ir a la sala de chat
                </Button>
                <Button
                  onClick={dismissNotification}
                  variant="outline"
                  size="sm"
                  className="border-pink-300 text-pink-700 hover:bg-pink-50 flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  De acuerdo, lo haré más tarde
                </Button>
              </div>

              {/* Decoración de cumpleaños */}
              <div className="flex justify-center space-x-2 text-2xl pt-2">
                <span>🎂</span>
                <span>🎈</span>
                <span>🎁</span>
                <span>🎊</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default BirthdayNotificationBanner;