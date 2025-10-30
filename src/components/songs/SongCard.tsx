
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music, User, Clock, Star, ExternalLink, Play, Eye, Plus, Edit2 } from 'lucide-react';
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
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden rounded-xl border-2 hover:border-primary/30">
      {/* Cover Image */}
      {song.cover_image_url && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={song.cover_image_url} 
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-2 right-2">
            <SongSelectionIndicator songId={song.id} compact={true} />
          </div>
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Title and Artist */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-lg line-clamp-2 flex-1">{song.title}</h3>
            {!song.cover_image_url && <SongSelectionIndicator songId={song.id} compact={true} />}
          </div>
          {song.artist && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="w-3 h-3 mr-1" />
              {song.artist}
            </div>
          )}
        </div>

        {/* Genre and Key in a row */}
        <div className="flex items-center gap-2 flex-wrap">
          {song.genre && (
            <Badge variant="secondary" className="text-xs">{song.genre}</Badge>
          )}
          {song.key_signature && (
            <Badge variant="outline" className="text-xs">
              Tono: {song.key_signature}
            </Badge>
          )}
          {song.tempo && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {song.tempo}
            </Badge>
          )}
        </div>

        {/* Difficulty */}
        <div className="flex items-center justify-between">
          <Badge className={`text-xs ${getDifficultyColor(song.difficulty_level)}`}>
            {getDifficultyLabel(song.difficulty_level)}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Star className="w-3 h-3 mr-1" />
            {song.usage_count || 0} usos
          </div>
        </div>

        {/* Tags */}
        {song.tags && song.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {song.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">#{tag}</Badge>
            ))}
            {song.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">+{song.tags.length - 2}</Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <SongLyrics songId={song.id}>
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="w-3 h-3 mr-1" />
              Ver
            </Button>
          </SongLyrics>
          <SongSelectionDialog song={song}>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="w-3 h-3 mr-1" />
              Seleccionar
            </Button>
          </SongSelectionDialog>
        </div>

        {/* Link and Edit Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <div className="flex items-center gap-1">
            {song.youtube_link && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(song.youtube_link, '_blank')}
                className="h-8 w-8 p-0 hover:bg-red-50"
              >
                <Play className="w-4 h-4 text-red-600" />
              </Button>
            )}
            {song.spotify_link && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(song.spotify_link, '_blank')}
                className="h-8 w-8 p-0 hover:bg-green-50"
              >
                <ExternalLink className="w-4 h-4 text-green-600" />
              </Button>
            )}
          </div>
          <EditSongDialog song={song}>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Edit2 className="w-3 h-3" />
            </Button>
          </EditSongDialog>
        </div>

        {/* Date */}
        <div className="text-xs text-muted-foreground text-center">
          {formatDate(song.created_at)}
        </div>
      </CardContent>
    </Card>
  );
};

export default SongCard;
