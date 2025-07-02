
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Grid, List, Filter, Music, Clock, User, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SongCard from './SongCard';
import SongListItem from './SongListItem';
import SongPagination from './SongPagination';

interface Song {
  id: string;
  title: string;
  artist?: string;
  genre?: string;
  difficulty_level?: number;
  tempo?: string;
  key_signature?: string;
  tags?: string[];
  created_at: string;
  usage_count?: number;
  last_used_date?: string;
}

const ITEMS_PER_PAGE = 12;

const SongCatalog = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('title');

  // Fetch songs with filters and pagination
  const { data: songsData, isLoading, error } = useQuery({
    queryKey: ['songs', searchTerm, genreFilter, difficultyFilter, sortBy, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('songs')
        .select('*')
        .eq('is_active', true);

      // Apply search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`);
      }

      // Apply genre filter
      if (genreFilter !== 'all') {
        query = query.eq('genre', genreFilter);
      }

      // Apply difficulty filter
      if (difficultyFilter !== 'all') {
        query = query.eq('difficulty_level', parseInt(difficultyFilter));
      }

      // Apply sorting
      switch (sortBy) {
        case 'title':
          query = query.order('title', { ascending: true });
          break;
        case 'artist':
          query = query.order('artist', { ascending: true });
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('usage_count', { ascending: false, nullsFirst: false });
          break;
        default:
          query = query.order('title', { ascending: true });
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return { songs: data || [], total: count || 0 };
    },
  });

  // Fetch unique genres for filter
  const { data: genres } = useQuery({
    queryKey: ['song-genres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('songs')
        .select('genre')
        .not('genre', 'is', null)
        .eq('is_active', true);
      
      if (error) throw error;
      
      const uniqueGenres = [...new Set(data.map(item => item.genre))].filter(Boolean);
      return uniqueGenres;
    },
  });

  const songs = songsData?.songs || [];
  const totalSongs = songsData?.total || 0;
  const totalPages = Math.ceil(totalSongs / ITEMS_PER_PAGE);

  const resetFilters = () => {
    setSearchTerm('');
    setGenreFilter('all');
    setDifficultyFilter('all');
    setSortBy('title');
    setCurrentPage(1);
  };

  const getDifficultyLabel = (level: number) => {
    const labels = {
      1: 'Muy Fácil',
      2: 'Fácil',
      3: 'Intermedio',
      4: 'Difícil',
      5: 'Muy Difícil'
    };
    return labels[level as keyof typeof labels] || 'Desconocido';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar las canciones: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar canciones o artistas..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={genreFilter} onValueChange={(value) => {
          setGenreFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por género" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los géneros</SelectItem>
            {genres?.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={(value) => {
          setDifficultyFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por dificultad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las dificultades</SelectItem>
            <SelectItem value="1">Muy Fácil</SelectItem>
            <SelectItem value="2">Fácil</SelectItem>
            <SelectItem value="3">Intermedio</SelectItem>
            <SelectItem value="4">Difícil</SelectItem>
            <SelectItem value="5">Muy Difícil</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Título</SelectItem>
            <SelectItem value="artist">Artista</SelectItem>
            <SelectItem value="recent">Más recientes</SelectItem>
            <SelectItem value="popular">Más populares</SelectItem>
          </SelectContent>
        </Select>

        {(searchTerm || genreFilter !== 'all' || difficultyFilter !== 'all' || sortBy !== 'title') && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <Filter className="w-4 h-4 mr-2" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Results summary */}
      <div className="text-sm text-gray-600">
        Mostrando {songs.length} de {totalSongs} canciones
        {searchTerm && ` para "${searchTerm}"`}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando canciones...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && songs.length === 0 && (
        <div className="text-center py-12">
          <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron canciones
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || genreFilter !== 'all' || difficultyFilter !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay canciones disponibles en el repertorio'}
          </p>
          {(searchTerm || genreFilter !== 'all' || difficultyFilter !== 'all') && (
            <Button variant="outline" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      )}

      {/* Songs grid/list */}
      {!isLoading && songs.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {songs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {songs.map((song) => (
                <SongListItem key={song.id} song={song} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <SongPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SongCatalog;
