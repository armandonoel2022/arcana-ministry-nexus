export interface LineFormat {
  bold?: boolean;
  color?: string; // key of HIGHLIGHT_COLORS
}

export interface LyricsFormat {
  lines?: Record<string, LineFormat>;
}

export const HIGHLIGHT_COLORS: Record<string, { label: string; text: string; bg: string }> = {
  none: { label: 'Sin resaltado', text: '', bg: 'transparent' },
  amber: { label: 'Ámbar', text: '#f59e0b', bg: 'rgba(245,158,11,0.18)' },
  blue: { label: 'Azul', text: '#3b82f6', bg: 'rgba(59,130,246,0.18)' },
  green: { label: 'Verde', text: '#22c55e', bg: 'rgba(34,197,94,0.18)' },
  red: { label: 'Rojo', text: '#ef4444', bg: 'rgba(239,68,68,0.18)' },
  purple: { label: 'Morado', text: '#a855f7', bg: 'rgba(168,85,247,0.18)' },
  pink: { label: 'Rosa', text: '#ec4899', bg: 'rgba(236,72,153,0.18)' },
};

export const parseFormat = (raw: unknown): LyricsFormat => {
  if (!raw || typeof raw !== 'object') return { lines: {} };
  const obj = raw as LyricsFormat;
  return { lines: obj.lines || {} };
};

export const getLineStyle = (fmt: LineFormat | undefined, dark = false): React.CSSProperties => {
  if (!fmt) return {};
  const color = fmt.color && fmt.color !== 'none' ? HIGHLIGHT_COLORS[fmt.color] : undefined;
  return {
    fontWeight: fmt.bold ? 700 : undefined,
    color: color ? (dark ? color.text : color.text) : undefined,
    backgroundColor: color ? color.bg : undefined,
    borderRadius: color ? 4 : undefined,
    padding: color ? '1px 6px' : undefined,
    display: color ? 'inline-block' : undefined,
  };
};

/** Splits lyrics into blocks (strophes/choruses) keeping original line indexes. */
export interface LyricBlock {
  lines: { index: number; text: string }[];
}

export const splitBlocks = (lyrics: string): LyricBlock[] => {
  const all = lyrics.split('\n');
  const blocks: LyricBlock[] = [];
  let current: LyricBlock = { lines: [] };
  all.forEach((text, index) => {
    if (text.trim() === '') {
      if (current.lines.length) {
        blocks.push(current);
        current = { lines: [] };
      }
    } else {
      current.lines.push({ index, text });
    }
  });
  if (current.lines.length) blocks.push(current);
  return blocks;
};
