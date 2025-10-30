import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Music } from 'lucide-react';
import adnCover from '@/assets/adn-cover.png';
import himnosCover from '@/assets/himnos-cover.jpg';
import villancicosCover from '@/assets/villancicos-cover.png';
import repertorioGeneral from '@/assets/repertorio-general.png';

interface Category {
  id: string;
  name: string;
  image: string;
  description: string;
}

interface RepertoiryCategorySelectorProps {
  onSelectCategory: (categoryId: string) => void;
}

const RepertoiryCategorySelector: React.FC<RepertoiryCategorySelectorProps> = ({ onSelectCategory }) => {
  const categories: Category[] = [
    {
      id: 'general',
      name: 'Repertorio General',
      image: repertorioGeneral,
      description: 'Canciones generales del ministerio'
    },
    {
      id: 'himnario',
      name: 'Himnario de Gloria',
      image: himnosCover,
      description: 'Himnos tradicionales y clásicos'
    },
    {
      id: 'villancicos',
      name: 'Villancicos',
      image: villancicosCover,
      description: 'Canciones navideñas'
    },
    {
      id: 'adn',
      name: 'ADN Arca de Noé',
      image: adnCover,
      description: 'Canciones originales del ministerio'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg">
          <Music className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Repertorio Musical</h2>
          <p className="text-muted-foreground">Selecciona una categoría para explorar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50"
            onClick={() => onSelectCategory(category.id)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-bold text-lg mb-1 line-clamp-2">{category.name}</h3>
                  <p className="text-sm text-white/90 line-clamp-2">{category.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RepertoiryCategorySelector;