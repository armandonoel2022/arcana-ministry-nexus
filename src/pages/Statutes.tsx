import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  Calendar,
  Music,
  Heart,
  Shield,
  Clock,
  Church,
  UserCheck,
  FileSignature,
  Wallet,
  ClipboardList,
  Shirt,
  Sparkles,
} from "lucide-react";

const Statutes = () => {
  const articles = [
    {
      number: 1,
      icon: Church,
      title: "Requisitos de ingreso",
      text: "Cada integrante del grupo debe ser miembro de la iglesia en plena comunión, que tenga condiciones para el canto, oído musical y ritmo.",
    },
    {
      number: 2,
      icon: Heart,
      title: "Fidelidad como miembro",
      text: "Como miembros de la iglesia, cada uno debe cumplir fielmente con los diezmos y ofrendas como lo ordena el Señor, la asistencia a los servicios y apoyo a las actividades de la iglesia.",
    },
    {
      number: 3,
      icon: Users,
      title: "Reporte al líder de grupo",
      text: "Cada grupo tiene un líder de grupo, al cual tiene que reportarse ante él cada semana, ya sea concerniente a los servicios o para compartir.",
    },
    {
      number: 4,
      icon: Shield,
      title: "Ausencias y disciplina",
      text: "La persona que tenga 3 ausencias en el mes será disciplinada en relación a los ensayos y su estado activo como miembro.",
    },
    {
      number: 5,
      icon: Sparkles,
      title: "Vida espiritual y preparación",
      text: "Cada integrante del ministerio tiene la responsabilidad de mantener una vida espiritual en crecimiento y de buen testimonio. Deberá mantenerse buscando información de crecimiento personal en lo que se refiere al ministerio, con el objetivo de estar preparado para cuando le toque ministrar, predicar o dar congresos.",
    },
    {
      number: 6,
      icon: Calendar,
      title: "Prioridad ministerial",
      text: "Cada persona debe apoyar y dar prioridad a las actividades, ensayos y presentaciones. En dado caso de tener problemas con el horario, debe comunicarlo.",
    },
    {
      number: 7,
      icon: Shirt,
      title: "Vestimenta del adorador",
      text: "Debe tomarse en cuenta que la vestimenta en los ensayos y presentaciones debe ser con conocimiento de que somos adoradores y que es nuestro estilo de vida.",
    },
    {
      number: 8,
      icon: UserCheck,
      title: "Notificación de ausencias",
      text: "Cuando un integrante vaya a ausentarse, debe comunicárselo a su líder con anticipación con el objetivo de tener presente un sustituto.",
    },
    {
      number: 9,
      icon: Clock,
      title: "Puntualidad en el servicio",
      text: "Si un integrante llega tarde a un servicio, luego de haber este comenzado, no podrá subir al altar. Debe comunicarle con tiempo a su líder que llegará más tarde por algún motivo, con el objetivo de hacer los cambios preliminares.",
    },
    {
      number: 10,
      icon: Heart,
      title: "Oración previa al servicio",
      text: "Se debe tener siempre presente de 15 a 30 minutos antes de cada servicio para orar y buscar la presencia del Señor.",
    },
    {
      number: 11,
      icon: Clock,
      title: "Horario de ensayos",
      text: "Se debe tener siempre presente que la hora de los ensayos comienza a las 7:00 p.m.",
    },
    {
      number: 12,
      icon: Church,
      title: "Permanencia en la iglesia",
      text: "No se le permite a ningún integrante estar fuera de la iglesia en ningún servicio o actividad dentro de la iglesia, incluyendo los ensayos.",
    },
    {
      number: 13,
      icon: Shield,
      title: "Conducta durante ensayos y cultos",
      text: "Cada integrante no debe salir, comer o tener reuniones durante los ensayos y cultos.",
    },
    {
      number: 14,
      icon: Users,
      title: "Privilegios exclusivos de miembros",
      text: "Solo los miembros tendrán el privilegio de participar en cualquier actividad del ministerio, reuniones de asambleas, reuniones sociales y participar en los grupos oficiales de las redes sociales como Instagram, Facebook, WhatsApp, etc.",
    },
    {
      number: 15,
      icon: FileSignature,
      title: "Acuerdo de compromiso",
      text: "Todo miembro debe firmar un acuerdo de compromiso, fidelidad y confidencialidad, para pertenecer al Ministerio.",
    },
    {
      number: 16,
      icon: Music,
      title: "Dominio del repertorio",
      text: "Cada músico debe aprenderse el repertorio de canciones. En caso contrario no se le permitirá tocar.",
    },
    {
      number: 17,
      icon: Wallet,
      title: "Informe del tesorero",
      text: "El Tesorero debe rendir un informe trimestral de los ingresos y egresos del Ministerio.",
    },
    {
      number: 18,
      icon: Calendar,
      title: "Licencias prolongadas",
      text: "Los miembros que soliciten licencias por más de un año tendrán un periodo probatorio de seis (6) meses: asistir fielmente a los ensayos, actividades y aprenderse el nuevo repertorio de canciones.",
    },
    {
      number: 19,
      icon: UserCheck,
      title: "Periodo probatorio",
      text: "El tiempo probatorio será de seis (6) meses para los nuevos integrantes y/o aspirantes del ministerio (a discreción de los Pastores de Adoración).",
    },
    {
      number: 20,
      icon: FileSignature,
      title: "Solicitud de licencias",
      text: "Las solicitudes de licencias se harán con un mes de anticipación, por comunicación escrita, identificando el motivo, inicio y término de la misma.",
    },
    {
      number: 21,
      icon: Sparkles,
      title: "Retiro mensual",
      text: "El Ministerio debe realizar un retiro mensual.",
    },
    {
      number: 22,
      icon: Music,
      title: "Cuidado de los equipos",
      text: "Los miembros deben velar por la limpieza y cuidado de los equipos musicales y electrónicos.",
    },
    {
      number: 23,
      icon: Users,
      title: "Mentoría a nuevos integrantes",
      text: "A cada nuevo integrante se le asignará un miembro del coro para el seguimiento y aprendizaje de las canciones en su respectiva voz. Lo mismo se hará si el integrante es músico.",
    },
    {
      number: 24,
      icon: ClipboardList,
      title: "Registro de actividades",
      text: "Se debe llevar un registro manual o electrónico de todas las actividades.",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
            Estatutos del Ministerio
          </h1>
          <p className="text-muted-foreground">
            Normativas y Reglamentos · Ministerio ADN Arca de Noé
          </p>
          <Badge className="mt-3" variant="secondary">
            Versión 2026
          </Badge>
        </div>

        {/* Introducción */}
        <Card className="mb-6 border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Introducción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 leading-relaxed">
              Los presentes estatutos establecen las normas, responsabilidades y
              compromisos que rigen la vida del Ministerio ADN Arca de Noé.
              Buscan mantener el orden, cultivar la excelencia en el servicio y
              asegurar que cada integrante camine en integridad, unidad y
              adoración genuina al Señor.
            </p>
          </CardContent>
        </Card>

        {/* Artículos */}
        <div className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => {
            const Icon = article.icon;
            return (
              <Card
                key={article.number}
                className="border-border/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Artículo {article.number}
                      </p>
                      <CardTitle className="text-base text-foreground break-words">
                        {article.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {article.text}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Nota Final */}
        <Card className="mt-8 border-border/60 bg-muted/30">
          <CardContent className="pt-6 text-center">
            <p className="text-foreground/80 mb-2">
              <strong>Nota importante:</strong> Estos estatutos pueden ser
              modificados según las necesidades del ministerio y la dirección
              pastoral.
            </p>
            <p className="text-sm text-muted-foreground">
              Última actualización: 2026
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statutes;
