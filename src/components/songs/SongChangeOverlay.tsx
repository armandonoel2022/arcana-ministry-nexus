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
    old_song_title: string;
    new_song_title: string;
    changed_by: string;
    changed_by_photo?: string;
    reason?: string;
  };
}

const SongChangeOverlay = () => {
  const [notification, setNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    checkForNewNotifications();

    const channel = supabase
      .channel('song-change-notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'system_notifications',
          filter: 'type=eq.song_change'
        },
        () => checkForNewNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkForNewNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('type', 'song_change')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching song change notifications:', error);
        return;
      }

      if (data && data.length > 0) {
        const dismissed = JSON.parse(localStorage.getItem('dismissedSongChanges') || '{}');
        const notificationId = data[0].id;
        
        if (!dismissed[notificationId]) {
          setNotification(data[0]);
        }
      }
    } catch (error) {
      console.error('Error checking for song change notifications:', error);
    }
  };

  const handleDismiss = async () => {
    if (!notification) return;

    try {
      await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      const dismissed = JSON.parse(localStorage.getItem('dismissedSongChanges') || '{}');
      dismissed[notification.id] = true;
      localStorage.setItem('dismissedSongChanges', JSON.stringify(dismissed));

      setNotification(null);
    } catch (error) {
      console.error('Error dismissing notification:', error);
      setNotification(null);
    }
  };

  if (!notification) return null;

  const { metadata } = notification;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-primary/50 bg-gradient-to-br from-background via-background to-primary/5">
        <CardHeader className="text-center pb-4 space-y-2">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <img 
                src={arcanaLogo} 
                alt="Arca de Noé" 
                className="w-20 h-20 object-contain drop-shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 shadow-lg">
                <Music className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            🎵 Cambio de Canción
          </CardTitle>
          <p className="text-sm md:text-base text-muted-foreground">
            Se ha realizado un cambio en el repertorio del servicio
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 px-6 pb-8">
          {/* Service Info */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
            <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{metadata.service_title}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(metadata.service_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
          </div>

          {/* Song Change Visualization */}
          <div className="relative py-6">
            <div className="flex items-center justify-between gap-4">
              {/* Old Song */}
              <div className="flex-1 space-y-2">
                <p className="text-xs uppercase text-muted-foreground font-medium">Canción Original</p>
                <Card className="border-2 border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <Music className="w-5 h-5 text-destructive" />
                      </div>
                      <p className="font-medium text-sm line-through text-muted-foreground break-words">
                        {metadata.old_song_title}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 px-2">
                <ArrowRight className="w-8 h-8 text-primary animate-pulse" />
              </div>

              {/* New Song */}
              <div className="flex-1 space-y-2">
                <p className="text-xs uppercase text-muted-foreground font-medium">Nueva Canción</p>
                <Card className="border-2 border-primary bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Music className="w-5 h-5 text-primary" />
                      </div>
                      <p className="font-medium text-sm text-foreground break-words">
                        {metadata.new_song_title}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Changed By */}
          <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg border border-border/50">
            <Avatar className="w-12 h-12 border-2 border-primary">
              <AvatarImage src={metadata.changed_by_photo} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Cambio realizado por</p>
              <p className="font-semibold text-foreground">{metadata.changed_by}</p>
              {metadata.reason && (
                <p className="text-xs text-muted-foreground mt-1 italic">"{metadata.reason}"</p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleDismiss}
            className="w-full py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            Entendido
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SongChangeOverlay;
