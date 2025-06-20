
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Mic, Music, Heart, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";

const Recomendaciones = () => {
  const [feedback, setFeedback] = useState<{[key: string]: 'up' | 'down' | null}>({});

  const handleFeedback = (tipId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [tipId]: type
    }));
  };

  const voiceTips = [
    {
      id: "voice-1",
      title: "Ejercicio de Respiración Diafragmática",
      description: "Acuéstate boca arriba, coloca un libro sobre tu abdomen y respira profundamente, haciendo que el libro suba y baje. Repite 10 veces.",
      why: "Fortalece el control del aire para notas sostenidas."
    },
    {
      id: "voice-2",
      title: "Vocalización en Escalas",
      description: "Canta 'Do-Re-Mi-Fa-Sol-Fa-Mi-Re-Do' en 3 tonalidades diferentes (empezando en C, D, E).",
      why: "Mejora tu rango y afinación."
    },
    {
      id: "voice-3",
      title: "Hidratación Profunda",
      description: "Té de jengibre con miel 30 minutos antes de cantar. Evita lácteos y café.",
      why: "Reduce la irritación de cuerdas vocales."
    }
  ];

  const musicTips = [
    {
      id: "music-1",
      instrument: "guitarra",
      title: "Ejercicio de Cambios de Acordes",
      description: "Practica transiciones entre G, C, D y Em a 60 BPM durante 10 minutos.",
      why: "Mejora fluidez en alabanza contemporánea."
    },
    {
      id: "music-2",
      instrument: "batería",
      title: "Ritmo 6/8 con Metrónomo",
      description: "Toca un patrón básico de 6/8 a 80 BPM, enfocándote en el hi-hat.",
      why: "Esencial para himnos y baladas."
    },
    {
      id: "music-3",
      instrument: "bajo",
      title: "Walking Bass en C",
      description: "Crea una línea de bajo caminando entre C, E, G y A.",
      why: "Fortalece creatividad en interludios."
    }
  ];

  const danceTips = [
    {
      id: "dance-1",
      style: "alabanza",
      title: "Flujo con Pañuelos",
      description: "Practica movimientos circulares con pañuelos en ambas manos al ritmo de 4/4.",
      why: "Añade expresión visual a la adoración."
    },
    {
      id: "dance-2",
      style: "intercesión",
      title: "Posturas de Quebrantamiento",
      description: "Combina arrodillarse, levantar manos y giros lentos en secuencia.",
      why: "Profundiza en la conexión espiritual."
    },
    {
      id: "dance-3",
      style: "festiva",
      title: "Saltos con Palmas Sincronizadas",
      description: "Salta en X mientras palmeas arriba y abajo (8 repeticiones).",
      why: "Energiza alabanza jubilosa."
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold arcana-gradient-text">Recomendaciones</h1>
          <p className="text-gray-600">Ejercicios y consejos para mejorar tu servicio</p>
        </div>
      </div>

      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            VOZ
          </TabsTrigger>
          <TabsTrigger value="music" className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            MÚSICA
          </TabsTrigger>
          <TabsTrigger value="dance" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            DANZA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {voiceTips.map((tip) => (
              <RecommendationCard
                key={tip.id}
                title={tip.title}
                description={tip.description}
                why={tip.why}
                onFeedback={(type) => handleFeedback(tip.id, type)}
                currentFeedback={feedback[tip.id]}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="music" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {musicTips.map((tip) => (
              <RecommendationCard
                key={tip.id}
                title={tip.title}
                description={tip.description}
                why={tip.why}
                instrument={tip.instrument}
                onFeedback={(type) => handleFeedback(tip.id, type)}
                currentFeedback={feedback[tip.id]}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {danceTips.map((tip) => (
              <RecommendationCard
                key={tip.id}
                title={tip.title}
                description={tip.description}
                why={tip.why}
                style={tip.style}
                onFeedback={(type) => handleFeedback(tip.id, type)}
                currentFeedback={feedback[tip.id]}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Recomendaciones;
