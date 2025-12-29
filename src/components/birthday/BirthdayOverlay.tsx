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
  const [generalRoomId, setGeneralRoomId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodaysBirthdays();
    fetchGeneralRoomId();
    
    // Listen for test overlay trigger using custom event
    const handleTestOverlay = (event: Event) => {
      const customEvent = event as CustomEvent<Member>;
      if (customEvent.detail) {
        // Clear any dismissal for today for this member so overlay shows immediately
        const today = new Date().toDateString();
        try {
          const dismissed = JSON.parse(localStorage.getItem('dismissedBirthdays') || '{}');
          if (dismissed[today]) {
            dismissed[today] = dismissed[today].filter((id: string) => id !== customEvent.detail!.id);
            localStorage.setItem('dismissedBirthdays', JSON.stringify(dismissed));
          }
        } catch {}
        setDismissedIds((ids) => ids.filter((id) => id !== customEvent.detail!.id));
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

  const fetchGeneralRoomId = async () => {
    try {
      const { data } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('name', 'Sala General')
        .eq('is_active', true)
        .single();
      if (data) setGeneralRoomId(data.id);
    } catch (error) {
      console.error('Error fetching general room:', error);
    }
  };

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
    if (generalRoomId) {
      navigate(`/communication?roomId=${generalRoomId}`);
    } else {
      navigate('/communication');
    }
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
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
          {activeBirthdays.map((member) => (
            <Card 
              key={member.id} 
              className="bg-gradient-to-br from-blue-50 via-white to-blue-100 border-4 border-blue-200 shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => handleDismiss(member.id)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 transition-colors z-10 bg-white/80 rounded-full p-1.5 hover:bg-white"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-8 text-center space-y-6">
                {/* Logo ADN */}
                <div className="flex justify-center">
                  <img 
                    src="/lovable-uploads/74634c97-a2ef-403b-9fa0-89d9207b7b00.png" 
                    alt="ADN Ministerio Logo" 
                    className="w-20 h-auto"
                  />
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-4xl font-bold text-orange-500 mb-3">
                    ¡Feliz Cumpleaños!
                  </h2>
                  <div className="text-5xl mb-2">🎉🎂🎈</div>
                </div>

                {/* Member Info */}
                <div className="flex flex-col items-center space-y-5">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-red-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                    <Avatar className="relative w-32 h-32 border-4 border-white shadow-2xl">
                      <AvatarImage
                        src={member.photo_url || undefined}
                        alt={`${member.nombres} ${member.apellidos}`}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-4xl">
                        {member.nombres.charAt(0)}{member.apellidos.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-3xl font-bold text-blue-600">
                      {member.nombres} {member.apellidos}
                    </h3>
                    <p className="text-xl text-blue-500">
                      {getRoleLabel(member.cargo)}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 rounded-2xl p-8 border-2 border-orange-200 shadow-inner">
                  <p className="text-xl text-gray-700 leading-relaxed">
                    En tu día especial, toda la familia del{" "}
                    <span className="font-bold text-orange-600">Ministerio ADN Arca de Noé</span>{" "}
                    te desea un feliz cumpleaños lleno de bendiciones y alegría. ✨
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                  <Button
                    onClick={() => handleGoToCelebrate(member.id)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-10 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Ir a Celebrar
                  </Button>
                  <Button
                    onClick={() => handleDismiss(member.id)}
                    variant="outline"
                    className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-10 py-6 text-lg font-semibold transition-all duration-200"
                  >
                    Cerrar
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
