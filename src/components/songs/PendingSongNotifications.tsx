import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Bell, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingSong {
  songId: string;
  songTitle: string;
  serviceId: string;
  serviceTitle: string;
  serviceDate: string;
  selectedBy: string;
  selectedByName: string;
  reason?: string;
}

const NOTIFICATION_DELAY = 5 * 60 * 1000; // 5 minutes

export const PendingSongNotifications = () => {
  const [pendingSongs, setPendingSongs] = useState<PendingSong[]>([]);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if there are pending songs in localStorage
    const stored = localStorage.getItem('pendingSongNotifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      setPendingSongs(parsed.songs || []);
      
      // Resume timer if there are pending songs
      if (parsed.songs?.length > 0 && parsed.timerStart) {
        const elapsed = Date.now() - parsed.timerStart;
        const remaining = Math.max(0, NOTIFICATION_DELAY - elapsed);
        
        if (remaining > 0) {
          const newTimer = setTimeout(() => {
            sendGroupedNotification(parsed.songs);
          }, remaining);
          setTimer(newTimer);
        } else {
          // Timer already expired, send immediately
          sendGroupedNotification(parsed.songs);
        }
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const addPendingSong = (song: PendingSong) => {
    setPendingSongs(prev => {
      const updated = [...prev, song];
      
      // Clear existing timer
      if (timer) clearTimeout(timer);
      
      // Save to localStorage with timer start
      const timerStart = prev.length === 0 ? Date.now() : JSON.parse(localStorage.getItem('pendingSongNotifications') || '{}').timerStart;
      localStorage.setItem('pendingSongNotifications', JSON.stringify({
        songs: updated,
        timerStart
      }));
      
      // Set new timer only if this is the first song
      if (prev.length === 0) {
        const newTimer = setTimeout(() => {
          sendGroupedNotification(updated);
        }, NOTIFICATION_DELAY);
        setTimer(newTimer);
      }
      
      return updated;
    });
  };

  const sendGroupedNotification = async (songs: PendingSong[]) => {
    if (songs.length === 0) return;

    try {
      // Group songs by service
      const songsByService = songs.reduce((acc, song) => {
        if (!acc[song.serviceId]) {
          acc[song.serviceId] = {
            serviceTitle: song.serviceTitle,
            serviceDate: song.serviceDate,
            songs: []
          };
        }
        acc[song.serviceId].songs.push(song);
        return acc;
      }, {} as Record<string, { serviceTitle: string; serviceDate: string; songs: PendingSong[] }>);

      // Get all active members
      const { data: allMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true);

      // Create notifications for each service
      for (const [serviceId, serviceData] of Object.entries(songsByService)) {
        const songTitles = serviceData.songs.map(s => s.songTitle).join(', ');
        const message = serviceData.songs.length === 1
          ? `Se ha seleccionado "${songTitles}" para el servicio "${serviceData.serviceTitle}"`
          : `Se han seleccionado ${serviceData.songs.length} canciones para el servicio "${serviceData.serviceTitle}": ${songTitles}`;

        if (allMembers && allMembers.length > 0) {
          const notifications = allMembers.map(member => ({
            recipient_id: member.id,
            type: 'song_selection',
            title: serviceData.songs.length === 1 ? '🎵 Nueva Canción Seleccionada' : `🎵 ${serviceData.songs.length} Canciones Seleccionadas`,
            message,
            notification_category: 'repertory',
            metadata: {
              service_id: serviceId,
              service_title: serviceData.serviceTitle,
              service_date: serviceData.serviceDate,
              songs: serviceData.songs.map(s => ({
                song_id: s.songId,
                song_title: s.songTitle,
                selected_by: s.selectedByName,
                reason: s.reason
              }))
            }
          }));

          await supabase
            .from('system_notifications')
            .insert(notifications);
        }
      }

      // Clear pending songs
      setPendingSongs([]);
      localStorage.removeItem('pendingSongNotifications');
      if (timer) clearTimeout(timer);
      setTimer(null);

      toast.success('Notificaciones enviadas', {
        description: `Se notificó la selección de ${songs.length} canción(es)`
      });
    } catch (error) {
      console.error('Error sending grouped notification:', error);
      toast.error('Error al enviar notificaciones');
    }
  };

  const handleNotifyNow = () => {
    sendGroupedNotification(pendingSongs);
  };

  // Expose method to add pending songs
  useEffect(() => {
    (window as any).addPendingSongNotification = addPendingSong;
    return () => {
      delete (window as any).addPendingSongNotification;
    };
  }, [pendingSongs]);

  if (pendingSongs.length === 0) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl border-2 border-primary/50 animate-in slide-in-from-bottom-5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">
            {pendingSongs.length} canción(es) pendiente(s)
          </h3>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Se notificará automáticamente en 5 minutos o puedes notificar ahora.
        </p>

        <div className="space-y-2">
          <Button 
            onClick={handleNotifyNow}
            className="w-full"
            size="sm"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notificar Ahora
          </Button>
          <Button 
            variant="outline"
            className="w-full"
            size="sm"
            onClick={() => {
              toast.info('Continúa agregando canciones', {
                description: 'Se notificará automáticamente en 5 minutos'
              });
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Más Canciones
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
