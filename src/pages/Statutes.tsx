
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Calendar, Music, Heart, Shield } from "lucide-react";

const Statutes = () => {
  const sections = [
    {
      title: "1. Propósito del Ministerio",
      icon: Heart,
      content: [
        "Liderar a la congregación en adoración y alabanza durante los servicios",
        "Crear un ambiente propicio para el encuentro con Dios",
        "Desarrollar y equipar talentos musicales para el servicio",
        "Fomentar la unidad y comunión entre los miembros"
      ]
    },
    {
      title: "2. Membresía y Requisitos",
      icon: Users,
      content: [
        "Ser miembro activo de la congregación",
        "Demostrar compromiso con los valores cristianos",
        "Participar regularmente en ensayos y servicios",
        "Mantener una actitud de servicio y humildad",
        "Completar el proceso de integración ministerial"
      ]
    },
    {
      title: "3. Responsabilidades",
      icon: Shield,
      content: [
        "Asistir puntualmente a ensayos y servicios programados",
        "Mantener un testimonio cristiano íntegro",
        "Colaborar en la preparación y organización de actividades",
        "Apoyar y edificar a otros miembros del ministerio",
        "Participar en capacitaciones y eventos especiales"
      ]
    },
    {
      title: "4. Estructura Organizacional",
      icon: BookOpen,
      content: [
        "Director General del Ministerio",
        "Coordinadores de grupos de alabanza",
        "Músicos instrumentistas",
        "Coro y vocalistas",
        "Equipo de apoyo técnico"
      ]
    },
    {
      title: "5. Programación y Servicios",
      icon: Calendar,
      content: [
        "Servicios dominicales regulares",
        "Ensayos semanales obligatorios",
        "Actividades especiales y festividades",
        "Rotación equitativa entre grupos",
        "Períodos de descanso programados"
      ]
    },
    {
      title: "6. Normas de Conducta",
      icon: Music,
      content: [
        "Vestimenta apropiada durante los servicios",
        "Actitud de reverencia y respeto",
        "Puntualidad en todos los compromisos",
        "Comunicación respetuosa entre miembros",
        "Confidencialidad en asuntos internos del ministerio"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-arcana-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Estatutos del Ministerio</h1>
          <p className="text-gray-600">Normativas y Reglamentos - Ministerio ADN Arca de Noé</p>
          <Badge className="mt-2 bg-arcana-gold-gradient text-white">
            Versión 2024
          </Badge>
        </div>

        {/* Introducción */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-arcana-blue-600">
              Introducción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              Los presentes estatutos establecen las normas, responsabilidades y estructura 
              organizacional del Ministerio ADN (Arca de Noé). Estos lineamientos buscan 
              mantener el orden, promover la excelencia en el servicio y asegurar que 
              nuestro ministerio cumpla efectivamente con su propósito de glorificar a Dios 
              a través de la alabanza y adoración.
            </p>
          </CardContent>
        </Card>

        {/* Secciones de Estatutos */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-arcana-blue-600 flex items-center gap-3">
                    <div className="w-10 h-10 bg-arcana-blue-gradient rounded-full flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-arcana-gold-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Nota Final */}
        <Card className="mt-8 bg-gradient-to-r from-arcana-blue-50 to-arcana-gold-50 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-700 mb-2">
                <strong>Nota Importante:</strong> Estos estatutos pueden ser modificados según las 
                necesidades del ministerio y la dirección pastoral.
              </p>
              <p className="text-sm text-gray-600">
                Última actualización: Enero 2024
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statutes;
