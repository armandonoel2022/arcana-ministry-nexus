
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Music, ExternalLink, Edit, Trash2, Grid2X2, LayoutList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EditSongModal from './EditSongModal';
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
}

type ViewMode = 'grid' | 'list';

const SongList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
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

  const filteredSongs = songs?.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artist?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !genreFilter || song.genre === genreFilter;
    return matchesSearch && matchesGenre;
  });

  const uniqueGenres = [...new Set(songs?.map(song => song.genre).filter(Boolean))];

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      case 5: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (level: number) => {
    const levels = ['', 'Muy Fácil', 'Fácil', 'Intermedio', 'Difícil', 'Muy Difícil'];
    return levels[level] || 'Sin definir';
  };

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

  const SongCard = ({ song }: { song: Song }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{song.title}</CardTitle>
            {song.artist && (
              <p className="text-sm text-gray-600 truncate">{song.artist}</p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSong(song)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Genre and Difficulty */}
        <div className="flex items-center gap-2 flex-wrap">
          {song.genre && (
            <Badge variant="outline" className="text-xs">
              {song.genre}
            </Badge>
          )}
          <Badge className={`text-xs ${getDifficultyColor(song.difficulty_level)}`}>
            {getDifficultyText(song.difficulty_level)}
          </Badge>
        </div>

        {/* Musical Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {song.key_signature && (
            <div>
              <span className="font-medium">Tono:</span> {song.key_signature}
            </div>
          )}
          {song.tempo && (
            <div>
              <span className="font-medium">Tempo:</span> {song.tempo}
            </div>
          )}
        </div>

        {/* Tags */}
        {song.tags && song.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {song.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
            {song.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{song.tags.length - 3} más
              </span>
            )}
          </div>
        )}

        {/* External Links */}
        <div className="flex items-center gap-2 pt-2">
          {song.youtube_link && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1"
            >
              <a href={song.youtube_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" />
                YouTube
              </a>
            </Button>
          )}
          {song.spotify_link && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1"
            >
              <a href={song.spotify_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" />
                Spotify
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const SongListItem = ({ song }: { song: Song }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{song.title}</h3>
                {song.artist && (
                  <p className="text-sm text-gray-600 truncate">{song.artist}</p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Genre and Difficulty */}
                <div className="flex items-center gap-2">
                  {song.genre && (
                    <Badge variant="outline" className="text-xs">
                      {song.genre}
                    </Badge>
                  )}
                  <Badge className={`text-xs ${getDifficultyColor(song.difficulty_level)}`}>
                    {getDifficultyText(song.difficulty_level)}
                  </Badge>
                </div>

                {/* Musical Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {song.key_signature && (
                    <span><strong>Tono:</strong> {song.key_signature}</span>
                  )}
                  {song.tempo && (
                    <span><strong>Tempo:</strong> {song.tempo}</span>
                  )}
                </div>

                {/* External Links */}
                <div className="flex items-center gap-2">
                  {song.youtube_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={song.youtube_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        YouTube
                      </a>
                    </Button>
                  )}
                  {song.spotify_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={song.spotify_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Spotify
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {song.tags && song.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {song.tags.slice(0, 5).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {song.tags.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{song.tags.length - 5} más
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSong(song)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por título o artista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-arcana-blue-500"
        >
          <option value="">Todos los géneros</option>
          {uniqueGenres.map(genre => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </div>

      {/* Results Count and View Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredSongs?.length || 0} canción(es) encontrada(s)
        </p>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Vista:</span>
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Grid2X2 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Songs Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSongs?.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSongs?.map((song) => (
            <SongListItem key={song.id} song={song} />
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
              {searchTerm || genreFilter
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
