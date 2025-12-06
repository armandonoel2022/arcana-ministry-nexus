import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Song {
  id: string;
  title: string;
}

interface Service {
  id: string;
  title: string;
  service_date: string;
}

interface SongChangeDialogProps {
  currentSongId: string;
  currentSongTitle: string;
  serviceId: string;
  children: React.ReactNode;
}

export const SongChangeDialog: React.FC<SongChangeDialogProps> = ({
  currentSongId,
  currentSongTitle,
  serviceId,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [newSongId, setNewSongId] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadAvailableSongs();
    }
  }, [open]);

  const loadAvailableSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id, title')
        .order('title');

      if (error) throw error;
      setSongs(data || []);
    } catch (error) {
      console.error('Error loading songs:', error);
      toast.error('Error al cargar las canciones');
    }
  };

  const handleChangeSong = async () => {
    if (!newSongId) {
      toast.error('Por favor selecciona una nueva canción');
      return;
    }

    if (newSongId === currentSongId) {
      toast.error('Debes seleccionar una canción diferente');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Get user profile and photo
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, photo_url')
        .eq('id', user.id)
        .single();

      // Get service details
      const { data: service } = await supabase
        .from('services')
        .select('title, service_date')
        .eq('id', serviceId)
        .single();

      // Get new song details
      const newSong = songs.find(s => s.id === newSongId);

      // Update the song in song_selections
      const { error: updateError } = await supabase
        .from('song_selections')
        .update({
          song_id: newSongId,
          selection_reason: reason || `Cambiada de "${currentSongTitle}" a "${newSong?.title}"`
        })
        .eq('service_id', serviceId)
        .eq('song_id', currentSongId);

      if (updateError) throw updateError;

      // Update in service_songs as well
      await supabase
        .from('service_songs')
        .update({ song_id: newSongId })
        .eq('service_id', serviceId)
        .eq('song_id', currentSongId);

      // Get all active members to notify
      const { data: allMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true);

      // Create notifications for all members
      if (allMembers && allMembers.length > 0 && service) {
        const notifications = allMembers.map(member => ({
          recipient_id: member.id,
          type: 'general' as const,  // Use valid enum type
          title: '🔄 Cambio de Canción',
          message: `${profile?.full_name || 'Un integrante'} ha cambiado una canción en "${service.title}"`,
          notification_category: 'repertory',
          metadata: {
            service_id: serviceId,
            service_title: service.title,
            service_date: service.service_date,
            old_song_id: currentSongId,
            old_song_title: currentSongTitle,
            new_song_id: newSongId,
            new_song_title: newSong?.title,
            changed_by: profile?.full_name || user.email,
            changed_by_photo: profile?.photo_url,
            reason: reason
          }
        }));

        await supabase
          .from('system_notifications')
          .insert(notifications);
      }

      toast.success('Canción cambiada exitosamente', {
        description: 'Se ha notificado el cambio a todos los integrantes'
      });
      
      setOpen(false);
      setNewSongId('');
      setReason('');
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error changing song:', error);
      toast.error('Error al cambiar la canción');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Cambiar Canción
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Canción Actual</label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Music className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{currentSongTitle}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Nueva Canción</label>
            <Select value={newSongId} onValueChange={setNewSongId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una canción" />
              </SelectTrigger>
              <SelectContent>
                {songs
                  .filter(s => s.id !== currentSongId)
                  .map((song) => (
                    <SelectItem key={song.id} value={song.id}>
                      {song.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Razón del cambio (opcional)</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Mejor adaptada para el grupo..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangeSong}
              disabled={isLoading || !newSongId}
              className="flex-1"
            >
              {isLoading ? 'Cambiando...' : 'Confirmar Cambio'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
