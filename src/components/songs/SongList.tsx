import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EditSongModal from './EditSongModal';
import SongCard from './SongCard';
import SongFilters from './SongFilters';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  difficulty_level: number;
  tempo: string;
  key_signature: string;
  tags: string[];
  youtube_link: string;
  spotify_link: string;
  created_at: string;
  mood?: string;
  theme?: string;
  last_used_date?: string;
  usage_count?: number;
  director_notes?: string;
}

interface FilterState {
  search: string;
  genre: string;
  difficulty: string;
  mood: string;
  theme: string;
  recentlyUsed: boolean;
}

const SongList = () => {
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    genre: '',
    difficulty: '',
    mood: '',
    theme: '',
    recentlyUsed: false
  });
  const { toast } = useToast();

  // Load user's view preference on component mount
  useEffect(() => {
    const loadViewPreference = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('repertory_view_preference')
            .eq('id', user.id)
            .single();
          
          if (profile?.repertory_view_preference) {
            setViewMode(profile.repertory_view_preference as 'list' | 'grid');
          }
        }
      } catch (error) {
        console.log('Error loading view preference:', error);
      }
    };

    loadViewPreference();
  }, []);

  // Save view preference when it changes
  const handleViewModeChange = async (mode: 'list' | 'grid') => {
    setViewMode(mode);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ repertory_view_preference: mode })
          .eq('id', user.id);
      }
    } catch (error) {
      console.log('Error saving view preference:', error);
    }
  };

  const { data: songs, isLoading, error, refetch } = useQuery({
    queryKey: ['songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('is_active', true)
        .order('title');
      
      if (error) throw error;
      return data as Song[];
    }
  });

  const deleteSong = async (songId: string, songTitle: string) => {
    try {
      const { error } = await supabase
        .from('songs')
        .update({ is_active: false })
        .eq('id', songId);

      if (error) throw error;

      toast({
        title: "Canción eliminada",
        description: `"${songTitle}" ha sido eliminada del repertorio.`,
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting song:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la canción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Filter songs based on current filters
  const filteredSongs = songs?.filter(song => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = 
        song.title.toLowerCase().includes(searchTerm) ||
        song.artist?.toLowerCase().includes(searchTerm) ||
        song.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      
      if (!matchesSearch) return false;
    }

    // Genre filter
    if (filters.genre && song.genre !== filters.genre) return false;

    // Difficulty filter
    if (filters.difficulty && song.difficulty_level.toString() !== filters.difficulty) return false;

    // Mood filter
    if (filters.mood && song.mood !== filters.mood) return false;

    // Theme filter
    if (filters.theme && song.theme !== filters.theme) return false;

    // Recently used filter (songs used in the last 30 days)
    if (filters.recentlyUsed) {
      if (!song.last_used_date) return false;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const lastUsed = new Date(song.last_used_date);
      if (lastUsed < thirtyDaysAgo) return false;
    }

    return true;
  });

  // Get unique values for filter options
  const uniqueGenres = [...new Set(songs?.map(song => song.genre).filter(Boolean))];
  const uniqueMoods = [...new Set(songs?.map(song => song.mood).filter(Boolean))];
  const uniqueThemes = [...new Set(songs?.map(song => song.theme).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error al cargar las canciones: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <SongFilters
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        uniqueGenres={uniqueGenres}
        uniqueMoods={uniqueMoods}
        uniqueThemes={uniqueThemes}
        totalSongs={songs?.length || 0}
        filteredCount={filteredSongs?.length || 0}
      />

      {/* Songs Display */}
      {viewMode === 'list' ? (
        <div className="space-y-2">
          {filteredSongs?.map((song) => (
            <AlertDialog key={song.id}>
              <SongCard
                song={song}
                onEdit={(song) => setEditingSong(song)}
                onDelete={(songId, songTitle) => deleteSong(songId, songTitle)}
                viewMode="list"
              />
              <AlertDialogTrigger asChild>
                <span style={{ display: 'none' }} id={`delete-trigger-${song.id}`} />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar canción?</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que quieres eliminar "{song.title}" del repertorio? 
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteSong(song.id, song.title)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSongs?.map((song) => (
            <AlertDialog key={song.id}>
              <SongCard
                song={song}
                onEdit={(song) => setEditingSong(song)}
                onDelete={(songId, songTitle) => deleteSong(songId, songTitle)}
                viewMode="grid"
              />
              <AlertDialogTrigger asChild>
                <span style={{ display: 'none' }} id={`delete-trigger-${song.id}`} />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar canción?</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que quieres eliminar "{song.title}" del repertorio? 
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteSong(song.id, song.title)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredSongs?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron canciones
            </h3>
            <p className="text-gray-600">
              {Object.values(filters).some(value => typeof value === 'string' ? value !== '' : value === true)
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Aún no hay canciones en el repertorio'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Song Modal */}
      <EditSongModal
        song={editingSong}
        isOpen={!!editingSong}
        onClose={() => setEditingSong(null)}
        onSave={refetch}
      />
    </div>
  );
};

export default SongList;
