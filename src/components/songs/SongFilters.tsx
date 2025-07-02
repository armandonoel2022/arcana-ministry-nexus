
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Grid, List } from 'lucide-react';

interface FilterState {
  search: string;
  genre: string;
  difficulty: string;
  mood: string;
  theme: string;
  recentlyUsed: boolean;
}

interface SongFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  uniqueGenres: string[];
  uniqueMoods: string[];
  uniqueThemes: string[];
  totalSongs: number;
  filteredCount: number;
}

const SongFilters = ({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  uniqueGenres,
  uniqueMoods,
  uniqueThemes,
  totalSongs,
  filteredCount
}: SongFiltersProps) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      genre: '',
      difficulty: '',
      mood: '',
      theme: '',
      recentlyUsed: false
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    typeof value === 'string' ? value !== '' : value === true
  );

  const activeFiltersCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'search' && value) return count + 1;
    if (key !== 'search' && (typeof value === 'string' ? value !== '' : value === true)) {
      return count + 1;
    }
    return count;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por título, artista o etiquetas..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="h-8 px-3"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="h-8 px-3"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <Select value={filters.genre} onValueChange={(value) => updateFilter('genre', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los géneros</SelectItem>
              {uniqueGenres.map(genre => (
                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={filters.difficulty} onValueChange={(value) => updateFilter('difficulty', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las dificultades</SelectItem>
              <SelectItem value="1">1 - Muy Fácil</SelectItem>
              <SelectItem value="2">2 - Fácil</SelectItem>
              <SelectItem value="3">3 - Intermedio</SelectItem>
              <SelectItem value="4">4 - Difícil</SelectItem>
              <SelectItem value="5">5 - Muy Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={filters.mood} onValueChange={(value) => updateFilter('mood', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Estado de ánimo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los estados</SelectItem>
              {uniqueMoods.map(mood => (
                <SelectItem key={mood} value={mood}>{mood}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={filters.theme} onValueChange={(value) => updateFilter('theme', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los temas</SelectItem>
              {uniqueThemes.map(theme => (
                <SelectItem key={theme} value={theme}>{theme}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Button
            variant={filters.recentlyUsed ? 'default' : 'outline'}
            onClick={() => updateFilter('recentlyUsed', !filters.recentlyUsed)}
            className="w-full"
          >
            Usadas Recientemente
          </Button>
        </div>
      </div>

      {/* Filter Summary and Clear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            {filteredCount} de {totalSongs} canción(es)
            {hasActiveFilters && ` (${activeFiltersCount} filtro${activeFiltersCount > 1 ? 's' : ''} activo${activeFiltersCount > 1 ? 's' : ''})`}
          </p>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters.search && (
              <Badge variant="secondary" className="text-xs">
                Búsqueda: "{filters.search}"
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilter('search', '')}
                />
              </Badge>
            )}
            {filters.genre && (
              <Badge variant="secondary" className="text-xs">
                {filters.genre}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilter('genre', '')}
                />
              </Badge>
            )}
            {filters.recentlyUsed && (
              <Badge variant="secondary" className="text-xs">
                Recientemente usadas
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilter('recentlyUsed', false)}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SongFilters;
