import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, ArrowRight, Music, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import arcanaLogo from "@/assets/arca-noe-logo.png";

interface NotificationData {
  id: string;
  metadata: {
    service_id: string;
    service_title: string;
    service_date: string;
    new_director: string;
    new_director_photo?: string;
    original_director: string;
    original_director_photo?: string;
  };
}

const DirectorReplacementNotificationOverlay = () => {
  const [notification, setNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    checkForNewNotifications();

    // Listen for new director change notifications
    const channel = supabase
      .channel('director-change-notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'system_notifications',
          filter: 'type=eq.director_change'
        },
        () => checkForNewNotifications()
      )
      .subscribe();

    // Listen for test overlay events
    const handleTestOverlay = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationData>;
      if (customEvent.detail) {
        setNotification(customEvent.detail);
      }
    };

    window.addEventListener('testDirectorChangeNotification', handleTestOverlay);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('testDirectorChangeNotification', handleTestOverlay);
    };
  }, []);

  const checkForNewNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if there's already been a dismissed notification today
      const today = new Date().toDateString();
      const dismissed = JSON.parse(localStorage.getItem('dismissedDirectorChanges') || '{}');
      if (dismissed[today]) return;

      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('type', 'director_change')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not a "no rows" error
          throw error;
        }
        return;
      }

      if (data) {
        setNotification(data);
      }
    } catch (error) {
      console.error('Error checking for director change notifications:', error);
    }
  };

  const handleDismiss = async () => {
    if (!notification) return;

    try {
      // Mark notification as read
      await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      // Store dismissal in localStorage
      const today = new Date().toDateString();
      const dismissed = JSON.parse(localStorage.getItem('dismissedDirectorChanges') || '{}');
      dismissed[today] = true;
      localStorage.setItem('dismissedDirectorChanges', JSON.stringify(dismissed));

      setNotification(null);
    } catch (error) {
      console.error('Error dismissing notification:', error);
      setNotification(null);
    }
  };

  if (!notification) return null;

  const { metadata } = notification;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-500 border-4 border-blue-500">
        {/* Header with Logo */}
        <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white rounded-t-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-20 -mb-20"></div>
          <div className="relative z-10 flex items-center justify-center gap-3 py-2">
            <img src={arcanaLogo} alt="ADN Ministerio" className="w-12 h-12 rounded-full bg-white p-1" />
            <CardTitle className="text-3xl font-bold text-center">
              Reemplazo de Dirección de Alabanza
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          {/* Service Info */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl space-y-3 border-2 border-blue-200">
            <h3 className="text-2xl font-bold text-blue-900">{metadata.service_title}</h3>
            <div className="flex items-center justify-center gap-2 text-blue-700 text-lg">
              <Calendar className="w-6 h-6" />
              <span className="font-semibold">
                {metadata.service_date && format(new Date(metadata.service_date), "EEEE, dd 'de' MMMM 'a las' HH:mm", { locale: es })}
              </span>
            </div>
          </div>

          {/* Directors Comparison */}
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Original Director */}
            <div className="flex flex-col items-center space-y-3 p-4 bg-gray-50 rounded-xl">
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Solicitó</div>
              <Avatar className="w-24 h-24 border-4 border-gray-300 shadow-lg">
                <AvatarImage src={metadata.original_director_photo} alt={metadata.original_director} />
                <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white text-2xl">
                  {metadata.original_director?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-bold text-gray-900">{metadata.original_director}</div>
                <div className="text-sm text-gray-500">Director Original</div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="p-4 bg-blue-100 rounded-full">
                <ArrowRight className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {/* New Director */}
            <div className="flex flex-col items-center space-y-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300">
              <div className="text-sm font-medium text-blue-700 uppercase tracking-wide">Aceptó</div>
              <Avatar className="w-24 h-24 border-4 border-blue-500 shadow-lg ring-4 ring-blue-200">
                <AvatarImage src={metadata.new_director_photo} alt={metadata.new_director} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl">
                  {metadata.new_director?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-bold text-blue-900">{metadata.new_director}</div>
                <div className="text-sm text-blue-600 font-medium">Nuevo Director</div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-orange-700 font-medium">
              <Music className="w-5 h-5" />
              <span>En espera de la selección de canciones</span>
            </div>
          </div>

          {/* Dismiss Button */}
          <div className="flex justify-center pt-2">
            <Button 
              onClick={handleDismiss}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              Entendido
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectorReplacementNotificationOverlay;