import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Gift, MessageCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import ConfettiEffect from './ConfettiEffect';

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  photo_url?: string;
  cargo: string;
  fecha_nacimiento: string;
}

export const BirthdayOverlay = () => {
  const [birthdayMembers, setBirthdayMembers] = useState<Member[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodaysBirthdays();
    
    // Listen for test overlay trigger using custom event
    const handleTestOverlay = (event: Event) => {
      const customEvent = event as CustomEvent<Member>;
      if (customEvent.detail) {
        setBirthdayMembers([customEvent.detail]);
      }
    };
    
    window.addEventListener('testBirthdayOverlay', handleTestOverlay);
    
    // Check every hour for new birthdays
    const interval = setInterval(fetchTodaysBirthdays, 3600000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('testBirthdayOverlay', handleTestOverlay);
    };
  }, []);

  const fetchTodaysBirthdays = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, nombres, apellidos, photo_url, cargo, fecha_nacimiento')
        .eq('is_active', true)
        .not('fecha_nacimiento', 'is', null);

      if (error) throw error;

      // Filter birthdays for today in RD timezone
      const todayStr = new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Santo_Domingo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [, monthStr, dayStr] = todayStr.split('-');
      const tzMonth = Number(monthStr);
      const tzDay = Number(dayStr);

      const todaysBirthdays = (data || []).filter(member => {
        if (!member.fecha_nacimiento) return false;
        const [, m, d] = member.fecha_nacimiento.split('-').map(Number);
        return m === tzMonth && d === tzDay;
      });

      setBirthdayMembers(todaysBirthdays);
    } catch (error) {
      console.error('Error fetching birthdays:', error);
    }
  };

  const handleDismiss = (memberId: string) => {
    setDismissedIds(prev => [...prev, memberId]);
    // Store in localStorage to persist dismissal
    const dismissed = JSON.parse(localStorage.getItem('dismissedBirthdays') || '{}');
    const today = new Date().toDateString();
    dismissed[today] = [...(dismissed[today] || []), memberId];
    localStorage.setItem('dismissedBirthdays', JSON.stringify(dismissed));
  };

  const handleGoToCelebrate = (memberId: string) => {
    handleDismiss(memberId);
    navigate('/communication');
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

  // Filter out dismissed birthdays
  const activeBirthdays = birthdayMembers.filter(member => {
    if (dismissedIds.includes(member.id)) return false;
    
    // Check localStorage for today's dismissals
    const dismissed = JSON.parse(localStorage.getItem('dismissedBirthdays') || '{}');
    const today = new Date().toDateString();
    return !dismissed[today]?.includes(member.id);
  });

  if (activeBirthdays.length === 0) return null;

  return (
    <>
      <ConfettiEffect trigger={activeBirthdays.length > 0} />
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          {activeBirthdays.map((member) => (
            <Card 
              key={member.id} 
              className="bg-gradient-to-br from-blue-50 via-white to-blue-100 border-4 border-blue-200 shadow-2xl mb-4 relative"
            >
              <button
                onClick={() => handleDismiss(member.id)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 sm:p-8 text-center space-y-6">
                {/* Logo ADN */}
                <div className="flex justify-center">
                  <img 
                    src="/lovable-uploads/74634c97-a2ef-403b-9fa0-89d9207b7b00.png" 
                    alt="ADN Ministerio Logo" 
                    className="w-16 h-auto"
                  />
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-orange-500 mb-2">
                    ¡Feliz Cumpleaños!
                  </h2>
                  <div className="text-4xl sm:text-5xl">🎉🎂🎈</div>
                </div>

                {/* Member Info */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-red-500 rounded-full blur-sm opacity-60"></div>
                    <Avatar className="relative w-24 h-24 sm:w-32 sm:h-32 border-4 border-white shadow-lg">
                      <AvatarImage
                        src={member.photo_url || undefined}
                        alt={`${member.nombres} ${member.apellidos}`}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-3xl">
                        {member.nombres.charAt(0)}{member.apellidos.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {member.nombres} {member.apellidos}
                    </h3>
                    <p className="text-lg text-blue-500 mt-1">
                      {getRoleLabel(member.cargo)}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-white/90 backdrop-blur rounded-lg p-4 border border-gray-100">
                  <p className="text-lg text-gray-700 font-medium">
                    ¡Hoy es un día especial! 🎊
                  </p>
                  <p className="text-gray-600 mt-2">
                    Celebremos juntos este día maravilloso
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={() => handleGoToCelebrate(member.id)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-6 text-lg shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Ir a Felicitarlo
                  </Button>
                  <Button
                    onClick={() => handleDismiss(member.id)}
                    variant="outline"
                    className="flex-1 border-2 border-blue-400 text-blue-700 hover:bg-blue-50 py-6 text-lg font-semibold"
                  >
                    Después
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};
