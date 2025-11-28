import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Users, Bot, Smile, Paperclip, ArrowLeft, MoreVertical } from "lucide-react";
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

export const ChatRoom = ({ room, onBack }: ChatRoomProps) => {
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

  const getBotDisplayName = () => "ARCANA";

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
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arcana-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
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

      {/* WhatsApp-like Header */}
      <div className="bg-arcana-blue-gradient px-4 py-3 flex items-center gap-3 border-b border-blue-600">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/20 p-2 h-auto">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}

        <Avatar className="w-10 h-10 border-2 border-white/30">
          <AvatarFallback className="bg-white/20 text-white">
            <Users className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h1 className="text-white font-semibold text-lg truncate">{room.name}</h1>
          <p className="text-white/80 text-sm truncate">{room.description || "Sala de chat ARCANA"}</p>
        </div>

        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2 h-auto">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-gray-100 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23e5e7eb%22%20fill-opacity%3D%220.3%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"
      >
        <div className="p-4 space-y-2 min-h-full">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 bg-arcana-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-8 h-8 text-arcana-blue-600" />
                </div>
                <p className="text-sm">No hay mensajes aún</p>
                <p className="text-xs text-gray-400 mt-1">¡Sé el primero en escribir!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.user_id === currentUser?.id;
              const isBotMessage = isBot(message);

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwnMessage && !isBotMessage ? "justify-end" : "justify-start"}`}
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
                      <AvatarFallback
                        className={`text-xs ${isBotMessage ? "bg-purple-500 text-white" : "bg-arcana-blue-500 text-white"}`}
                      >
                        {isBotMessage ? <Bot className="w-4 h-4" /> : getInitials(getUserDisplayName(message))}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`max-w-xs ${isOwnMessage && !isBotMessage ? "order-first" : ""}`}>
                    {(!isOwnMessage || isBotMessage) && (
                      <p className="text-xs text-gray-600 mb-1 ml-1">{getUserDisplayName(message)}</p>
                    )}

                    <div
                      className={`p-3 rounded-2xl ${
                        isBotMessage
                          ? "bg-purple-500 text-white"
                          : isOwnMessage
                            ? "bg-arcana-blue-500 text-white rounded-br-md"
                            : "bg-white text-gray-900 rounded-bl-md shadow-sm"
                      }`}
                    >
                      <div
                        className="text-sm whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: message.message
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(
                              /\[(.*?)\]\((.*?)\)/g,
                              '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>',
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
                              className={`${
                                isBotMessage
                                  ? "bg-white text-purple-600 hover:bg-gray-100"
                                  : "bg-arcana-gold-500 hover:bg-arcana-gold-600"
                              } font-medium shadow-md`}
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
                      <AvatarFallback className="text-xs bg-arcana-gold-500 text-white">
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
      </div>

      {/* Message Input - WhatsApp Style */}
      <div className="border-t bg-white p-3">
        {attachedMedia && (
          <div className="mb-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm truncate flex-1">📎 {attachedMedia.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAttachedMedia(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
        )}

        <div className="flex gap-2 items-center">
          {/* Toolbar para emoticones y archivos */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowEmoticons(!showEmoticons)}
              title="Emoticones"
              className="text-gray-500 hover:text-arcana-blue-600"
            >
              <Smile className="w-5 h-5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              title="Adjuntar archivo"
              className="text-gray-500 hover:text-arcana-blue-600"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />

            <EmoticonPicker
              visible={showEmoticons}
              onClose={() => setShowEmoticons(false)}
              onSelect={(emoticon) => {
                setNewMessage((prev) => prev + emoticon);
                setShowEmoticons(false);
              }}
            />

            <BuzzButton currentUserId={currentUser?.id || ""} />
          </div>

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="flex-1 border-0 bg-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full"
          />

          <VoiceNoteRecorder onVoiceNote={handleVoiceNote} roomId={room.id} userId={currentUser?.id || ""} />

          <Button
            onClick={() => sendMessage()}
            disabled={!newMessage.trim() && !attachedMedia}
            className="bg-arcana-blue-gradient hover:opacity-90 rounded-full w-10 h-10 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
