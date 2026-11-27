import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import '@/index.css';
import '@/App.css';
import { DailyVerseOverlay } from '@/components/notifications/DailyVerseOverlay';
import ExtraordinaryRehearsalOverlay from '@/components/notifications/ExtraordinaryRehearsalOverlay';
import { canvasToBlob, downloadBlob } from '@/utils/saveImage';
import { shareOrCopyText } from '@/utils/shareText';

const REMOTE =
  'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/1d5866c9-cdc1-439e-976a-2d2e6a5aef80.jpeg';

const w = window as any;
const MODE = new URLSearchParams(location.search).get('mode') || 'verse';

function Check() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(true);

  w.__testRemote = async () => {
    try {
      const canvas = await html2canvas(ref.current!, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        imageTimeout: 15000,
      });
      const blob = await canvasToBlob(canvas);
      w.__remote = { ok: true, bytes: blob.size, type: blob.type };
      await downloadBlob(blob, 'prueba-remota.png');
    } catch (err) {
      w.__remote = { ok: false, error: String(err) };
    }
  };

  w.__shareText = () => shareOrCopyText({ title: 'ARCANA', text: 'Texto de prueba ARCANA' });

  if (MODE === 'rehearsal') {
    return (
      <ExtraordinaryRehearsalOverlay
        activityName="Ensayo extraordinario"
        date="2026-12-05"
        time="19:00"
        location="Templo Central"
        additionalNotes="Traer carpeta y uniforme"
        onClose={() => setOpen(false)}
      />
    );
  }

  return (
    <>
      <div
        ref={ref}
        style={{ position: 'fixed', left: -3000, top: 0, width: 420, background: '#fff', padding: 16 }}
      >
        <img
          src={REMOTE}
          crossOrigin="anonymous"
          style={{ width: 200, height: 200, objectFit: 'cover' }}
        />
        <div style={{ fontSize: 20, color: '#333' }}>Tarjeta de prueba</div>
      </div>
      {open && (
        <DailyVerseOverlay
          verseText="Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito."
          verseReference="Juan 3:16"
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<Check />);
