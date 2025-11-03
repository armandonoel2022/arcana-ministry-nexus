
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, User, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SelectedSong {
  service_id: string;
  song_id: string;
  song_title: string;
  artist?: string;
  key_signature?: string;
  difficulty_level?: number;
  selected_by_name: string;
  selection_reason?: string;
  selected_at: string;
  service_title: string;
  service_date: string;
}

interface SelectedSongsDisplayProps {
  serviceId: string;
  serviceTitle: string;
  compact?: boolean;
}

const SelectedSongsDisplay: React.FC<SelectedSongsDisplayProps> = ({ 
  serviceId, 
  serviceTitle,
  compact = false 
}) => {
  const [selectedSongs, setSelectedSongs] = useState<SelectedSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSelectedSongs();
  }, [serviceId]);

  const fetchSelectedSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('service_selected_songs')
        .select('*')
        .eq('service_id', serviceId)
        .order('selected_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setSelectedSongs(data as any);
      } else {
        // Fallback: si aún no existen registros en song_selections, leer desde service_songs
        const { data: fallback, error: fbErr } = await supabase
          .from('service_songs')
          .select(`
            song_id,
            songs ( title, artist, key_signature, difficulty_level )
          `)
          .eq('service_id', serviceId)
          .order('song_order', { ascending: true });

        if (!fbErr && fallback) {
          const mapped = fallback.map((row: any) => ({
            service_id: serviceId,
            song_id: row.song_id,
            song_title: row.songs?.title || 'Canción',
            artist: row.songs?.artist || undefined,
            key_signature: row.songs?.key_signature || undefined,
            difficulty_level: row.songs?.difficulty_level || undefined,
            selected_by_name: '—',
            selected_at: new Date().toISOString(),
            service_title: serviceTitle,
            service_date: new Date().toISOString(),
          }));
          setSelectedSongs(mapped);
        } else {
          setSelectedSongs([]);
        }
      }
    } catch (error) {
      console.error('Error fetching selected songs:', error);
      if (!compact) {
        toast.error('Error al cargar las canciones seleccionadas');
      }
    } finally {
      setIsLoading(false);
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
    const labels = {
      1: 'Muy Fácil',
      2: 'Fácil',
      3: 'Intermedio',
      4: 'Difícil',
      5: 'Muy Difícil'
    };
    return labels[level as keyof typeof labels] || 'N/A';
  };

  if (isLoading) {
    return compact ? (
      <span className="text-gray-400 text-sm">Cargando...</span>
    ) : (
      <div className="text-center text-gray-500">Cargando canciones seleccionadas...</div>
    );
  }

  if (selectedSongs.length === 0) {
    return compact ? (
      <span className="text-gray-400 text-sm">Sin canciones seleccionadas</span>
    ) : (
      <div className="text-center text-gray-500 py-4">
        No hay canciones seleccionadas para este servicio
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-1">
        {selectedSongs.map((song, index) => (
          <div key={`${song.service_id}-${song.song_id}-${index}`} className="flex items-center gap-1 text-sm">
            <Music className="w-3 h-3 text-blue-600" />
            <span className="truncate max-w-32 font-medium">
              {song.song_title}
            </span>
            {song.artist && (
              <span className="text-gray-500 text-xs">
                - {song.artist}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Canciones Seleccionadas para: {serviceTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {selectedSongs.map((song) => (
            <div key={`${song.service_id}-${song.song_id}`} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-lg">{song.song_title}</h4>
                  {song.artist && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <User className="w-3 h-3 mr-1" />
                      {song.artist}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {song.key_signature && (
                    <Badge variant="outline" className="text-xs">
                      {song.key_signature}
                    </Badge>
                  )}
                  {song.difficulty_level && (
                    <Badge className={`text-xs ${getDifficultyColor(song.difficulty_level)}`}>
                      {getDifficultyLabel(song.difficulty_level)}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-4">
                  <span>Seleccionada por: <strong>{song.selected_by_name}</strong></span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(song.selected_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>

              {song.selection_reason && (
                <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  <strong>Razón:</strong> {song.selection_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectedSongsDisplay;
