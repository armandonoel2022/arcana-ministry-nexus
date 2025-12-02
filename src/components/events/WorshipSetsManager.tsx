import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, Music, Clock, GripVertical, User } from 'lucide-react';
import { toast } from 'sonner';

interface WorshipSet {
  id: string;
  event_id: string;
  set_name: string;
  set_order: number;
  duration_minutes: number;
  set_type: string;
  notes: string | null;
}

interface SetSong {
  id: string;
  set_id: string;
  song_id: string | null;
  song_title: string;
  song_order: number;
  responsible_person: string | null;
  responsible_id: string | null;
  notes: string | null;
}

interface CatalogSong {
  id: string;
  title: string;
  artist: string | null;
}

interface Profile {
  id: string;
  full_name: string;
}

interface WorshipSetsManagerProps {
  eventId: string;
  eventTitle: string;
}

const SET_TYPES = [
  { value: 'worship', label: 'Set de Adoración' },
  { value: 'offering', label: 'Ofrenda' },
  { value: 'communion', label: 'Santa Cena' },
  { value: 'special', label: 'Especial' },
  { value: 'christmas', label: 'Navideño' },
];

const WorshipSetsManager: React.FC<WorshipSetsManagerProps> = ({ eventId, eventTitle }) => {
  const [worshipSets, setWorshipSets] = useState<WorshipSet[]>([]);
  const [songsMap, setSongsMap] = useState<Record<string, SetSong[]>>({});
  const [catalogSongs, setCatalogSongs] = useState<CatalogSong[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingSet, setIsAddingSet] = useState(false);
  const [addingSongToSet, setAddingSongToSet] = useState<string | null>(null);

  const [newSet, setNewSet] = useState({
    set_name: '',
    duration_minutes: 20,
    set_type: 'worship',
  });

  const [newSong, setNewSong] = useState({
    song_title: '',
    song_id: '',
    responsible_person: '',
  });

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch sets
      const { data: setsData, error: setsError } = await supabase
        .from('event_worship_sets')
        .select('*')
        .eq('event_id', eventId)
        .order('set_order', { ascending: true });

      if (setsError) throw setsError;
      setWorshipSets(setsData || []);

      // Fetch songs for each set
      if (setsData && setsData.length > 0) {
        const newSongsMap: Record<string, SetSong[]> = {};
        for (const set of setsData) {
          const { data: setSongsData } = await supabase
            .from('event_set_songs')
            .select('*')
            .eq('set_id', set.id)
            .order('song_order', { ascending: true });
          newSongsMap[set.id] = setSongsData || [];
        }
        setSongsMap(newSongsMap);
      }

      // Fetch available songs from catalog
      const { data: catalogData } = await supabase
        .from('songs')
        .select('id, title, artist')
        .eq('is_active', true)
        .order('title');
      setCatalogSongs(catalogData || []);

      // Fetch profiles for responsible selection
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');
      setProfiles(profilesData || []);

    } catch (error: any) {
      toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createSet = async () => {
    if (!newSet.set_name.trim()) {
      toast.error('El nombre del set es requerido');
      return;
    }

    try {
      const nextOrder = worshipSets.length + 1;
      const { data, error } = await supabase
        .from('event_worship_sets')
        .insert([{
          event_id: eventId,
          set_name: newSet.set_name,
          set_order: nextOrder,
          duration_minutes: newSet.duration_minutes,
          set_type: newSet.set_type,
        }])
        .select()
        .single();

      if (error) throw error;

      setWorshipSets([...worshipSets, data]);
      setSongsMap({ ...songsMap, [data.id]: [] });
      setNewSet({ set_name: '', duration_minutes: 20, set_type: 'worship' });
      setIsAddingSet(false);
      toast.success('Set creado exitosamente');
    } catch (error: any) {
      toast.error('Error al crear set: ' + error.message);
    }
  };

  const deleteSet = async (setId: string) => {
    try {
      const { error } = await supabase
        .from('event_worship_sets')
        .delete()
        .eq('id', setId);

      if (error) throw error;

      setWorshipSets(worshipSets.filter(s => s.id !== setId));
      const newMap = { ...songsMap };
      delete newMap[setId];
      setSongsMap(newMap);
      toast.success('Set eliminado');
    } catch (error: any) {
      toast.error('Error al eliminar set: ' + error.message);
    }
  };

  const addSongToSet = async (setId: string) => {
    if (!newSong.song_title.trim()) {
      toast.error('El título de la canción es requerido');
      return;
    }

    try {
      const currentSongs = songsMap[setId] || [];
      const nextOrder = currentSongs.length + 1;

      const { data, error } = await supabase
        .from('event_set_songs')
        .insert([{
          set_id: setId,
          song_id: newSong.song_id || null,
          song_title: newSong.song_title,
          song_order: nextOrder,
          responsible_person: newSong.responsible_person || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setSongsMap({
        ...songsMap,
        [setId]: [...currentSongs, data],
      });
      setNewSong({ song_title: '', song_id: '', responsible_person: '' });
      setAddingSongToSet(null);
      toast.success('Canción agregada');
    } catch (error: any) {
      toast.error('Error al agregar canción: ' + error.message);
    }
  };

  const removeSongFromSet = async (setId: string, songId: string) => {
    try {
      const { error } = await supabase
        .from('event_set_songs')
        .delete()
        .eq('id', songId);

      if (error) throw error;

      setSongsMap({
        ...songsMap,
        [setId]: (songsMap[setId] || []).filter(s => s.id !== songId),
      });
      toast.success('Canción eliminada');
    } catch (error: any) {
      toast.error('Error al eliminar canción: ' + error.message);
    }
  };

  const getSetTypeLabel = (type: string) => {
    return SET_TYPES.find(t => t.value === type)?.label || type;
  };

  const handleSongSelect = (songId: string) => {
    const selectedSong = catalogSongs.find(s => s.id === songId);
    if (selectedSong) {
      setNewSong({
        ...newSong,
        song_id: songId,
        song_title: selectedSong.title,
      });
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Cargando sets de adoración...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Sets de Adoración</h3>
        <Button onClick={() => setIsAddingSet(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Set
        </Button>
      </div>

      {/* Form to add new set */}
      {isAddingSet && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nuevo Set</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Nombre del Set</Label>
              <Input
                value={newSet.set_name}
                onChange={(e) => setNewSet({ ...newSet, set_name: e.target.value })}
                placeholder="Ej: 1er Set, Ofrenda, Santa Cena"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Tipo</Label>
                <Select
                  value={newSet.set_type}
                  onValueChange={(v) => setNewSet({ ...newSet, set_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SET_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Duración (min)</Label>
                <Input
                  type="number"
                  value={newSet.duration_minutes}
                  onChange={(e) => setNewSet({ ...newSet, duration_minutes: parseInt(e.target.value) || 20 })}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsAddingSet(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={createSet}>
                Crear Set
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sets accordion */}
      {worshipSets.length > 0 ? (
        <Accordion type="multiple" className="space-y-2">
          {worshipSets.map((set) => (
            <AccordionItem key={set.id} value={set.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 text-left flex-1">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-semibold">{set.set_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span className="bg-primary/10 px-2 py-0.5 rounded text-primary">
                        {getSetTypeLabel(set.set_type)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {set.duration_minutes} min
                      </span>
                      <span className="flex items-center">
                        <Music className="w-3 h-3 mr-1" />
                        {(songsMap[set.id] || []).length} canciones
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {/* Songs list */}
                <div className="space-y-2 mb-3">
                  {(songsMap[set.id] || []).map((song, index) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                    >
                      <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{song.song_title}</div>
                        {song.responsible_person && (
                          <div className="text-xs text-muted-foreground flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {song.responsible_person}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeSongFromSet(set.id, song.id)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add song form */}
                {addingSongToSet === set.id ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <Label className="text-sm">Canción</Label>
                        <Select onValueChange={handleSongSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar del catálogo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogSongs.map(song => (
                              <SelectItem key={song.id} value={song.id}>
                                {song.title} {song.artist && `- ${song.artist}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          className="mt-2"
                          value={newSong.song_title}
                          onChange={(e) => setNewSong({ ...newSong, song_title: e.target.value })}
                          placeholder="O escribir título manualmente"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Responsable</Label>
                        <Select
                          value={newSong.responsible_person}
                          onValueChange={(v) => setNewSong({ ...newSong, responsible_person: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar responsable..." />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map(profile => (
                              <SelectItem key={profile.id} value={profile.full_name}>
                                {profile.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAddingSongToSet(null);
                            setNewSong({ song_title: '', song_id: '', responsible_person: '' });
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => addSongToSet(set.id)}>
                          Agregar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setAddingSongToSet(set.id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Canción
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteSet(set.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No hay sets de adoración configurados</p>
          <p className="text-sm">Agrega sets con canciones para este evento</p>
        </div>
      )}
    </div>
  );
};

export default WorshipSetsManager;
