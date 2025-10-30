import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Edit, Upload, Loader2 } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist?: string;
  genre?: string;
  difficulty_level?: number;
  tempo?: string;
  key_signature?: string;
  youtube_link?: string;
  spotify_link?: string;
  lyrics?: string;
  category?: string;
  cover_image_url?: string;
}

interface EditSongDialogProps {
  song: Song;
  onSongUpdated?: () => void;
  children?: React.ReactNode;
}

const EditSongDialog: React.FC<EditSongDialogProps> = ({ song, onSongUpdated, children }) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: song.title,
    artist: song.artist || '',
    genre: song.genre || '',
    difficulty_level: song.difficulty_level || 1,
    tempo: song.tempo || '',
    key_signature: song.key_signature || '',
    youtube_link: song.youtube_link || '',
    spotify_link: song.spotify_link || '',
    lyrics: song.lyrics || '',
    category: song.category || 'general',
    cover_image_url: song.cover_image_url || ''
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${song.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('song-covers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('song-covers')
        .getPublicUrl(filePath);

      handleChange('cover_image_url', publicUrl);
      toast.success('Imagen cargada exitosamente');
    } catch (error: any) {
      toast.error('Error al cargar la imagen: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('songs')
        .update({
          title: formData.title,
          artist: formData.artist || null,
          genre: formData.genre || null,
          difficulty_level: formData.difficulty_level,
          tempo: formData.tempo || null,
          key_signature: formData.key_signature || null,
          youtube_link: formData.youtube_link || null,
          spotify_link: formData.spotify_link || null,
          lyrics: formData.lyrics || null,
          category: formData.category,
          cover_image_url: formData.cover_image_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', song.id);

      if (error) throw error;

      toast.success('Canción actualizada exitosamente');
      setOpen(false);
      if (onSongUpdated) onSongUpdated();
    } catch (error: any) {
      toast.error('Error al actualizar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Canción</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artist">Artista</Label>
              <Input
                id="artist"
                value={formData.artist}
                onChange={(e) => handleChange('artist', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Repertorio General</SelectItem>
                  <SelectItem value="himnario">Himnario de Gloria</SelectItem>
                  <SelectItem value="villancicos">Villancicos</SelectItem>
                  <SelectItem value="adn">ADN Arca de Noé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Género</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => handleChange('genre', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key_signature">Tonalidad</Label>
              <Input
                id="key_signature"
                value={formData.key_signature}
                onChange={(e) => handleChange('key_signature', e.target.value)}
                placeholder="Ej: G, Am, D#"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempo">Tempo</Label>
              <Input
                id="tempo"
                value={formData.tempo}
                onChange={(e) => handleChange('tempo', e.target.value)}
                placeholder="Ej: Lento, Moderado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificultad</Label>
              <Select
                value={String(formData.difficulty_level)}
                onValueChange={(value) => handleChange('difficulty_level', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Muy Fácil</SelectItem>
                  <SelectItem value="2">Fácil</SelectItem>
                  <SelectItem value="3">Intermedio</SelectItem>
                  <SelectItem value="4">Difícil</SelectItem>
                  <SelectItem value="5">Muy Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover_image">Carátula</Label>
              <div className="flex gap-2">
                <Input
                  id="cover_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="flex-1"
                />
                {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
              </div>
              {formData.cover_image_url && (
                <img src={formData.cover_image_url} alt="Preview" className="w-20 h-20 object-cover rounded mt-2" />
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="youtube_link">Link de YouTube</Label>
            <Input
              id="youtube_link"
              type="url"
              value={formData.youtube_link}
              onChange={(e) => handleChange('youtube_link', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="spotify_link">Link de Spotify</Label>
            <Input
              id="spotify_link"
              type="url"
              value={formData.spotify_link}
              onChange={(e) => handleChange('spotify_link', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lyrics">Letra</Label>
            <Textarea
              id="lyrics"
              value={formData.lyrics}
              onChange={(e) => handleChange('lyrics', e.target.value)}
              rows={6}
              placeholder="Letra de la canción..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSongDialog;