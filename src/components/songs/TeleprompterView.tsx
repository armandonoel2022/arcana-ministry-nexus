import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  X, Play, Pause, Rewind, Map as MapIcon, ScrollText,
  ChevronLeft, ChevronRight, Minus, Plus,
} from 'lucide-react';
import { getLineStyle, parseFormat, splitBlocks } from './lyricsFormat';

interface TeleprompterViewProps {
  title: string;
  artist?: string;
  lyrics: string;
  bpm?: number | null;
  format?: unknown;
  onClose: () => void;
}

const TeleprompterView: React.FC<TeleprompterViewProps> = ({
  title, artist, lyrics, bpm, format, onClose,
}) => {
  const fmt = useMemo(() => parseFormat(format), [format]);
  const blocks = useMemo(() => splitBlocks(lyrics), [lyrics]);

  const [mapMode, setMapMode] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fontSize, setFontSize] = useState(30);
  const [activeBlock, setActiveBlock] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>();
  const lastTsRef = useRef<number>(0);
  const accRef = useRef<number>(0);

  const effectiveBpm = bpm && bpm > 0 ? bpm : 80;

  // Continuous auto-scroll (normal mode)
  useEffect(() => {
    if (mapMode || !playing) return;
    const step = (ts: number) => {
      const el = scrollRef.current;
      if (el) {
        if (!lastTsRef.current) lastTsRef.current = ts;
        const dt = (ts - lastTsRef.current) / 1000;
        lastTsRef.current = ts;
        const pxPerSecond = (effectiveBpm / 60) * (fontSize * 0.5) * speed;
        accRef.current += pxPerSecond * dt;
        if (accRef.current >= 1) {
          el.scrollTop += accRef.current;
          accRef.current = 0;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = 0;
    };
  }, [playing, mapMode, speed, effectiveBpm, fontSize]);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(blocks.length - 1, index));
    setActiveBlock(clamped);
    blockRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [blocks.length]);

  // Auto-advance in map mode (based on BPM: ~4 beats per line)
  useEffect(() => {
    if (!mapMode || !playing) return;
    const lines = blocks[activeBlock]?.lines.length || 1;
    const beats = lines * 4;
    const ms = (beats * 60000) / effectiveBpm / speed;
    const t = setTimeout(() => {
      if (activeBlock >= blocks.length - 1) setPlaying(false);
      else goTo(activeBlock + 1);
    }, ms);
    return () => clearTimeout(t);
  }, [mapMode, playing, activeBlock, blocks, effectiveBpm, speed, goTo]);

  useEffect(() => {
    if (mapMode) goTo(activeBlock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMode]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p); }
      if (mapMode && e.key === 'ArrowRight') goTo(activeBlock + 1);
      if (mapMode && e.key === 'ArrowLeft') goTo(activeBlock - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, mapMode, activeBlock, goTo]);

  // Swipe gestures (map mode)
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!mapMode || !touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goTo(activeBlock + 1);
      else goTo(activeBlock - 1);
    }
  };

  const restart = () => {
    setPlaying(false);
    setActiveBlock(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    if (mapMode) blockRefs.current[0]?.scrollIntoView({ block: 'center' });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          {artist && <div className="text-xs text-white/50 truncate">{artist}</div>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 hidden sm:inline">{effectiveBpm} BPM</span>
          <Button
            size="sm"
            variant={mapMode ? 'default' : 'outline'}
            onClick={() => { setPlaying(false); setMapMode(m => !m); }}
            className={mapMode ? '' : 'border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white'}
          >
            {mapMode ? <MapIcon className="w-4 h-4 mr-1" /> : <ScrollText className="w-4 h-4 mr-1" />}
            {mapMode ? 'Modo Mapa' : 'Normal'}
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-white/10 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Lyrics */}
      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => !mapMode && setPlaying(p => !p)}
        className="flex-1 overflow-y-auto px-6 py-[35vh] text-center select-none"
      >
        {blocks.length === 0 ? (
          <div className="text-white/50">Esta canción no tiene letra cargada.</div>
        ) : (
          blocks.map((block, bi) => {
            const isActive = !mapMode || bi === activeBlock;
            return (
              <div
                key={bi}
                ref={(el) => (blockRefs.current[bi] = el)}
                onClick={() => mapMode && goTo(bi)}
                className={`mb-10 transition-all duration-300 ${
                  mapMode && bi < activeBlock ? 'opacity-20 line-through decoration-white/30' : ''
                } ${mapMode && bi > activeBlock ? 'opacity-30' : ''} ${
                  mapMode && isActive ? 'opacity-100 scale-100' : ''
                }`}
                style={{ fontSize: mapMode && !isActive ? fontSize * 0.65 : fontSize, lineHeight: 1.45 }}
              >
                {block.lines.map((line) => (
                  <div key={line.index}>
                    <span style={getLineStyle(fmt.lines?.[String(line.index)], true)}>{line.text}</span>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Controls */}
      <div className="shrink-0 border-t border-white/10 px-4 py-3 space-y-3 bg-black/90">
        <div className="flex items-center justify-center gap-3">
          {mapMode && (
            <Button size="icon" variant="ghost" onClick={() => goTo(activeBlock - 1)} className="text-white hover:bg-white/10 hover:text-white">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={restart} className="text-white hover:bg-white/10 hover:text-white">
            <Rewind className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            onClick={() => setPlaying(p => !p)}
            className="rounded-full w-14 h-14 p-0"
          >
            {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
          {mapMode && (
            <Button size="icon" variant="ghost" onClick={() => goTo(activeBlock + 1)} className="text-white hover:bg-white/10 hover:text-white">
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 max-w-xl mx-auto">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[11px] text-white/50 w-20">Velocidad {speed.toFixed(1)}x</span>
            <Slider value={[speed]} min={0.3} max={3} step={0.1} onValueChange={(v) => setSpeed(v[0])} />
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => setFontSize(s => Math.max(16, s - 2))} className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-[11px] text-white/50 w-8 text-center">{fontSize}</span>
            <Button size="icon" variant="ghost" onClick={() => setFontSize(s => Math.min(72, s + 2))} className="text-white hover:bg-white/10 hover:text-white h-8 w-8">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="text-center text-[11px] text-white/40">
          {mapMode
            ? `Bloque ${activeBlock + 1} de ${blocks.length} · Desliza a la izquierda al terminar cada parte`
            : 'Toca la letra para pausar o reanudar'}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TeleprompterView;
