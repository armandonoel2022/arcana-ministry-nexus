
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Music, Calendar, Crown, Star, Disc } from "lucide-react";

const AboutMinistry = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-arcana-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Acerca del Ministerio ADN</h1>
          <p className="text-gray-600">Arca de Noé - Ministerio de Alabanza y Adoración</p>
        </div>

        {/* Historia Expandida */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-arcana-blue-600 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Nuestra Historia
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none space-y-4">
            <div className="bg-gradient-to-r from-arcana-blue-50 to-arcana-gold-50 p-4 rounded-lg border-l-4 border-arcana-gold-600">
              <p className="text-gray-700 leading-relaxed mb-2">
                <strong className="text-arcana-blue-600">Octubre 1999</strong> - El Ministerio de Alabanza y Adoración de la Iglesia Arca de Noé es formalmente establecido, siendo nombrado <strong>Roosevelt Martínez</strong> como pastor y director de dicho ministerio, por iniciativa de nuestro pastor <strong>Freddy Martínez</strong>, quien siempre ha sido un apasionado de la adoración plena y de calidad a nuestro Dios y Señor.
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed">
              Inicialmente el grupo estaba formado por <strong>10 voces</strong> y <strong>2 músicos</strong> comprometidos con la excelencia en la adoración:
            </p>

            <div className="grid md:grid-cols-2 gap-4 my-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-arcana-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-arcana-blue-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Voces Fundadoras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-700 space-y-1">
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

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-arcana-gold-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-arcana-gold-600 flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Músicos Fundadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-arcana-gold-500 rounded-full"></span>
                      <strong>Amable Díaz (Jol)</strong> - Piano
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-arcana-gold-500 rounded-full"></span>
                      <strong>Alonzo Núñez</strong> - Batería
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <p className="text-gray-700 leading-relaxed">
              A través del tiempo hemos atravesado momentos de pruebas y dificultades, pero también hemos vivido momentos inolvidables en la presencia de nuestro Señor, llegando a ser hoy en día un ministerio del cual <strong>Cristo es el centro y motivo</strong> para la adoración.
            </p>

            <div className="bg-gradient-to-r from-arcana-gold-50 to-arcana-blue-50 p-4 rounded-lg border-l-4 border-arcana-blue-600">
              <p className="text-gray-700 leading-relaxed flex items-start gap-3">
                <Crown className="w-5 h-5 text-arcana-gold-600 mt-1 flex-shrink-0" />
                <span>
                  Hoy somos un ministerio que ha sido testigo de la fidelidad de Dios en el cumplimiento de sus promesas, siendo el <strong className="text-arcana-blue-600">primer grupo de alabanza organizado de las Asambleas de Dios en la República Dominicana</strong>.
                </span>
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed">
              Desde nuestros inicios, hemos sido testigos de cómo Dios ha usado este ministerio para tocar corazones, sanar heridas y acercar a las personas a Su presencia. Cada servicio es una oportunidad para experimentar la gloria de Dios de manera tangible, manteniendo siempre nuestro compromiso con la excelencia y la adoración sincera.
            </p>
          </CardContent>
        </Card>

        {/* Logro Histórico */}
        <Card className="mb-6 bg-gradient-to-r from-arcana-gold-100 to-arcana-blue-100 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-arcana-gold-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-arcana-blue-600 mb-2">Logro Histórico</h3>
              <p className="text-gray-700">
                <strong>Primer grupo de alabanza organizado</strong><br />
                de las Asambleas de Dios en República Dominicana
              </p>
              <Badge className="mt-2 bg-arcana-gold-gradient text-white">
                Desde 1999
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Logro Destacado */}
        <Card className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Disc className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-purple-600 mb-2">Logro Destacado</h3>
              <p className="text-gray-700 mb-2">
                <strong>Grabación de nuestra primera producción musical</strong>
              </p>
              <h4 className="text-xl font-bold text-pink-600 mb-2">Adoración Eterna</h4>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                2017 - 2018
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Visión y Misión */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-arcana-gold-600">
                Nuestra Visión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Ser un ministerio que inspire y guíe a la congregación hacia una adoración 
                auténtica y transformadora, creando un ambiente donde la presencia de Dios 
                sea evidente y cada persona pueda encontrar su lugar en la adoración corporativa.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-arcana-blue-600">
                Nuestra Misión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                Facilitar encuentros genuinos con Dios a través de la música, equipando y 
                desarrollando talentos para el servicio, mientras fomentamos la unidad y 
                el crecimiento espiritual en cada miembro del ministerio.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Valores */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-arcana-blue-600">
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
                <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-amber-50 rounded-lg">
                  <h4 className="font-semibold text-arcana-blue-600 mb-2">{valor.title}</h4>
                  <p className="text-sm text-gray-600">{valor.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-arcana-blue-gradient rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-arcana-blue-600">3</div>
              <div className="text-sm text-gray-600">Miembros Activos</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-arcana-gold-gradient rounded-full flex items-center justify-center mx-auto mb-2">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-arcana-gold-600">3</div>
              <div className="text-sm text-gray-600">Grupos de Alabanza</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AboutMinistry;
