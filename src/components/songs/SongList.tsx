
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import EditSongModal from './EditSongModal';
import SongCard from './SongCard';
import SongListItem from './SongListItem';
import SongFilters from './SongFilters';
import SongEmptyState from './SongEmptyState';
import SongPagination from './SongPagination';

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
}

type ViewMode = 'grid' | 'list';

const SONGS_PER_PAGE = 12;

const SongList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

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

  const filteredSongs = useMemo(() => {
    return songs?.filter(song => {
      const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           song.artist?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = !genreFilter || song.genre === genreFilter;
      return matchesSearch && matchesGenre;
    }) || [];
  }, [songs, searchTerm, genreFilter]);

  const uniqueGenres = useMemo(() => {
    return [...new Set(songs?.map(song => song.genre).filter(Boolean))] || [];
  }, [songs]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSongs.length / SONGS_PER_PAGE);
  const startIndex = (currentPage - 1) * SONGS_PER_PAGE;
  const endIndex = startIndex + SONGS_PER_PAGE;
  const paginatedSongs = filteredSongs.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, genreFilter]);

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
          <Button onClick={() => refetch()} className="mt-2">Reintentar</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SongFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        genreFilter={genreFilter}
        onGenreFilterChange={setGenreFilter}
        uniqueGenres={uniqueGenres}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        resultsCount={filteredSongs.length}
      />

      {/* Songs Display */}
      {paginatedSongs.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onEdit={setEditingSong}
                  onDelete={deleteSong}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedSongs.map((song) => (
                <SongListItem
                  key={song.id}
                  song={song}
                  onEdit={setEditingSong}
                  onDelete={deleteSong}
                />
              ))}
            </div>
          )}

          <SongPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <SongEmptyState searchTerm={searchTerm} genreFilter={genreFilter} />
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
