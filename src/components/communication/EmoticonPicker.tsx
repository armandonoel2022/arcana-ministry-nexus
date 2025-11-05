import { useState } from 'react';
import { useEmoticons } from '@/hooks/useEmoticons';

interface EmoticonPickerProps {
  onSelect: (emoticon: string) => void;
  visible: boolean;
  onClose: () => void;
}

export const EmoticonPicker = ({
  onSelect,
  visible,
  onClose,
}: EmoticonPickerProps) => {
  const [activeCategory, setActiveCategory] = useState('caritas');
  const [searchQuery, setSearchQuery] = useState('');
  const { getEmoticonsByCategory, searchEmoticons } = useEmoticons();

  const categories = ['caritas', 'ministerio', 'acciones', 'arcana'];

  const filteredEmoticons = searchQuery 
    ? searchEmoticons(searchQuery)
    : getEmoticonsByCategory(activeCategory);

  if (!visible) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white border border-border rounded-lg shadow-lg w-80 z-50">
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <input
          type="text"
          placeholder="Buscar emoticones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button 
          onClick={onClose}
          className="text-2xl text-muted-foreground hover:text-foreground leading-none"
        >
          ×
        </button>
      </div>

      {!searchQuery && (
        <div className="flex gap-1 p-2 border-b border-border">
          {categories.map(category => (
            <button
              key={category}
              className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-colors ${
                activeCategory === category 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-6 gap-1 p-2 max-h-48 overflow-y-auto">
        {filteredEmoticons.map(emoticon => (
          <button
            key={emoticon.code}
            className="p-2 text-2xl rounded-md hover:bg-accent transition-colors"
            onClick={() => {
              onSelect(emoticon.emoji);
              onClose();
            }}
            title={`${emoticon.description} (${emoticon.code})`}
          >
            {emoticon.emoji}
          </button>
        ))}
      </div>

      {filteredEmoticons.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No se encontraron emoticones
        </div>
      )}
    </div>
  );
};
