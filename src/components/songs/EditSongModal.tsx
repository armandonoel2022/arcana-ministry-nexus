
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  director_notes?: string;
}

interface EditSongModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EditSongModal = ({ song, isOpen, onClose, onSave }: EditSongModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    genre: '',
    difficulty_level: 1,
    tempo: '',
    key_signature: '',
    tags: '',
    youtube_link: '',
    spotify_link: '',
    mood: '',
    theme: '',
    director_notes: ''
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title || '',
        artist: song.artist || '',
        genre: song.genre || '',
        difficulty_level: song.difficulty_level || 1,
        tempo: song.tempo || '',
        key_signature: song.key_signature || '',
        tags: song.tags ? song.tags.join(', ') : '',
        youtube_link: song.youtube_link || '',
        spotify_link: song.spotify_link || '',
        mood: song.mood || '',
        theme: song.theme || '',
        director_notes: song.director_notes || ''
      });
    }
  }, [song]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!song) return;

    setSaving(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error } = await supabase
        .from('songs')
        .update({
          title: formData.title,
          artist: formData.artist || null,
          genre: formData.genre || null,
          difficulty_level: formData.difficulty_level,
          tempo: formData.tempo || null,
          key_signature: formData.key_signature || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          youtube_link: formData.youtube_link || null,
          spotify_link: formData.spotify_link || null,
          mood: formData.mood || null,
          theme: formData.theme || null,
          director_notes: formData.director_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', song.id);

      if (error) throw error;

      toast({
        title: "Canción actualizada",
        description: `"${formData.title}" ha sido actualizada exitosamente.`,
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating song:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la canción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!song) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Canción</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="artist">Artista</Label>
              <Input
                id="artist"
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
              />
            </div>
          </div>

          {/* Musical Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="key_signature">Tono</Label>
              <Input
                id="key_signature"
                type="text"
                value={formData.key_signature}
                onChange={(e) => setFormData(prev => ({ ...prev, key_signature: e.target.value }))}
                placeholder="Ej: C, G, Am"
              />
            </div>
            <div>
              <Label htmlFor="tempo">Tempo</Label>
              <Input
                id="tempo"
                type="text"
                value={formData.tempo}
                onChange={(e) => setFormData(prev => ({ ...prev, tempo: e.target.value }))}
                placeholder="Ej: Lento, Moderado"
              />
            </div>
            <div>
              <Label htmlFor="genre">Género</Label>
              <Input
                id="genre"
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                placeholder="Ej: Adoración, Alabanza"
              />
            </div>
            <div>
              <Label htmlFor="difficulty_level">Nivel de Dificultad</Label>
              <Select 
                value={formData.difficulty_level.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Muy Fácil</SelectItem>
                  <SelectItem value="2">2 - Fácil</SelectItem>
                  <SelectItem value="3">3 - Intermedio</SelectItem>
                  <SelectItem value="4">4 - Difícil</SelectItem>
                  <SelectItem value="5">5 - Muy Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mood and Theme */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mood">Estado de Ánimo</Label>
              <Input
                id="mood"
                type="text"
                value={formData.mood}
                onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                placeholder="Ej: Alegre, Contemplativo, Celebrativo"
              />
            </div>
            <div>
              <Label htmlFor="theme">Tema</Label>
              <Input
                id="theme"
                type="text"
                value={formData.theme}
                onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                placeholder="Ej: Navidad, Pascua, Gratitud"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Etiquetas</Label>
            <Input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Separadas por comas: lenta, emotiva, navideña"
            />
          </div>

          {/* External Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="youtube_link">Enlace de YouTube</Label>
              <Input
                id="youtube_link"
                type="url"
                value={formData.youtube_link}
                onChange={(e) => setFormData(prev => ({ ...prev, youtube_link: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <Label htmlFor="spotify_link">Enlace de Spotify</Label>
              <Input
                id="spotify_link"
                type="url"
                value={formData.spotify_link}
                onChange={(e) => setFormData(prev => ({ ...prev, spotify_link: e.target.value }))}
                placeholder="https://open.spotify.com/track/..."
              />
            </div>
          </div>

          {/* Director Notes */}
          <div>
            <Label htmlFor="director_notes">Notas del Director</Label>
            <Input
              id="director_notes"
              type="text"
              value={formData.director_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, director_notes: e.target.value }))}
              placeholder="Notas especiales para directores de alabanza"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !formData.title.trim()}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSongModal;
