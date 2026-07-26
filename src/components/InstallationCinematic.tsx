import { useEffect, useState } from "react";

interface Props {
  onComplete: () => void;
}

/**
 * Animación cinematográfica que se muestra UNA sola vez por dispositivo,
 * en la primera instalación. Revela la identidad de ARCANA con un ritmo
 * editorial (fade-ins lentos, tipografía grande, mensajes de misión).
 */
const scenes = [
  { kicker: "Ministerio ADN · Arca de Noé", title: "ARCANA", sub: "De la sobrecarga a la fluidez" },
  { kicker: "Inteligencia ministerial", title: "Cuidamos\na nuestra gente", sub: "Sin aumentar la carga administrativa" },
  { kicker: "Menos caos · más claridad", title: "Recuperar\nla alegría de servir", sub: "Enfocarnos en aquello para lo que fuimos llamados" },
  { kicker: "Bienvenido", title: "La adoración\nes nuestra vida", sub: "No es un programa. Es nuestra vida." },
];

const SCENE_MS = 2600;

export default function InstallationCinematic({ onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (index >= scenes.length) {
      setFading(true);
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIndex((i) => i + 1), SCENE_MS);
    return () => clearTimeout(t);
  }, [index, onComplete]);

  const current = scenes[Math.min(index, scenes.length - 1)];
  const progress = Math.min((index + 1) / scenes.length, 1);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, #1e3a8a 0%, #0b1230 45%, #05070f 100%)",
      }}
    >
      {/* Grano/estrellas sutiles */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* Halo dorado detrás del logo */}
      <div
        className="absolute w-[520px] h-[520px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(201,168,76,0.55), transparent 65%)",
        }}
      />

      {/* Logo */}
      <img
        key={`logo-${index}`}
        src="/__l5e/assets-v1/30f1f077-4c41-44bd-9b74-0f1051f26bd1/arcana-logo.png"
        alt="ARCANA"
        className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover mb-10 border border-white/15 shadow-2xl animate-fade-in"
        style={{ animationDuration: "1.4s" }}
      />

      {/* Contenido de la escena */}
      <div
        key={`scene-${index}`}
        className="relative z-10 text-center px-8 max-w-2xl animate-fade-in"
        style={{ animationDuration: "1.4s" }}
      >
        <p
          className="uppercase tracking-[0.35em] text-[10px] md:text-xs mb-5"
          style={{ color: "#c9a84c" }}
        >
          {current.kicker}
        </p>
        <h1
          className="font-serif text-white font-light leading-[1.05] whitespace-pre-line"
          style={{
            fontSize: "clamp(2.75rem, 7vw, 5rem)",
            fontFamily: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif",
            letterSpacing: "-0.01em",
          }}
        >
          {current.title}
        </h1>
        <p className="mt-6 text-white/70 text-sm md:text-base font-light tracking-wide">
          {current.sub}
        </p>
      </div>

      {/* Línea de progreso editorial */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-56 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-[2400ms] ease-out"
          style={{
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg, #c9a84c, #f0d78c)",
          }}
        />
      </div>

      <p className="absolute bottom-6 text-[10px] tracking-[0.4em] uppercase text-white/40">
        ARCANA · Inteligencia Ministerial
      </p>
    </div>
  );
}
