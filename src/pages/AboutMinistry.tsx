import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Users, Music, Calendar, Crown, Star, Disc, TrafficCone, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SONG_REPETITION_RULES } from "@/hooks/useSongRepetitionCheck";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const AboutMinistry = () => {
  const [membersCount, setMembersCount] = useState<number>(0);
  const [groupsCount, setGroupsCount] = useState<number>(0);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch active members count
      const { count: members } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      // Fetch active worship groups count
      const { count: groups } = await supabase
        .from('worship_groups')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      setMembersCount(members || 0);
      setGroupsCount(groups || 0);
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero banner — deep navy like the ARCANA presentation */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'var(--gradient-primary)' }}
      >
        {/* Decorative diagonal accent */}
        <div className="absolute inset-y-0 right-0 w-1/2 opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 70% 50%, hsl(var(--primary-glow) / 0.6) 0%, transparent 60%)',
          }}
        />
        <div className="absolute top-0 left-0 w-64 h-64 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(0 0% 100% / 0.4) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-20">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/95 flex items-center justify-center shadow-2xl">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <span className="uppercase tracking-[0.25em] text-xs md:text-sm text-white/80 font-semibold">
              Inteligencia Ministerial
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.05] mb-4 drop-shadow-lg">
            Ministerio ADN
          </h1>
          <div className="h-1 w-16 bg-white/80 rounded-full mb-4" />
          <p className="text-white/90 text-lg md:text-xl max-w-2xl">
            Arca de Noé — Ministerio de Alabanza y Adoración.
            De la sobrecarga a la fluidez.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 -mt-8 relative z-10">


        {/* Sistema Semáforo - Reglas de Lógica */}
        <Collapsible open={showRules} onOpenChange={setShowRules} className="mb-6">
          <Card className="modern-card overflow-hidden">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 flex items-center justify-center">
                      <TrafficCone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-modern-blue-600 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {SONG_REPETITION_RULES.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Haz clic para ver las reglas del sistema
                      </CardDescription>
                    </div>
                  </div>
                  {showRules ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-0">
                {/* Descripción */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-foreground text-sm leading-relaxed">
                    {SONG_REPETITION_RULES.description}
                  </p>
                </div>

                {/* Reglas del semáforo */}
                <div>
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className="text-lg">🚦</span>
                    Significado de los colores
                  </h4>
                  <div className="space-y-3">
                    {SONG_REPETITION_RULES.rules.map((rule, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${
                          rule.color === 'green' 
                            ? 'bg-green-50 dark:bg-green-950/30 border-green-500' 
                            : rule.color === 'yellow'
                            ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-500'
                            : 'bg-red-50 dark:bg-red-950/30 border-red-500'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{rule.emoji}</span>
                          <div className="flex-1">
                            <h5 className={`font-semibold mb-1 ${
                              rule.color === 'green' 
                                ? 'text-green-800 dark:text-green-200' 
                                : rule.color === 'yellow'
                                ? 'text-yellow-800 dark:text-yellow-200'
                                : 'text-red-800 dark:text-red-200'
                            }`}>
                              {rule.title}
                            </h5>
                            <p className="text-sm text-muted-foreground mb-2">
                              <strong>Condición:</strong> {rule.condition}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Acción:</strong> {rule.action}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Criterios de evaluación */}
                <div>
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    Criterios de Evaluación
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    {SONG_REPETITION_RULES.criteria.map((criterion, index) => (
                      <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border">
                        <h5 className="font-semibold text-modern-blue-600 mb-2">
                          {criterion.title}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {criterion.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Historia Expandida */}
        <Card className="mb-6 modern-card">
          <CardHeader>
            <CardTitle className="text-xl text-modern-blue-600 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Nuestra Historia
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <div className="bg-modern-gradient-soft p-4 rounded-lg border-l-4 border-modern-blue-600">
              <p className="text-foreground leading-relaxed mb-2">
                <strong className="text-modern-blue-600">Octubre 1999</strong> - El Ministerio de Alabanza y Adoración de la Iglesia Arca de Noé es formalmente establecido, siendo nombrado <strong>Roosevelt Martínez</strong> como pastor y director de dicho ministerio, por iniciativa de nuestro pastor <strong>Freddy Martínez</strong>, quien siempre ha sido un apasionado de la adoración plena y de calidad a nuestro Dios y Señor.
              </p>
            </div>

            <p className="text-foreground leading-relaxed">
              Inicialmente el grupo estaba formado por <strong>10 voces</strong> y <strong>2 músicos</strong> comprometidos con la excelencia en la adoración:
            </p>

            <div className="grid md:grid-cols-2 gap-4 my-4">
              <Card className="service-card-light">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-modern-blue-800 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Voces Fundadoras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-modern-blue-700 space-y-1">
                    <li>• Ivelisse Alburquerque</li>
                    <li>• Massy Castillo</li>
                    <li>• Keyla Santana</li>
                    <li>• Rode Santana</li>
                    <li>• Edward Jáquez</li>
                    <li>• Abacuc Navarro</li>
                    <li>• Aleida Batista</li>
                    <li>• Fior Daliza Paniagua</li>
                    <li>• Keyla Medrano</li>
                    <li>• Jisell Mauricio</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="service-card-secondary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Músicos Fundadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-white space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      <strong>Amable Díaz (Jol)</strong> - Piano
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      <strong>Alonzo Núñez</strong> - Batería
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <p className="text-foreground leading-relaxed">
              A través del tiempo hemos atravesado momentos de pruebas y dificultades, pero también hemos vivido momentos inolvidables en la presencia de nuestro Señor, llegando a ser hoy en día un ministerio del cual <strong>Cristo es el centro y motivo</strong> para la adoración.
            </p>

            <div className="modern-glass p-4 rounded-lg border-l-4 border-modern-blue-600">
              <p className="text-foreground leading-relaxed flex items-start gap-3">
                <Crown className="w-5 h-5 text-modern-blue-600 mt-1 flex-shrink-0" />
                <span>
                  Hoy somos un ministerio que ha sido testigo de la fidelidad de Dios en el cumplimiento de sus promesas, siendo el <strong className="text-modern-blue-600">primer grupo de alabanza organizado de las Asambleas de Dios en la República Dominicana</strong>.
                </span>
              </p>
            </div>

            <p className="text-foreground leading-relaxed">
              Desde nuestros inicios, hemos sido testigos de cómo Dios ha usado este ministerio para tocar corazones, sanar heridas y acercar a las personas a Su presencia. Cada servicio es una oportunidad para experimentar la gloria de Dios de manera tangible, manteniendo siempre nuestro compromiso con la excelencia y la adoración sincera.
            </p>
          </CardContent>
        </Card>

        {/* Logro Histórico */}
        <Card className="mb-6 service-card-primary">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 modern-circle flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Logro Histórico</h3>
              <p className="text-white/90">
                <strong>Primer grupo de alabanza organizado</strong><br />
                de las Asambleas de Dios en República Dominicana
              </p>
              <Badge className="mt-2 bg-white/20 text-white border-white/20">
                Desde 1999
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Logro Destacado */}
        <Card className="mb-6 service-card-accent">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 modern-circle flex items-center justify-center mx-auto mb-3">
                <Disc className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Logro Destacado</h3>
              <p className="text-white/90 mb-2">
                <strong>Grabación de nuestra primera producción musical</strong>
              </p>
              <h4 className="text-xl font-bold text-white mb-2">Adoración Eterna</h4>
              <Badge className="bg-white/20 text-white border-white/20">
                2017 - 2018
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Visión y Misión */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="text-lg text-modern-blue-600">
                Nuestra Visión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                Ser un ministerio que inspire y guíe a la congregación hacia una adoración 
                auténtica y transformadora, creando un ambiente donde la presencia de Dios 
                sea evidente y cada persona pueda encontrar su lugar en la adoración corporativa.
              </p>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="text-lg text-modern-blue-600">
                Nuestra Misión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                Facilitar encuentros genuinos con Dios a través de la música, equipando y 
                desarrollando talentos para el servicio, mientras fomentamos la unidad y 
                el crecimiento espiritual en cada miembro del ministerio.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Valores */}
        <Card className="mb-6 modern-card">
          <CardHeader>
            <CardTitle className="text-xl text-modern-blue-600">
              Nuestros Valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Excelencia", desc: "Buscamos la excelencia en todo lo que hacemos para honrar a Dios" },
                { title: "Unidad", desc: "Trabajamos en equipo, valorando cada don y talento" },
                { title: "Servicio", desc: "Servimos con humildad y corazón dispuesto" },
                { title: "Adoración", desc: "Vivimos una vida de adoración dentro y fuera del templo" },
                { title: "Crecimiento", desc: "Nos comprometemos al desarrollo personal y ministerial" },
                { title: "Comunión", desc: "Fomentamos relaciones genuinas y de apoyo mutuo" }
              ].map((valor, index) => (
                <div key={index} className="p-4 modern-gradient-soft rounded-lg border border-modern-blue-200">
                  <h4 className="font-semibold text-modern-blue-600 mb-2">{valor.title}</h4>
                  <p className="text-sm text-muted-foreground">{valor.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <Card className="modern-card text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 modern-gradient rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-modern-blue-600">{membersCount}</div>
              <div className="text-sm text-muted-foreground">Miembros Activos</div>
            </CardContent>
          </Card>

          <Card className="modern-card text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 modern-gradient rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-modern-blue-600">{groupsCount}</div>
              <div className="text-sm text-muted-foreground">Grupos de Alabanza</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AboutMinistry;
