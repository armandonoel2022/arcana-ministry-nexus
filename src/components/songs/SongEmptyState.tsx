
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Music } from 'lucide-react';

interface SongEmptyStateProps {
  searchTerm: string;
  genreFilter: string;
}

const SongEmptyState = ({ searchTerm, genreFilter }: SongEmptyStateProps) => {
  return (
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
  );
};

export default SongEmptyState;
