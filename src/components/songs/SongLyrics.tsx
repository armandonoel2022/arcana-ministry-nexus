
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Music, User, Key, Clock, Star, ExternalLink, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Song {
  id: string;
  title: string;
  artist?: string;
  genre?: string;
  difficulty_level?: number;
  tempo?: string;
  key_signature?: string;
  tags?: string[];
  lyrics?: string;
  chords?: string;
  director_notes?: string;
  youtube_link?: string;
  spotify_link?: string;
  sheet_music_url?: string;
  usage_count?: number;
  last_used_date?: string;
}

interface SongLyricsProps {
  songId: string;
  children: React.ReactNode;
}

const SongLyrics: React.FC<SongLyricsProps> = ({ songId, children }) => {
  const [open, setOpen] = useState(false);
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSongDetails = async () => {
    if (!open) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single();

      if (error) throw error;
      setSong(data);
    } catch (error) {
      console.error('Error loading song details:', error);
      toast.error('Error al cargar los detalles de la canción');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSongDetails();
  }, [open, songId]);

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

  const formatLyrics = (lyrics?: string) => {
    if (!lyrics) return null;
    return lyrics.split('\n').map((line, index) => (
      <div key={index} className={line.trim() === '' ? 'h-4' : 'leading-relaxed'}>
        {line.trim() === '' ? '\u00A0' : line}
      </div>
    ));
  };

  const formatChords = (chords?: string) => {
    if (!chords) return null;
    return chords.split('\n').map((line, index) => (
      <div key={index} className={`font-mono text-sm ${line.trim() === '' ? 'h-4' : 'leading-relaxed'}`}>
        {line.trim() === '' ? '\u00A0' : line}
      </div>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detalles de la Canción
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : song ? (
          <div className="space-y-6">
            {/* Song Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{song.title}</CardTitle>
                    {song.artist && (
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        {song.artist}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {song.youtube_link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(song.youtube_link, '_blank')}
                        className="text-red-600"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    {song.spotify_link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(song.spotify_link, '_blank')}
                        className="text-green-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    {song.sheet_music_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(song.sheet_music_url, '_blank')}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {song.genre && (
                    <div>
                      <div className="text-sm text-gray-500">Género</div>
                      <Badge variant="secondary">{song.genre}</Badge>
                    </div>
                  )}
                  {song.key_signature && (
                    <div>
                      <div className="text-sm text-gray-500">Tono</div>
                      <div className="flex items-center">
                        <Key className="w-3 h-3 mr-1" />
                        <span className="font-medium">{song.key_signature}</span>
                      </div>
                    </div>
                  )}
                  {song.tempo && (
                    <div>
                      <div className="text-sm text-gray-500">Tempo</div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span className="font-medium">{song.tempo}</span>
                      </div>
                    </div>
                  )}
                  {song.difficulty_level && (
                    <div>
                      <div className="text-sm text-gray-500">Dificultad</div>
                      <Badge className={getDifficultyColor(song.difficulty_level)}>
                        {getDifficultyLabel(song.difficulty_level)}
                      </Badge>
                    </div>
                  )}
                </div>

                {song.tags && song.tags.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-2">Etiquetas</div>
                    <div className="flex flex-wrap gap-1">
                      {song.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(song.usage_count || song.last_used_date) && (
                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                    {song.usage_count && (
                      <div className="flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        Usada {song.usage_count} veces
                      </div>
                    )}
                    {song.last_used_date && (
                      <div>
                        Última vez: {new Date(song.last_used_date).toLocaleDateString('es-ES')}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lyrics */}
              {song.lyrics && (
                <Card className="h-96">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      Letra
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full pb-6">
                    <ScrollArea className="h-full">
                      <div className="pr-4 whitespace-pre-line text-sm leading-relaxed">
                        {formatLyrics(song.lyrics)}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Chords */}
              {song.chords && (
                <Card className="h-96">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Acordes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full pb-6">
                    <ScrollArea className="h-full">
                      <div className="pr-4 font-mono text-sm">
                        {formatChords(song.chords)}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Director Notes */}
            {song.director_notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notas del Director</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {song.director_notes}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            No se pudieron cargar los detalles de la canción
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SongLyrics;
