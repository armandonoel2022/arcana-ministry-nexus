
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Clock, Star, ExternalLink, Play } from 'lucide-react';

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
  youtube_link?: string;
  spotify_link?: string;
}

interface SongListItemProps {
  song: Song;
}

const SongListItem: React.FC<SongListItemProps> = ({ song }) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Title and Artist */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-lg mb-1">{song.title}</h3>
            {song.artist && (
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-3 h-3 mr-1" />
                {song.artist}
              </div>
            )}
            {song.tags && song.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {song.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
                {song.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{song.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Genre and Key */}
          <div className="space-y-2">
            {song.genre && (
              <Badge variant="secondary" className="text-xs">
                {song.genre}
              </Badge>
            )}
            {song.key_signature && (
              <div className="text-sm text-gray-600">
                Tono: <span className="font-medium">{song.key_signature}</span>
              </div>
            )}
            {song.tempo && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-3 h-3 mr-1" />
                {song.tempo}
              </div>
            )}
          </div>

          {/* Difficulty and Stats */}
          <div className="space-y-2">
            <Badge className={`text-xs ${getDifficultyColor(song.difficulty_level)}`}>
              {getDifficultyLabel(song.difficulty_level)}
            </Badge>
            <div className="flex items-center text-xs text-gray-500">
              <Star className="w-3 h-3 mr-1" />
              {song.usage_count || 0} usos
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(song.created_at)}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-4">
          {song.youtube_link && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(song.youtube_link, '_blank')}
              className="h-8 w-8 p-0"
            >
              <Play className="w-4 h-4 text-red-600" />
            </Button>
          )}
          {song.spotify_link && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(song.spotify_link, '_blank')}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="w-4 h-4 text-green-600" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongListItem;
