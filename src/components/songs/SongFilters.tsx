
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Grid2X2, LayoutList } from 'lucide-react';

type ViewMode = 'grid' | 'list';

interface SongFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  genreFilter: string;
  onGenreFilterChange: (value: string) => void;
  uniqueGenres: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  resultsCount: number;
}

const SongFilters = ({
  searchTerm,
  onSearchChange,
  genreFilter,
  onGenreFilterChange,
  uniqueGenres,
  viewMode,
  onViewModeChange,
  resultsCount
}: SongFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por título o artista..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={genreFilter}
          onChange={(e) => onGenreFilterChange(e.target.value)}
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
          {resultsCount} canción(es) encontrada(s)
        </p>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Vista:</span>
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="h-8 px-3"
            >
              <Grid2X2 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="h-8 px-3"
            >
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongFilters;
