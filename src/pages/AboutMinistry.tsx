
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Music, Calendar } from "lucide-react";

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

        {/* Historia */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-arcana-blue-600 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Nuestra Historia
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              El Ministerio ADN (Arca de Noé) nació de un corazón apasionado por la adoración y el deseo 
              de servir a Dios a través de la música. Fundado en nuestra congregación con la visión de 
              crear un espacio donde cada voz pueda elevarse en alabanza sincera.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Desde nuestros inicios, hemos sido testigos de cómo Dios ha usado este ministerio para 
              tocar corazones, sanar heridas y acercar a las personas a Su presencia. Cada servicio 
              es una oportunidad para experimentar la gloria de Dios de manera tangible.
            </p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-arcana-blue-gradient rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-arcana-blue-600">15</div>
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

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-arcana-blue-gradient rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-arcana-blue-600">52</div>
              <div className="text-sm text-gray-600">Servicios Anuales</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-arcana-gold-gradient rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-arcana-gold-600">∞</div>
              <div className="text-sm text-gray-600">Vidas Tocadas</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AboutMinistry;
