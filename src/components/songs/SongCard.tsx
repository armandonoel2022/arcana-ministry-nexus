
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music, User, Clock, Star, ExternalLink, Play, Eye, Plus } from 'lucide-react';
import SongLyrics from './SongLyrics';
import SongSelectionDialog from './SongSelectionDialog';

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

interface SongCardProps {
  song: Song;
}

const SongCard: React.FC<SongCardProps> = ({ song }) => {
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
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2 mb-1">
              {song.title}
            </CardTitle>
            {song.artist && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <User className="w-3 h-3 mr-1" />
                {song.artist}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
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
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Genre and Key */}
          <div className="flex items-center gap-2 flex-wrap">
            {song.genre && (
              <Badge variant="secondary" className="text-xs">
                {song.genre}
              </Badge>
            )}
            {song.key_signature && (
              <Badge variant="outline" className="text-xs">
                {song.key_signature}
              </Badge>
            )}
          </div>

          {/* Difficulty and Tempo */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Dificultad:</span>
              <Badge className={`text-xs ${getDifficultyColor(song.difficulty_level)}`}>
                {getDifficultyLabel(song.difficulty_level)}
              </Badge>
            </div>
            {song.tempo && (
              <div className="flex items-center text-gray-600">
                <Clock className="w-3 h-3 mr-1" />
                <span className="text-xs">{song.tempo}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {song.tags && song.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {song.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {song.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{song.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center text-xs text-gray-500">
              <Star className="w-3 h-3 mr-1" />
              Usada {song.usage_count || 0} veces
            </div>
            <div className="flex items-center gap-2">
              <SongLyrics songId={song.id}>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Eye className="w-3 h-3 mr-1" />
                  Ver
                </Button>
              </SongLyrics>
              <SongSelectionDialog song={song}>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Plus className="w-3 h-3 mr-1" />
                  Seleccionar
                </Button>
              </SongSelectionDialog>
            </div>
          </div>

          {/* Created date */}
          <div className="text-xs text-gray-500 text-center">
            Agregada {formatDate(song.created_at)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SongCard;
