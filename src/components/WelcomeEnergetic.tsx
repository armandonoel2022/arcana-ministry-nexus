import { useEffect, useState } from "react";
import { Sparkles, Music, Users, Heart, Calendar, Zap } from "lucide-react";

interface Props {
  userName?: string | null;
  onComplete: () => void;
}

const pillars = [
  { icon: Music, label: "Adorar" },
  { icon: Users, label: "Cuidar" },
  { icon: Calendar, label: "Organizar" },
  { icon: Heart, label: "Servir" },
  { icon: Zap, label: "Fluir" },
];

/**
 * Animación energética de bienvenida — se muestra una vez por usuario,
 * al completar su primer inicio de sesión. Ritmo rápido, springs con rebote,
 * cascada de íconos, saludo personalizado.
 */
export default function WelcomeEnergetic({ userName, onComplete }: Props) {
  const [phase, setPhase] = useState(0); // 0 hello, 1 pillars, 2 tagline, 3 outro
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 2600),
      setTimeout(() => setPhase(3), 3800),
      setTimeout(() => setLeaving(true), 4400),
      setTimeout(() => onComplete(), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const firstName = (userName || "").split(" ")[0] || "hermano";

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${
        leaving ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
      style={{
        background:
          "linear-gradient(135deg, #1e40af 0%, #2563eb 40%, #0ea5e9 100%)",
      }}
    >
      {/* Confetti / puntos flotantes */}
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-bounce"
          style={{
            width: `${6 + (i % 4) * 4}px`,
            height: `${6 + (i % 4) * 4}px`,
            top: `${(i * 37) % 100}%`,
            left: `${(i * 53) % 100}%`,
            background: i % 3 === 0 ? "#fde68a" : i % 3 === 1 ? "#ffffff" : "#a5f3fc",
            opacity: 0.55,
            animationDelay: `${(i % 6) * 0.15}s`,
            animationDuration: `${1.2 + (i % 4) * 0.4}s`,
          }}
        />
      ))}

      {/* Halo blanco */}
      <div className="absolute w-[420px] h-[420px] rounded-full bg-white/15 blur-3xl" />

      {/* Fase 0 & 1: saludo + logo */}
      <div className="relative z-10 text-center px-6">
        <div className="mb-6 flex justify-center">
          <img
            src="/__l5e/assets-v1/30f1f077-4c41-44bd-9b74-0f1051f26bd1/arcana-logo.png"
            alt="ARCANA"
            className="w-24 h-24 rounded-3xl border-4 border-white/50 shadow-2xl animate-scale-in"
            style={{ animationDuration: "0.5s" }}
          />
        </div>

        <div className="flex items-center justify-center gap-2 mb-2 animate-fade-in">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span className="uppercase tracking-widest text-xs text-white/90 font-semibold">
            Bienvenido
          </span>
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </div>

        <h1
          key={`hello-${phase}`}
          className="text-white font-bold animate-scale-in"
          style={{
            fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
            animationDuration: "0.6s",
            textShadow: "0 4px 24px rgba(0,0,0,0.25)",
          }}
        >
          ¡Hola, {firstName}!
        </h1>

        {/* Fase 1: cascada de pilares */}
        {phase >= 1 && (
          <div className="mt-8 flex justify-center gap-3 md:gap-5">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.label}
                  className="flex flex-col items-center gap-2 animate-scale-in"
                  style={{
                    animationDelay: `${i * 110}ms`,
                    animationDuration: "0.5s",
                    animationFillMode: "backwards",
                  }}
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[11px] md:text-xs uppercase tracking-wider text-white/90 font-semibold">
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Fase 2: tagline */}
        {phase >= 2 && (
          <p
            className="mt-8 text-white text-lg md:text-xl font-light animate-fade-in"
            style={{ animationDuration: "0.5s" }}
          >
            Listo para <span className="font-semibold text-yellow-200">servir con propósito</span>.
          </p>
        )}

        {/* Fase 3: firma */}
        {phase >= 3 && (
          <p
            className="mt-6 text-white/80 text-xs uppercase tracking-[0.35em] animate-fade-in"
            style={{ animationDuration: "0.4s" }}
          >
            ARCANA · Ministerio ADN
          </p>
        )}
      </div>
    </div>
  );
}
