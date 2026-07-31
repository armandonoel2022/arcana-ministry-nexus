import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bold, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HIGHLIGHT_COLORS, LineFormat, getLineStyle, parseFormat } from './lyricsFormat';

interface LyricsHighlightEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: string;
  lyrics: string;
  bpm?: number | null;
  format?: unknown;
  onSaved: (payload: { bpm: number | null; lyrics_format: { lines: Record<string, LineFormat> } }) => void;
}

const LyricsHighlightEditor: React.FC<LyricsHighlightEditorProps> = ({
  open, onOpenChange, songId, lyrics, bpm, format, onSaved,
}) => {
  const initial = useMemo(() => parseFormat(format).lines || {}, [format]);
  const [lines, setLines] = useState<Record<string, LineFormat>>(initial);
  const [bpmValue, setBpmValue] = useState<string>(bpm ? String(bpm) : '');
  const [saving, setSaving] = useState(false);

  const allLines = useMemo(() => lyrics.split('\n'), [lyrics]);

  const update = (index: number, patch: Partial<LineFormat>) => {
    setLines(prev => {
      const key = String(index);
      const next = { ...prev, [key]: { ...prev[key], ...patch } };
      if (!next[key].bold && (!next[key].color || next[key].color === 'none')) delete next[key];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        bpm: bpmValue ? parseInt(bpmValue, 10) : null,
        lyrics_format: { lines },
      };
      const { error } = await supabase.from('songs').update(payload as never).eq('id', songId);
      if (error) throw error;
      toast.success('Formato de letra guardado');
      onSaved(payload);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error('No se pudo guardar el formato');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Destacar coros y resaltar letra</DialogTitle>
        </DialogHeader>

        <div className="flex items-end gap-3 pb-2">
          <div className="w-32">
            <Label htmlFor="bpm">BPM</Label>
            <Input
              id="bpm"
              type="number"
              min={30}
              max={240}
              placeholder="80"
              value={bpmValue}
              onChange={(e) => setBpmValue(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground pb-2">
            El BPM define la velocidad de desplazamiento del modo Teleprompter.
          </p>
        </div>

        <ScrollArea className="max-h-[55vh] pr-3">
          <div className="space-y-1">
            {allLines.map((text, index) => {
              if (text.trim() === '') return <div key={index} className="h-3" />;
              const fmt = lines[String(index)];
              return (
                <div key={index} className="flex items-center gap-2 rounded-md border p-2">
                  <div className="flex-1 text-sm break-words">
                    <span style={getLineStyle(fmt)}>{text}</span>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant={fmt?.bold ? 'default' : 'outline'}
                    className="h-7 w-7 shrink-0"
                    onClick={() => update(index, { bold: !fmt?.bold })}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </Button>
                  <div className="flex gap-1 shrink-0">
                    {Object.entries(HIGHLIGHT_COLORS).map(([key, c]) => (
                      <button
                        key={key}
                        type="button"
                        title={c.label}
                        onClick={() => update(index, { color: key })}
                        className={`h-5 w-5 rounded-full border ${
                          (fmt?.color || 'none') === key ? 'ring-2 ring-primary ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: key === 'none' ? 'transparent' : c.text }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LyricsHighlightEditor;
