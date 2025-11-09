import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Phone, Mail, MapPin, Calendar, Heart, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  photo_url?: string;
  cargo: string;
  fecha_nacimiento?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  direccion?: string;
  referencias?: string;
  grupo?: string;
  persona_reporte?: string;
  voz_instrumento?: string;
  tipo_sangre?: string;
  contacto_emergencia?: string;
  is_active: boolean;
  created_at: string;
}

const MemberProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchMember();
    }
  }, [id]);

  const fetchMember = async () => {
    try {
      const { data, error } = await supabase.from("members").select("*").eq("id", id).eq("is_active", true).single();

      if (error) throw error;
      setMember(data);
    } catch (error) {
      console.error("Error fetching member:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del integrante",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      pastor: "Pastor",
      pastora: "Pastora",
      director_alabanza: "Director de Alabanza",
      directora_alabanza: "Directora de Alabanza",
      corista: "Corista",
      directora_danza: "Directora de Danza",
      danzarina: "Danzarina",
      director_multimedia: "Director Multimedia",
      camarografo: "Camarógrafo",
      camarógrafa: "Camarógrafa",
      encargado_piso: "Encargado de Piso",
      encargada_piso: "Encargada de Piso",
      musico: "Músico",
      sonidista: "Sonidista",
      encargado_luces: "Encargado de Luces",
      encargado_proyeccion: "Encargado de Proyección",
      encargado_streaming: "Encargado de Streaming",
    };
    return roleLabels[role] || role;
  };

  const getGroupLabel = (group: string) => {
    const groupLabels: { [key: string]: string } = {
      directiva: "Directiva",
      directores_alabanza: "Directores de Alabanza",
      coristas: "Coristas",
      multimedia: "Multimedia",
      danza: "Danza",
      teatro: "Teatro",
      piso: "Piso",
    };
    return groupLabels[group] || group;
  };

  const formatBirthDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    if (!y || !m || !d) return dateStr;
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arcana-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Integrante no encontrado</p>
          <Button onClick={() => navigate("/integrantes")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Integrantes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="print:hidden bg-white border-b border-gray-200 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/integrantes")} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a Integrantes
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Imprimir Perfil
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6 print:p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="print:shadow-none print:border-none">
            <CardContent className="p-8 print:p-4">
              {/* Header with Logo and Member Info */}
              <div className="flex items-start justify-between mb-6 print:mb-4">
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24 border-4 border-arcana-blue-200">
                    <AvatarImage src={member.photo_url || undefined} alt={`${member.nombres} ${member.apellidos}`} />
                    <AvatarFallback className="bg-arcana-blue-gradient text-white text-2xl">
                      {member.nombres.charAt(0)}
                      {member.apellidos.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-4xl print:text-2xl font-bold text-arcana-blue-600 mb-2 print:mb-1">
                      {member.nombres} {member.apellidos}
                    </h1>
                    <p className="text-2xl print:text-lg text-gray-700 mb-3 print:mb-2">{getRoleLabel(member.cargo)}</p>
                    {member.grupo && (
                      <Badge variant="outline" className="text-sm">
                        {getGroupLabel(member.grupo)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* ADN Logo */}
                <div className="text-right">
                  <img
                    src="/lovable-uploads/74634c97-a2ef-403b-9fa0-89d9207b7b00.png"
                    alt="ADN Ministerio Logo"
                    className="w-24 h-auto mb-2"
                  />
                  <p className="text-sm text-gray-600">Ministerio ADN</p>
                  <p className="text-xs text-gray-500">Arca de Noé</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4 mb-8 print:mb-4">
                <div>
                  {member.fecha_nacimiento && (
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="font-medium">Fecha de nacimiento: </span>
                        <span>{formatBirthDate(member.fecha_nacimiento)}</span>
                      </div>
                    </div>
                  )}

                  {(member.celular || member.telefono) && (
                    <div className="flex items-center gap-3 mb-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="font-medium">Contacto: </span>
                        <span>
                          {member.celular && member.telefono
                            ? `${member.celular} / ${member.telefono}`
                            : member.celular || member.telefono}
                        </span>
                      </div>
                    </div>
                  )}

                  {member.email && (
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="font-medium">Correo electrónico: </span>
                        <span className="text-blue-600">{member.email}</span>
                      </div>
                    </div>
                  )}

                  {member.direccion && (
                    <div className="flex items-start gap-3 mb-3">
                      <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Dirección: </span>
                        <span>{member.direccion}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {member.voz_instrumento && (
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="font-medium">Instrumento/Voz: </span>
                        <span>{member.voz_instrumento}</span>
                      </div>
                    </div>
                  )}

                  {member.tipo_sangre && (
                    <div className="flex items-center gap-3 mb-3">
                      <Heart className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="font-medium">Tipo de sangre: </span>
                        <span>{member.tipo_sangre}</span>
                      </div>
                    </div>
                  )}

                  {member.persona_reporte && (
                    <div className="flex items-center gap-3 mb-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <span className="font-medium">Persona a quien se reporta: </span>
                        <span>{member.persona_reporte}</span>
                      </div>
                    </div>
                  )}

                  {member.contacto_emergencia && (
                    <div className="flex items-center gap-3 mb-3">
                      <Phone className="w-5 h-5 text-red-500" />
                      <div>
                        <span className="font-medium">Contacto de emergencia: </span>
                        <span>{member.contacto_emergencia}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* References Section */}
              {member.referencias && (
                <div className="border-t pt-6">
                  <h2 className="text-2xl font-bold text-arcana-blue-600 mb-4">Referencias</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{member.referencias}</p>
                  </div>
                </div>
              )}

              {/* Additional Information Table - Only show on screen, not print */}
              {(member.grupo ||
                member.persona_reporte ||
                member.voz_instrumento ||
                member.tipo_sangre ||
                member.contacto_emergencia) && (
                <div className="mt-8 border-t pt-6 print:hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
                      {/* Headers */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                        <div className="bg-blue-600 text-white p-3 text-center font-bold text-xs md:text-sm">
                          GRUPO AL QUE PERTENECE
                        </div>
                        <div className="bg-blue-600 text-white p-3 text-center font-bold text-xs md:text-sm">
                          PERSONA A QUIEN SE REPORTA
                        </div>
                        <div className="bg-blue-600 text-white p-3 text-center font-bold text-xs md:text-sm">
                          VOZ / INSTRUMENTO
                        </div>
                        <div className="bg-blue-600 text-white p-3 text-center font-bold text-xs md:text-sm">
                          TIPO DE SANGRE
                        </div>
                        <div className="bg-blue-600 text-white p-3 text-center font-bold text-xs md:text-sm">
                          CONTACTO DE EMERGENCIA
                        </div>
                      </div>

                      {/* Content */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                        <div className="p-3 text-center border-r border-gray-300 bg-white text-sm break-words">
                          {member.grupo ? getGroupLabel(member.grupo) : "-"}
                        </div>
                        <div className="p-3 text-center border-r border-gray-300 bg-white text-sm break-words">
                          {member.persona_reporte || "-"}
                        </div>
                        <div className="p-3 text-center border-r border-gray-300 bg-white text-sm break-words">
                          {member.voz_instrumento || "-"}
                        </div>
                        <div className="p-3 text-center border-r border-gray-300 bg-white text-sm break-words">
                          {member.tipo_sangre || "-"}
                        </div>
                        <div className="p-3 text-center bg-white text-sm break-words">
                          {member.contacto_emergencia || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
