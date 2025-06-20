
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Mic, Music, Heart, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { useToast } from "@/hooks/use-toast";

const Recomendaciones = () => {
  const [feedback, setFeedback] = useState<{[key: string]: 'up' | 'down' | null}>({});
  const { toast } = useToast();

  const handleFeedback = (tipId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [tipId]: type
    }));
  };

  const handleTestNotification = () => {
    const allTips = [...voiceTips, ...musicTips, ...danceTips];
    const randomTip = allTips[Math.floor(Math.random() * allTips.length)];
    
    toast({
      title: "🔔 Recomendación del día",
      description: `${randomTip.title}: ${randomTip.description.substring(0, 100)}...`,
      duration: 5000,
    });
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
    },
    {
      id: "voice-4",
      title: "Ejercicio de Resonancia Nasal",
      description: "Canta 'Mmmmm' en una nota media, sintiendo la vibración en la nariz. Mantén 10 segundos, repite 5 veces.",
      why: "Mejora el tono brillante y la proyección."
    },
    {
      id: "voice-5",
      title: "Deslizamiento de Voz",
      description: "Desliza tu voz de la nota más grave a la más aguda que puedas (como un sirena), luego vuelve. 3 repeticiones.",
      why: "Flexibiliza las cuerdas vocales."
    },
    {
      id: "voice-6",
      title: "Pronunciación de Consonantes",
      description: "Canta una escala usando solo la sílaba 'La', enfocándote en pronunciar claramente la 'L'. 5 repeticiones.",
      why: "Claridad en la letra durante la alabanza."
    },
    {
      id: "voice-7",
      title: "Potencia con 'Ha'",
      description: "Golpea con fuerza el sonido 'Ha!' desde el diafragma, como si empujaras aire. 8 repeticiones.",
      why: "Desarrolla potencia para momentos intensos."
    },
    {
      id: "voice-8",
      title: "Relajación de Mandíbula",
      description: "Masajea suavemente los músculos de la mandíbula mientras tarareas. 2 minutos.",
      why: "Reduce tensión al cantar."
    },
    {
      id: "voice-9",
      title: "Improvisación Melódica",
      description: "Improvisa una melodía corta con la palabra 'Aleluya' en diferentes ritmos. 3 minutos.",
      why: "Estimula la creatividad vocal."
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
    },
    {
      id: "music-4",
      instrument: "guitarra",
      title: "Rasgueo en 6/8",
      description: "Practica el patrón: Abajo, Arriba, Abajo, Abajo, Arriba. A 70 BPM durante 5 minutos.",
      why: "Esencial para himnos tradicionales."
    },
    {
      id: "music-5",
      instrument: "batería",
      title: "Redobles con Baqueta Alterna",
      description: "Toca redobles en el tambor, alternando manos (R-L-R-L), empezando lento y aumentando velocidad. 3 series de 30 segundos.",
      why: "Mejora coordinación y velocidad."
    },
    {
      id: "music-6",
      instrument: "bajo",
      title: "Octavas en Escala de C",
      description: "Toca C2-C3, D2-D3, E2-E3, etc., manteniendo un groove constante. 4 repeticiones.",
      why: "Fortalece independencia de dedos."
    },
    {
      id: "music-7",
      instrument: "teclado",
      title: "Acordes con Inversiones",
      description: "Practica C (Do), G/B (Sol/Si), Am (La menor) en secuencia, usando inversiones. 5 minutos.",
      why: "Suaviza transiciones en alabanza."
    },
    {
      id: "music-8",
      instrument: "violín",
      title: "Vibrato Lento",
      description: "Sostén una nota media y aplica vibrato controlado, aumentando gradualmente. 3 notas x 1 minuto.",
      why: "Añade expresión a baladas."
    },
    {
      id: "music-9",
      instrument: "saxofón",
      title: "Control de Dinámicas",
      description: "Toca una escala de G (Sol) de pianissimo a fortissimo y viceversa. 4 repeticiones.",
      why: "Domina el volumen para momentos emotivos."
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
    },
    {
      id: "dance-4",
      style: "alabanza",
      title: "Ondas Corporales",
      description: "De pie, mueve pelvis, torso y brazos en ondas sucesivas, como olas. 3 minutos.",
      why: "Fluidez en adoración profética."
    },
    {
      id: "dance-5",
      style: "intercesión",
      title: "Marcha en Cruz",
      description: "Avanza 4 pasos formando una cruz imaginaria, levantando manos en el centro. 5 repeticiones.",
      why: "Símbolo de cobertura espiritual."
    },
    {
      id: "dance-6",
      style: "festiva",
      title: "Giros con Cintas",
      description: "Gira en círculos mientras agitas cintas arriba y abajo. 8 giros (4 por lado).",
      why: "Celebración visual jubilosa."
    },
    {
      id: "dance-7",
      style: "profética",
      title: "Movimientos en Espejo",
      description: "En parejas, imita los movimientos del otro al ritmo de tambores. 3 minutos.",
      why: "Conexión espiritual y sincronía."
    },
    {
      id: "dance-8",
      style: "bandera",
      title: "Figura de 8 con Bandera",
      description: "Traza un '8' infinito con la bandera a velocidad media. 10 repeticiones.",
      why: "Libera declaraciones en el espíritu."
    },
    {
      id: "dance-9",
      style: "danza hebrea",
      title: "Pasos de David",
      description: "Pasos laterales con saltos pequeños y palmas. 4 tiempos a la derecha, 4 a la izquierda.",
      why: "Raíces bíblicas en la alabanza."
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold arcana-gradient-text">Recomendaciones</h1>
            <p className="text-gray-600">Ejercicios y consejos para mejorar tu servicio</p>
          </div>
        </div>
        
        <Button 
          onClick={handleTestNotification}
          className="flex items-center gap-2 bg-arcana-gradient hover:opacity-90"
        >
          <Bell className="w-4 h-4" />
          Probar Notificación
        </Button>
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
