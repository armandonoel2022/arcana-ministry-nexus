
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ExternalLink } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  created_at: string;
}

interface SongListItemProps {
  song: Song;
  onEdit: (song: Song) => void;
  onDelete: (songId: string, songTitle: string) => void;
}

const SongListItem = ({ song, onEdit, onDelete }: SongListItemProps) => {
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

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{song.title}</h3>
                {song.artist && (
                  <p className="text-sm text-gray-600 truncate">{song.artist}</p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Genre and Difficulty */}
                <div className="flex items-center gap-2">
                  {song.genre && (
                    <Badge variant="outline" className="text-xs">
                      {song.genre}
                    </Badge>
                  )}
                  <Badge className={`text-xs ${getDifficultyColor(song.difficulty_level)}`}>
                    {getDifficultyText(song.difficulty_level)}
                  </Badge>
                </div>

                {/* Musical Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {song.key_signature && (
                    <span><strong>Tono:</strong> {song.key_signature}</span>
                  )}
                  {song.tempo && (
                    <span><strong>Tempo:</strong> {song.tempo}</span>
                  )}
                </div>

                {/* External Links */}
                <div className="flex items-center gap-2">
                  {song.youtube_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
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
                    >
                      <a href={song.spotify_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Spotify
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {song.tags && song.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {song.tags.slice(0, 5).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {song.tags.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{song.tags.length - 5} más
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(song)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar canción?</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que quieres eliminar "{song.title}" del repertorio? 
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(song.id, song.title)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SongListItem;
