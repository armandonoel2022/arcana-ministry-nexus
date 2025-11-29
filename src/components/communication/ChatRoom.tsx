import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Users, Bot, Smile, Paperclip, AtSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ArcanaBot, BotAction } from "./ArcanaBot";
import { ArcanaAvatar } from "./ArcanaAvatar";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";
import { SongLimitOverlay } from "./SongLimitOverlay";
import { EmoticonPicker } from "./EmoticonPicker";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { BuzzButton } from "./BuzzButton";
import { useEmoticons } from "@/hooks/useEmoticons";
import { useSounds } from "@/hooks/useSounds";
import { useMediaUpload } from "@/hooks/useMediaUpload";

interface ChatRoomData {
  id: string;
  name: string;
  description?: string;
  room_type: string;
  department?: string;
  is_moderated: boolean;
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  user_id: string | null; // Allow null for bot messages
  is_bot?: boolean;
  actions?: BotAction[];
  media_url?: string;
  media_type?: "image" | "video" | "audio" | "voice";
  profiles?: {
    full_name: string;
    photo_url?: string;
  };
}

interface ChatRoomProps {
  room: ChatRoomData;
  onBack?: () => void;
}

export const ChatRoom = ({ room }: ChatRoomProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [arcanaActive, setArcanaActive] = useState(false);
  const [arcanaExpression, setArcanaExpression] = useState<"greeting" | "thinking" | "happy" | "worried" | "idle">(
    "idle",
  );
  const [showSongLimitOverlay, setShowSongLimitOverlay] = useState(false);
  const [songLimitData, setSongLimitData] = useState<{ count: number; serviceName: string } | null>(null);
  const [showEmoticons, setShowEmoticons] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { replaceEmoticons } = useEmoticons();
  const { preloadSounds, playNotification, playSound } = useSounds();
  const { uploadMedia, uploading, progress } = useMediaUpload();

  useEffect(() => {
    preloadSounds(); // Precargar sonidos al montar
    getCurrentUser();
    fetchMessages();
    setupRealtimeSubscription();

    return () => {
      // Cleanup subscription on unmount or room change
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [room.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Usuario auth:", user);

      if (user) {
        // Obtener el perfil
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error obteniendo perfil:", profileError);
        }

        let memberData = null;

        // Buscar en members por email
        if (user.email) {
          const { data: memberByEmail } = await supabase
            .from("members")
            .select("*")
            .eq("email", user.email)
            .eq("is_active", true)
            .single();
          memberData = memberByEmail;
        }

        // Si no se encontró por email, buscar por nombre aproximado
        if (!memberData && profile?.full_name) {
          const firstName = profile.full_name.split(" ")[0];
          const { data: membersByName } = await supabase
            .from("members")
            .select("*")
            .ilike("nombres", `%${firstName}%`)
            .eq("is_active", true)
            .limit(1);

          if (membersByName && membersByName.length > 0) {
            memberData = membersByName[0];
          }
        }

        console.log("Datos de member encontrados:", memberData);

        setCurrentUser({
          ...user,
          profile: profile,
          member: memberData,
        });
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Error en getCurrentUser:", error);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user); // Fallback básico
    }
  };

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const fetchMessages = async () => {
    try {
      console.log("Obteniendo mensajes para sala:", room.id);

      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            photo_url
          )
        `,
        )
        .eq("room_id", room.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error obteniendo mensajes:", error);
        throw error;
      }

      console.log("Mensajes obtenidos:", data?.length || 0);

      // Enriquecer mensajes con fotos de members si no tienen en profile
      const enrichedMessages = await Promise.all(
        (data || []).map(async (msg) => {
          if (msg.profiles && !msg.profiles.photo_url && msg.user_id) {
            // Intentar obtener foto desde members
            const firstName = msg.profiles.full_name?.split(" ")[0];
            if (firstName) {
              const { data: memberData } = await supabase
                .from("members")
                .select("photo_url")
                .ilike("nombres", `%${firstName}%`)
                .single();

              if (memberData?.photo_url) {
                return {
                  ...msg,
                  profiles: {
                    ...msg.profiles,
                    photo_url: memberData.photo_url,
                  },
                };
              }
            }
          }
          return msg;
        }),
      );

      setMessages(enrichedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Remove existing channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel
    const channel = supabase
      .channel(`chat-messages-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          console.log("Nuevo mensaje recibido via realtime:", payload);
          fetchMessages(); // Refetch to get user data
          setTimeout(scrollToBottom, 150);
        },
      )
      .subscribe();

    channelRef.current = channel;
  };

  const sendMessage = async (messageText?: string) => {
    const rawText = messageText || newMessage.trim();

    // Procesar emoticones
    const textToSend = replaceEmoticons(rawText);

    if (!textToSend && !attachedMedia) {
      console.log("No hay mensaje ni archivo para enviar");
      return;
    }

    // Si no hay usuario autenticado, usar un usuario por defecto
    let userId = currentUser?.id;
    if (!userId) {
      // Usar el primer perfil disponible como fallback
      const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
      if (profiles && profiles.length > 0) {
        userId = profiles[0].id;
        console.log("Usando usuario por defecto:", userId);
      } else {
        console.log("No hay usuarios disponibles");
        toast({
          title: "Error",
          description: "No se pudo identificar al usuario. Por favor, configura la autenticación.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Si hay multimedia adjunta
      if (attachedMedia) {
        const { error } = await supabase.from("chat_messages").insert({
          room_id: room.id,
          user_id: userId,
          message: textToSend || "📎 Archivo compartido",
          media_url: attachedMedia.url,
          media_type: attachedMedia.type,
          is_bot: false,
        });

        if (error) throw error;

        playSound("notification", 0.5);
        setAttachedMedia(null);
        setNewMessage("");
        fetchMessages();
        return;
      }

      console.log("Enviando mensaje:", textToSend);
      console.log("Usuario actual:", currentUser);

      // Reproducir sonido de envío
      playSound("alert", 0.3);

      // Agregar mensaje del usuario de forma optimista
      const tempUserMessage: Message = {
        id: `temp-user-${Date.now()}`,
        message: textToSend,
        created_at: new Date().toISOString(),
        user_id: userId,
        is_bot: false,
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      // Enviar el mensaje del usuario a la BD
      const { error } = await supabase.from("chat_messages").insert({
        room_id: room.id,
        user_id: userId,
        message: textToSend,
        is_bot: false,
      });

      if (error) {
        console.error("Error enviando mensaje:", error);
        throw error;
      }

      console.log("Mensaje enviado exitosamente");
      setNewMessage("");
      scrollToBottom();

      // Procesar mensaje para ver si ARCANA debe responder
      console.log("Procesando mensaje para ARCANA...");
      const botResponse = await ArcanaBot.processMessage(textToSend, room.id, userId);

      if (botResponse) {
        console.log("ARCANA generó respuesta:", botResponse.type);

        // Activar avatar con la expresión correspondiente
        setArcanaActive(true);
        setArcanaExpression(botResponse.expression || "thinking");

        // Reproducir sonido para respuesta de ARCANA
        playNotification("msn");

        // Esperar un momento antes de que el bot responda para que parezca más natural
        setTimeout(async () => {
          console.log("Enviando respuesta de ARCANA...");
          try {
            // Guardar en BD primero
            await ArcanaBot.sendBotResponse(room.id, botResponse);
            console.log("Respuesta de ARCANA enviada exitosamente");

            // Hacer refetch de mensajes para asegurar que se vean las acciones
            fetchMessages();

            // Mantener la expresión por un momento más
            setTimeout(() => {
              setArcanaActive(false);
              setArcanaExpression("idle");
            }, 2000);
          } catch (botError) {
            console.error("Error enviando respuesta del bot:", botError);
            setArcanaActive(false);
            setArcanaExpression("idle");
          }
        }, 2000);
      } else {
        console.log("ARCANA no generó respuesta para este mensaje");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isBot = (message: Message) => {
    return message.is_bot === true || message.user_id === null;
  };

  const getBotDisplayName = () => "ARCANA Asistente";

  const getUserDisplayName = (message: Message) => {
    if (isBot(message)) {
      return getBotDisplayName();
    }
    return message.profiles?.full_name || "Usuario";
  };

  const handleVoiceNote = async (audioUrl: string) => {
    console.log("Audio URL recibido:", audioUrl);

    // Enviar mensaje con el audio
    try {
      let userId = currentUser?.id;
      if (!userId) {
        const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
        if (profiles && profiles.length > 0) {
          userId = profiles[0].id;
        } else {
          toast({
            title: "Error",
            description: "No se pudo identificar al usuario",
            variant: "destructive",
          });
          return;
        }
      }

      const { error } = await supabase.from("chat_messages").insert({
        room_id: room.id,
        user_id: userId,
        message: "🎤 Mensaje de voz",
        media_url: audioUrl,
        media_type: "voice",
        is_bot: false,
      });

      if (error) throw error;

      playSound("notification", 0.5);
      fetchMessages();
    } catch (error) {
      console.error("Error enviando audio:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el audio",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/quicktime",
    ];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Solo se permiten imágenes (JPG, PNG, WEBP, GIF) y videos (MP4, MOV)",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no puede ser mayor a 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      let userId = currentUser?.id;
      if (!userId) {
        const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
        if (profiles && profiles.length > 0) {
          userId = profiles[0].id;
        } else {
          toast({
            title: "Error",
            description: "No se pudo identificar al usuario",
            variant: "destructive",
          });
          return;
        }
      }

      const mediaFile = await uploadMedia(file, room.id, userId);
      if (mediaFile) {
        setAttachedMedia(mediaFile);
        toast({
          title: "✅ Archivo listo",
          description: "Presiona enviar para compartir el archivo",
        });
      }
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      toast({
        title: "Error",
        description: "No se pudo subir el archivo. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      // Limpiar el input
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleActionClick = async (action: BotAction) => {
    if (action.type === "select_song") {
      try {
        console.log("Acción recibida:", action);

        // Usar el serviceId que viene en la acción
        const serviceId = action.serviceId;
        const serviceDate = action.serviceDate;

        if (!serviceId) {
          console.error("No serviceId en la acción");
          toast({
            title: "Error",
            description: "No tienes servicios asignados como director",
            variant: "destructive",
          });
          return;
        }

        console.log("Intentando agregar canción:", {
          serviceId,
          songId: action.songId,
          songName: action.songName,
        });

        // Verificar si la canción ya existe en el servicio
        const { data: existing, error: checkError } = await supabase
          .from("service_songs")
          .select("id")
          .eq("service_id", serviceId)
          .eq("song_id", action.songId)
          .maybeSingle();

        if (checkError) {
          console.error("Error verificando canción existente:", checkError);
          throw checkError;
        }

        if (existing) {
          toast({
            title: "⚠️ Canción ya agregada",
            description: `"${action.songName}" ya está en este servicio`,
            variant: "default",
          });
          return;
        }

        // Obtener datos del usuario actual para la notificación
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user?.id).single();

        // Obtener datos de la canción
        const { data: songData } = await supabase
          .from("songs")
          .select("title, artist, key_signature, difficulty_level")
          .eq("id", action.songId)
          .single();

        // Insertar en la tabla service_songs
        console.log("Insertando en service_songs...");
        const { error } = await supabase.from("service_songs").insert({
          service_id: serviceId,
          song_id: action.songId,
        });

        if (error) {
          console.error("Error insertando en service_songs:", error);
          console.error("Detalles del error:", error.message, error.details, error.hint);
          throw error;
        }

        console.log("Canción insertada exitosamente");

        // Asegurar que exista también el registro en song_selections (usado por la vista service_selected_songs)
        console.log("Sincronizando con song_selections...");
        const { data: existingSelection, error: selCheckError } = await supabase
          .from("song_selections")
          .select("id")
          .eq("service_id", serviceId)
          .eq("song_id", action.songId)
          .maybeSingle();

        if (selCheckError) {
          console.error("Error verificando selección existente:", selCheckError);
        }

        if (!existingSelection) {
          const { error: selInsertError } = await supabase.from("song_selections").insert({
            service_id: serviceId,
            song_id: action.songId,
            selected_by: user?.id,
            selection_reason: (action as any).reason || "Seleccionada por ARCANA",
          });
          if (selInsertError) {
            console.error("Error insertando en song_selections:", selInsertError);
          }
        }

        // Obtener todos los miembros activos para enviarles notificación
        const { data: allMembers } = await supabase.from("profiles").select("id").eq("is_active", true);

        // Obtener datos completos del servicio
        const { data: fullServiceData } = await supabase.from("services").select("*").eq("id", serviceId).single();

        // Crear notificaciones para todos los miembros
        if (allMembers && allMembers.length > 0) {
          const notifications = allMembers.map((member) => ({
            recipient_id: member.id,
            type: "song_selection",
            title: "🎵 Nueva Canción Seleccionada",
            message: `${profile?.full_name || "Un director"} ha seleccionado "${songData?.title}" para el servicio "${fullServiceData?.title}" del ${new Date(serviceDate!).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}`,
            notification_category: "repertory",
            metadata: {
              service_id: serviceId,
              service_title: fullServiceData?.title,
              service_date: serviceDate,
              service_leader: fullServiceData?.leader,
              song_id: action.songId,
              song_title: songData?.title,
              selected_by: profile?.full_name,
            },
          }));

          await supabase.from("system_notifications").insert(notifications);
        }

        // Contar cuántas canciones tiene ahora el servicio
        const { data: songCount, error: countError } = await supabase
          .from("service_songs")
          .select("id", { count: "exact" })
          .eq("service_id", serviceId);

        const totalSongs = songCount?.length || 0;
        console.log("Total de canciones en el servicio:", totalSongs);

        // Obtener nombre del servicio para el overlay
        const { data: serviceData } = await supabase.from("services").select("title").eq("id", serviceId).single();

        toast({
          title: "✅ Canción agregada",
          description: `"${action.songName}" agregada al servicio del ${new Date(serviceDate!).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}`,
        });

        // Mostrar overlay si se alcanzaron 4, 5 o 6 canciones
        if (totalSongs >= 4 && totalSongs <= 6) {
          setSongLimitData({
            count: totalSongs,
            serviceName: serviceData?.title || "Sin nombre",
          });
          setShowSongLimitOverlay(true);
        }

        // Send confirmation message from bot
        await supabase.from("chat_messages").insert({
          room_id: room.id,
          user_id: null,
          message: `✅ Perfecto! Agregué "${action.songName}" al servicio del ${new Date(serviceDate!).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}`,
          is_bot: true,
        });
      } catch (error) {
        console.error("Error completo agregando canción:", error);
        toast({
          title: "Error",
          description: `No se pudo agregar la canción: ${error.message || "Error desconocido"}`,
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando mensajes...</div>;
  }

  return (
    <div className="space-y-4 relative">
      {/* Song Limit Overlay */}
      {showSongLimitOverlay && songLimitData && (
        <SongLimitOverlay
          songCount={songLimitData.count}
          serviceName={songLimitData.serviceName}
          onClose={() => {
            setShowSongLimitOverlay(false);
            setSongLimitData(null);
          }}
        />
      )}

      {/* Avatar animado de ARCANA */}
      <ArcanaAvatar isActive={arcanaActive} expression={arcanaExpression} position="bottom-right" />
      {/* Room Header */}
      <Card className="bg-gradient-to-r from-arcana-blue-50 to-arcana-gold-50">
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-arcana-blue-gradient rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-xl truncate">{room.name}</CardTitle>
              {room.description && <p className="text-xs sm:text-sm text-gray-600 truncate">{room.description}</p>}
              <p className="text-[10px] sm:text-xs text-arcana-blue-600 mt-1">
                💡 Escribe "ARCANA" o "@ARCANA" seguido de tu consulta sobre turnos, ensayos y canciones
              </p>
              {currentUser?.member && (
                <p className="text-[10px] sm:text-xs text-arcana-gold-600 mt-1">
                  👋 Hola {currentUser.member.nombres} - {currentUser.member.cargo}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <Card className="h-[60vh] sm:h-[70vh]">
        <CardContent className="p-0 h-full flex flex-col">
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No hay mensajes aún. ¡Sé el primero en escribir!</div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.user_id === currentUser?.id;
                const isBotMessage = isBot(message);

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage && !isBotMessage ? "justify-end" : "justify-start"}`}
                  >
                    {(!isOwnMessage || isBotMessage) && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        {!isBotMessage && message.profiles?.photo_url && (
                          <AvatarImage
                            src={message.profiles.photo_url}
                            alt={getUserDisplayName(message)}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className={`text-xs ${isBotMessage ? "bg-purple-100" : "bg-arcana-blue-100"}`}>
                          {isBotMessage ? (
                            <Bot className="w-4 h-4 text-purple-600" />
                          ) : (
                            getInitials(getUserDisplayName(message))
                          )}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-xs ${isOwnMessage && !isBotMessage ? "order-first" : ""}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          isBotMessage
                            ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300"
                            : isOwnMessage
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {(!isOwnMessage || isBotMessage) && (
                          <p className="text-xs font-medium mb-1 text-left">{getUserDisplayName(message)}</p>
                        )}
                        <div
                          className="text-sm whitespace-pre-wrap text-left"
                          dangerouslySetInnerHTML={{
                            __html: message.message
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(
                                /\[(.*?)\]\((.*?)\)/g,
                                '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-purple-900 hover:text-purple-700">$1</a>',
                              ),
                          }}
                        />

                        {/* Multimedia */}
                        {message.media_url && (
                          <div className="mt-2">
                            {message.media_type === "image" && (
                              <img
                                src={message.media_url}
                                alt="Imagen"
                                className="max-w-full rounded-lg max-h-64 object-contain"
                                loading="lazy"
                              />
                            )}
                            {message.media_type === "video" && (
                              <video controls className="max-w-full rounded-lg max-h-64">
                                <source src={message.media_url} type="video/mp4" />
                              </video>
                            )}
                            {(message.media_type === "audio" || message.media_type === "voice") && (
                              <VoiceMessagePlayer audioUrl={message.media_url} />
                            )}
                          </div>
                        )}

                        {/* Render action buttons if available */}
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 flex flex-col gap-2">
                            {message.actions.map((action, idx) => (
                              <Button
                                key={idx}
                                onClick={() => handleActionClick(action)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
                              >
                                ➕ Agregar "{action.songName}"
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      <p
                        className={`text-xs text-gray-500 mt-1 ${isOwnMessage && !isBotMessage ? "text-right" : "text-left"}`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                    {isOwnMessage && !isBotMessage && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        {(currentUser?.profile?.photo_url || currentUser?.member?.photo_url) && (
                          <AvatarImage
                            src={currentUser?.profile?.photo_url || currentUser?.member?.photo_url}
                            alt="Tu foto"
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="text-xs bg-arcana-gold-100">
                          {currentUser?.profile?.full_name ? getInitials(currentUser.profile.full_name) : "Tú"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t p-4 sticky bottom-0 bg-white/95 backdrop-blur">
            {/* Toolbar para emoticones y archivos */}
            <div className="flex gap-2 mb-2 relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEmoticons(!showEmoticons)}
                title="Emoticones"
              >
                <Smile className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                title="Adjuntar archivo"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewMessage((prev) => prev + " @");
                  document.querySelector("input")?.focus();
                }}
                title="Mencionar usuario"
              >
                <AtSign className="w-4 h-4" />
              </Button>

              <BuzzButton currentUserId={currentUser?.id || ""} />

              <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              <EmoticonPicker
                visible={showEmoticons}
                onClose={() => setShowEmoticons(false)}
                onSelect={(emoticon) => {
                  setNewMessage((prev) => prev + emoticon);
                  setShowEmoticons(false);
                }}
              />

              {uploading && (
                <div className="absolute left-0 bottom-full mb-2 bg-white p-2 rounded-lg shadow-md">
                  <div className="text-xs text-muted-foreground">Subiendo... {progress.toFixed(0)}%</div>
                  <div className="w-32 h-1 bg-secondary rounded-full mt-1">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {attachedMedia && (
              <div className="mb-2 p-2 bg-secondary rounded-lg flex items-center justify-between">
                <span className="text-sm truncate flex-1">📎 {attachedMedia.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAttachedMedia(null)}>
                  ✕
                </Button>
              </div>
            )}

            <div className="flex gap-2 items-end">
              <VoiceNoteRecorder onVoiceNote={handleVoiceNote} roomId={room.id} userId={currentUser?.id || ""} />
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setTimeout(scrollToBottom, 50)}
                placeholder="Escribe... (usa :) para emoticones, @ para mencionar)"
                className="flex-1"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!newMessage.trim() && !attachedMedia}
                className="bg-arcana-blue-gradient hover:opacity-90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
