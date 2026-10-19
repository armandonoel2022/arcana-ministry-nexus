import React, { useEffect, useRef, useState } from 'react';
import { X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { saveCanvasImage } from '@/utils/saveImage';

const KEY_PREFIX = 'arcana_pink_october_';

const getRDParts = () => {
  const s = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santo_Domingo' });
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
};

const Ribbon = () => (
  <svg viewBox="0 0 100 140" className="w-20 h-28" aria-hidden="true">
    <path
      d="M50 10 C30 10 26 32 34 48 L18 128 L34 122 L50 72 L66 122 L82 128 L66 48 C74 32 70 10 50 10 Z M50 22 C60 22 62 34 57 44 L50 58 L43 44 C38 34 40 22 50 22 Z"
      fill="#ec4899"
      fillRule="evenodd"
    />
  </svg>
);

const PinkOctoberOverlay = () => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { y, m, d } = getRDParts();
    if (m === 10 && d === 19 && !localStorage.getItem(KEY_PREFIX + y)) {
      const t = setTimeout(() => setOpen(true), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    localStorage.setItem(KEY_PREFIX + getRDParts().y, '1');
    setOpen(false);
  };

  const download = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: null, useCORS: true });
      await saveCanvasImage(canvas, `arcana-se-viste-de-rosa-${getRDParts().y}.png`, 'Hoy ARCANA se viste de rosa');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="relative">
          <button onClick={close} aria-label="Cerrar" className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 text-pink-700 hover:bg-white">
            <X className="w-4 h-4" />
          </button>
          <div
            ref={cardRef}
            className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #fff5f9 0%, #fde7f0 100%)' }}
          >
            <div className="px-8 pt-10 pb-8 text-center">
              <div className="flex justify-center mb-4"><Ribbon /></div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-pink-500 font-semibold">19 de octubre</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight" style={{ color: '#be185d' }}>
                HOY ARCANA<br />SE VISTE DE ROSA
              </h2>
              <div className="mx-auto my-5 h-px w-16" style={{ background: '#f9a8d4' }} />
              <p className="text-[15px] leading-relaxed" style={{ color: '#6b2147' }}>
                En el Día Internacional de la Lucha contra el Cáncer de Mama, elevamos nuestras oraciones por cada mujer que enfrenta esta batalla y promovemos la conciencia sobre la importancia de la prevención y la detección temprana.
              </p>
              <p className="mt-5 text-base font-semibold italic" style={{ color: '#db2777' }}>
                Cuidarnos también es un acto de amor.
              </p>
              <p className="mt-8 text-[10px] tracking-[0.25em] uppercase" style={{ color: '#f472b6' }}>
                ARCANA · Ministerio ADN Arca de Noé
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={download} disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-60">
            <Download className="w-4 h-4" /> {saving ? 'Guardando…' : 'Descargar'}
          </button>
          <button onClick={close} className="flex-1 rounded-xl py-3 font-semibold bg-white text-pink-700 hover:bg-pink-50">
            Amén
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinkOctoberOverlay;
