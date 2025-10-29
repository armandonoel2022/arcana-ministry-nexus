
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Music, User, Key, Clock, Star, ExternalLink, Play, Youtube } from "lucide-react";
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
  cover_image_url?: string;
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
          <ScrollArea className="max-h-[calc(85vh-100px)]">
            <div className="space-y-6 pr-4">
              {/* Song Header with Cover */}
              <Card className="overflow-hidden rounded-xl border-2">
                <div className="flex flex-col md:flex-row gap-6 p-6">
                  {/* Cover Image */}
                  {song.cover_image_url && (
                    <div className="flex-shrink-0">
                      <img 
                        src={song.cover_image_url} 
                        alt={song.title}
                        className="w-full md:w-48 h-48 object-cover rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                  
                  {/* Song Info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-3xl font-bold mb-2">{song.title}</h3>
                      {song.artist && (
                        <div className="flex items-center text-muted-foreground">
                          <User className="w-4 h-4 mr-2" />
                          {song.artist}
                        </div>
                      )}
                    </div>

                    {/* Streaming Links */}
                    <div className="flex flex-wrap gap-3">
                      {song.youtube_link && (
                        <Button
                          onClick={() => window.open(song.youtube_link, '_blank')}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6"
                        >
                          <Youtube className="w-5 h-5 mr-2" />
                          YouTube
                        </Button>
                      )}
                      {song.spotify_link && (
                        <Button
                          onClick={() => window.open(song.spotify_link, '_blank')}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
                        >
                          <Music className="w-5 h-5 mr-2" />
                          Spotify
                        </Button>
                      )}
                      {song.sheet_music_url && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(song.sheet_music_url, '_blank')}
                          className="rounded-full px-6"
                        >
                          <FileText className="w-5 h-5 mr-2" />
                          Partitura
                        </Button>
                      )}
                    </div>

                    {/* Song Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      {song.genre && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Género</div>
                          <Badge variant="secondary" className="rounded-full">{song.genre}</Badge>
                        </div>
                      )}
                      {song.key_signature && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Tono</div>
                          <div className="flex items-center font-medium">
                            <Key className="w-3 h-3 mr-1" />
                            {song.key_signature}
                          </div>
                        </div>
                      )}
                      {song.tempo && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Tempo</div>
                          <div className="flex items-center font-medium">
                            <Clock className="w-3 h-3 mr-1" />
                            {song.tempo}
                          </div>
                        </div>
                      )}
                      {song.difficulty_level && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Dificultad</div>
                          <Badge className={`${getDifficultyColor(song.difficulty_level)} rounded-full`}>
                            {getDifficultyLabel(song.difficulty_level)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {song.tags && song.tags.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Etiquetas</div>
                        <div className="flex flex-wrap gap-2">
                          {song.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs rounded-full">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Usage Stats */}
                    {(song.usage_count || song.last_used_date) && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                        {song.usage_count && (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
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
                  </div>
                </div>
              </Card>

              {/* Content Tabs */}
              {(song.lyrics || song.chords || song.director_notes) && (
                <Card className="rounded-xl">
                  <CardContent className="p-6">
                    <Tabs defaultValue="lyrics" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 rounded-lg">
                        {song.lyrics && (
                          <TabsTrigger value="lyrics" className="rounded-md">
                            <Music className="w-4 h-4 mr-2" />
                            Letra
                          </TabsTrigger>
                        )}
                        {song.chords && (
                          <TabsTrigger value="chords" className="rounded-md">
                            <Key className="w-4 h-4 mr-2" />
                            Acordes
                          </TabsTrigger>
                        )}
                        {song.director_notes && (
                          <TabsTrigger value="notes" className="rounded-md">
                            <FileText className="w-4 h-4 mr-2" />
                            Notas
                          </TabsTrigger>
                        )}
                      </TabsList>

                      {song.lyrics && (
                        <TabsContent value="lyrics" className="mt-6">
                          <ScrollArea className="h-96 rounded-lg border p-4">
                            <div className="whitespace-pre-line text-sm leading-relaxed">
                              {formatLyrics(song.lyrics)}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      )}

                      {song.chords && (
                        <TabsContent value="chords" className="mt-6">
                          <ScrollArea className="h-96 rounded-lg border p-4">
                            <div className="font-mono text-sm">
                              {formatChords(song.chords)}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      )}

                      {song.director_notes && (
                        <TabsContent value="notes" className="mt-6">
                          <ScrollArea className="h-96 rounded-lg border p-4">
                            <div className="text-sm leading-relaxed whitespace-pre-line">
                              {song.director_notes}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      )}
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
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
