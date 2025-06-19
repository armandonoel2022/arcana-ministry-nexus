
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Music, Save, Loader2 } from 'lucide-react';

const songSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  artist: z.string().optional(),
  genre: z.string().optional(),
  difficulty_level: z.number().min(1).max(5),
  tempo: z.string().optional(),
  key_signature: z.string().optional(),
  lyrics: z.string().optional(),
  chords: z.string().optional(),
  youtube_link: z.string().url('Debe ser un URL válido').optional().or(z.literal('')),
  spotify_link: z.string().url('Debe ser un URL válido').optional().or(z.literal('')),
  tags: z.string().optional(),
});

type SongFormData = z.infer<typeof songSchema>;

const AddSongForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SongFormData>({
    resolver: zodResolver(songSchema),
    defaultValues: {
      title: '',
      artist: '',
      genre: '',
      difficulty_level: 1,
      tempo: '',
      key_signature: '',
      lyrics: '',
      chords: '',
      youtube_link: '',
      spotify_link: '',
      tags: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: SongFormData) => {
      const songData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        youtube_link: data.youtube_link || null,
        spotify_link: data.spotify_link || null,
        is_active: true,
      };

      const { error } = await supabase
        .from('songs')
        .insert([songData]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'La canción ha sido agregada al repertorio',
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `No se pudo agregar la canción: ${error.message}`,
      });
    },
  });

  const onSubmit = (data: SongFormData) => {
    mutation.mutate(data);
  };

  const genres = [
    'Adoración',
    'Alabanza',
    'Balada',
    'Rock',
    'Pop',
    'Gospel',
    'Himno',
    'Contemporáneo',
    'Tradicional',
  ];

  const keySignatures = [
    'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
    'Am', 'A#m', 'Bbm', 'Bm', 'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm'
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle>Agregar Nueva Canción</CardTitle>
            <p className="text-sm text-gray-600">Completa la información de la canción</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la canción" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="artist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artista</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del artista o compositor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Género</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un género" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genres.map((genre) => (
                            <SelectItem key={genre} value={genre}>
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiquetas</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Separar con comas (ej: navidad, alegre, fácil)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Información Musical */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Información Musical</h3>
                
                <FormField
                  control={form.control}
                  name="difficulty_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel de Dificultad</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el nivel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 - Muy Fácil</SelectItem>
                          <SelectItem value="2">2 - Fácil</SelectItem>
                          <SelectItem value="3">3 - Intermedio</SelectItem>
                          <SelectItem value="4">4 - Difícil</SelectItem>
                          <SelectItem value="5">5 - Muy Difícil</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="key_signature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tono</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tono" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {keySignatures.map((key) => (
                            <SelectItem key={key} value={key}>
                              {key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tempo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo</FormLabel>
                      <FormControl>
                        <Input placeholder="ej: Lento, Moderado, Rápido o 120 BPM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Enlaces */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Enlaces</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="youtube_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link de YouTube</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="spotify_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link de Spotify</FormLabel>
                      <FormControl>
                        <Input placeholder="https://open.spotify.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Letras y Acordes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="lyrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Letra</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Letra de la canción..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acordes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Progresión de acordes o cifrado..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-arcana-gradient hover:opacity-90"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Agregar Canción
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddSongForm;
