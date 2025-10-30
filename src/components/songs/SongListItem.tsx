
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Clock, Star, ExternalLink, Play, Eye, Plus, Edit2, Music } from 'lucide-react';
import SongLyrics from './SongLyrics';
import SongSelectionDialog from './SongSelectionDialog';
import SongSelectionIndicator from './SongSelectionIndicator';
import EditSongDialog from './EditSongDialog';

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
  cover_image_url?: string;
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
    <div className="bg-card border rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-200 hover:border-primary/30">
      <div className="flex gap-3 sm:gap-4">
        {/* Cover Image */}
        <div className="flex-shrink-0">
          {song.cover_image_url ? (
            <img 
              src={song.cover_image_url} 
              alt={song.title}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Music className="w-8 h-8 text-primary/40" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title and Artist Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-base sm:text-lg line-clamp-1">{song.title}</h3>
                <SongSelectionIndicator songId={song.id} compact={true} />
              </div>
              {song.artist && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">{song.artist}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Grid - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {/* Genre and Key */}
            <div className="space-y-1">
              {song.genre && (
                <Badge variant="secondary" className="text-xs">{song.genre}</Badge>
              )}
            </div>

            {/* Tonalidad */}
            {song.key_signature && (
              <div className="text-muted-foreground">
                <span className="font-medium">Tono:</span> {song.key_signature}
              </div>
            )}

            {/* Tempo and Difficulty */}
            <div className="space-y-1">
              {song.tempo && (
                <div className="flex items-center text-muted-foreground text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {song.tempo}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-1">
              <Badge className={`text-xs ${getDifficultyColor(song.difficulty_level)}`}>
                {getDifficultyLabel(song.difficulty_level)}
              </Badge>
              <div className="flex items-center text-xs text-muted-foreground">
                <Star className="w-3 h-3 mr-1" />
                {song.usage_count || 0} usos
              </div>
            </div>
          </div>

          {/* Tags */}
          {song.tags && song.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {song.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">#{tag}</Badge>
              ))}
              {song.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">+{song.tags.length - 3}</Badge>
              )}
            </div>
          )}

          {/* Actions - Responsive */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {song.youtube_link && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(song.youtube_link, '_blank')}
                className="h-8 px-2 hover:bg-red-50"
              >
                <Play className="w-4 h-4 text-red-600" />
              </Button>
            )}
            {song.spotify_link && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(song.spotify_link, '_blank')}
                className="h-8 px-2 hover:bg-green-50"
              >
                <ExternalLink className="w-4 h-4 text-green-600" />
              </Button>
            )}
            <SongLyrics songId={song.id}>
              <Button variant="outline" size="sm" className="h-8 px-2">
                <Eye className="w-3 h-3 mr-1" />
                Ver
              </Button>
            </SongLyrics>
            <SongSelectionDialog song={song}>
              <Button variant="outline" size="sm" className="h-8 px-2">
                <Plus className="w-3 h-3 mr-1" />
                Seleccionar
              </Button>
            </SongSelectionDialog>
            <EditSongDialog song={song}>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Edit2 className="w-3 h-3" />
              </Button>
            </EditSongDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongListItem;
