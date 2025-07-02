
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Edit, Trash2, Music } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  difficulty_level: number;
  tempo: string;
  key_signature: string;
  tags: string[];
  youtube_link: string;
  spotify_link: string;
  mood?: string;
  theme?: string;
  last_used_date?: string;
  usage_count?: number;
}

interface SongCardProps {
  song: Song;
  onEdit: (song: Song) => void;
  onDelete: (songId: string, songTitle: string) => void;
  viewMode: 'list' | 'grid';
}

const SongCard = ({ song, onEdit, onDelete, viewMode }: SongCardProps) => {
  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      case 5: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (level: number) => {
    const levels = ['', 'Muy Fácil', 'Fácil', 'Intermedio', 'Difícil', 'Muy Difícil'];
    return levels[level] || 'Sin definir';
  };

  const formatLastUsed = (dateString?: string) => {
    if (!dateString) return 'Nunca usada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-arcana-blue-gradient rounded-full flex items-center justify-center flex-shrink-0">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{song.title}</h3>
                  {song.artist && (
                    <p className="text-sm text-gray-600 truncate">{song.artist}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 ml-4">
              {/* Musical Info */}
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                {song.key_signature && (
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {song.key_signature}
                  </span>
                )}
                {song.tempo && (
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {song.tempo}
                  </span>
                )}
              </div>

              {/* Difficulty */}
              <Badge className={`text-xs ${getDifficultyColor(song.difficulty_level)}`}>
                {getDifficultyText(song.difficulty_level)}
              </Badge>

              {/* Usage Stats */}
              <div className="hidden lg:block text-xs text-gray-500 min-w-0">
                <div>Usada {song.usage_count || 0} veces</div>
                <div>{formatLastUsed(song.last_used_date)}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(song)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(song.id, song.title)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{song.title}</CardTitle>
            {song.artist && (
              <p className="text-sm text-gray-600 truncate">{song.artist}</p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(song)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(song.id, song.title)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Genre and Difficulty */}
        <div className="flex items-center gap-2 flex-wrap">
          {song.genre && (
            <Badge variant="outline" className="text-xs">
              {song.genre}
            </Badge>
          )}
          <Badge className={`text-xs ${getDifficultyColor(song.difficulty_level)}`}>
            {getDifficultyText(song.difficulty_level)}
          </Badge>
          {song.mood && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              {song.mood}
            </Badge>
          )}
        </div>

        {/* Musical Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {song.key_signature && (
            <div>
              <span className="font-medium">Tono:</span> {song.key_signature}
            </div>
          )}
          {song.tempo && (
            <div>
              <span className="font-medium">Tempo:</span> {song.tempo}
            </div>
          )}
        </div>

        {/* Usage Stats */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div>Usada {song.usage_count || 0} veces</div>
          <div>Última vez: {formatLastUsed(song.last_used_date)}</div>
        </div>

        {/* Tags */}
        {song.tags && song.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {song.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
            {song.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{song.tags.length - 3} más
              </span>
            )}
          </div>
        )}

        {/* External Links */}
        <div className="flex items-center gap-2 pt-2">
          {song.youtube_link && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1"
            >
              <a href={song.youtube_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" />
                YouTube
              </a>
            </Button>
          )}
          {song.spotify_link && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1"
            >
              <a href={song.spotify_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" />
                Spotify
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SongCard;
