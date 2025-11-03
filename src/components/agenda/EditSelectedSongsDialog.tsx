import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, X, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SelectedSong {
  song_id: string;
  song_title: string;
  artist?: string;
  key_signature?: string;
  difficulty_level?: number;
  selected_by_name: string;
  selection_reason?: string;
  selected_at: string;
  category?: string;
}

interface EditSelectedSongsDialogProps {
  serviceId: string;
  serviceTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSongsUpdated?: () => void;
}

export const EditSelectedSongsDialog: React.FC<EditSelectedSongsDialogProps> = ({
  serviceId,
  serviceTitle,
  open,
  onOpenChange,
  onSongsUpdated
}) => {
  const [selectedSongs, setSelectedSongs] = useState<SelectedSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchSelectedSongs();
    }
  }, [open, serviceId]);

  const fetchSelectedSongs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('service_selected_songs')
        .select('*')
        .eq('service_id', serviceId)
        .order('selected_at', { ascending: false });

      if (error) throw error;
      setSelectedSongs(data || []);
    } catch (error) {
      console.error('Error fetching selected songs:', error);
      toast.error('Error al cargar las canciones seleccionadas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSong = async (songId: string, songTitle: string) => {
    try {
      const { error } = await supabase
        .from('service_songs')
        .delete()
        .eq('service_id', serviceId)
        .eq('song_id', songId);

      if (error) throw error;

      toast.success(`"${songTitle}" eliminada del servicio`);
      await fetchSelectedSongs();
      onSongsUpdated?.();
    } catch (error) {
      console.error('Error removing song:', error);
      toast.error('Error al eliminar la canción');
    }
  };

  const handleGoToSong = (songTitle: string, category?: string) => {
    // Cerrar el diálogo
    onOpenChange(false);
    
    // Navegar al repertorio con la categoría específica si existe
    if (category) {
      navigate(`/repertorio?category=${category}&search=${encodeURIComponent(songTitle)}`);
    } else {
      navigate(`/repertorio?search=${encodeURIComponent(songTitle)}`);
    }
  };

  const getDifficultyColor = (level?: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level?: number) => {
    const labels = { 1: 'Muy Fácil', 2: 'Fácil', 3: 'Intermedio', 4: 'Difícil', 5: 'Muy Difícil' };
    return labels[level as keyof typeof labels] || 'N/A';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Canciones Seleccionadas - {serviceTitle}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Cargando canciones...</div>
        ) : selectedSongs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay canciones seleccionadas para este servicio
          </div>
        ) : (
          <div className="space-y-3">
            {selectedSongs.map((song) => (
              <div
                key={`${song.song_id}-${song.selected_at}`}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => handleGoToSong(song.song_title, song.category)}
                        className="font-semibold text-lg hover:text-arcana-blue-500 transition-colors flex items-center gap-1 group"
                      >
                        {song.song_title}
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                    
                    {song.artist && (
                      <div className="text-sm text-gray-600 mb-2">
                        🎤 {song.artist}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {song.key_signature && (
                        <Badge variant="outline" className="text-xs">
                          🎹 {song.key_signature}
                        </Badge>
                      )}
                      {song.difficulty_level && (
                        <Badge className={`text-xs ${getDifficultyColor(song.difficulty_level)}`}>
                          {getDifficultyLabel(song.difficulty_level)}
                        </Badge>
                      )}
                      {song.category && (
                        <Badge variant="secondary" className="text-xs">
                          📁 {song.category}
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      Seleccionada por: <strong>{song.selected_by_name}</strong>
                      <span className="text-gray-400 ml-2">
                        {new Date(song.selected_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {song.selection_reason && (
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-2">
                        <strong>Razón:</strong> {song.selection_reason}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSong(song.song_id, song.song_title)}
                    className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};