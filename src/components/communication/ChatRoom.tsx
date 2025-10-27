
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Users, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ArcanaBot, BotAction } from "./ArcanaBot";
import { ArcanaAvatar } from "./ArcanaAvatar";
import { VoiceRecognition } from "./VoiceRecognition";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";

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
  profiles?: {
    full_name: string;
  };
}

interface ChatRoomProps {
  room: ChatRoomData;
}

export const ChatRoom = ({ room }: ChatRoomProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [arcanaActive, setArcanaActive] = useState(false);
  const [arcanaExpression, setArcanaExpression] = useState<'greeting' | 'thinking' | 'happy' | 'worried' | 'idle'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
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
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    console.log('Usuario actual:', user?.id, user?.email);
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
      console.log('Obteniendo mensajes para sala:', room.id);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .eq('room_id', room.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error obteniendo mensajes:', error);
        throw error;
      }
      
      console.log('Mensajes obtenidos:', data?.length || 0);
      console.log('Datos de mensajes:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive"
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
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room.id}`
        },
        (payload) => {
          console.log('Nuevo mensaje recibido via realtime:', payload);
          fetchMessages(); // Refetch to get user data
          setTimeout(scrollToBottom, 150);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || newMessage.trim();
    
    if (!textToSend) {
      console.log('No se puede enviar mensaje vacío');
      return;
    }

    // Si no hay usuario autenticado, usar un usuario por defecto
    let userId = currentUser?.id;
    if (!userId) {
      // Usar el primer perfil disponible como fallback
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
      if (profiles && profiles.length > 0) {
        userId = profiles[0].id;
        console.log('Usando usuario por defecto:', userId);
      } else {
        console.log('No hay usuarios disponibles');
        toast({
          title: "Error",
          description: "No se pudo identificar al usuario. Por favor, configura la autenticación.",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      console.log('Enviando mensaje:', textToSend);
      
      // Agregar mensaje del usuario de forma optimista
      const tempUserMessage: Message = {
        id: `temp-user-${Date.now()}`,
        message: textToSend,
        created_at: new Date().toISOString(),
        user_id: userId,
        is_bot: false,
      };
      setMessages(prev => [...prev, tempUserMessage]);
      
      // Enviar el mensaje del usuario a la BD
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: room.id,
          user_id: userId,
          message: textToSend,
          is_bot: false
        });

      if (error) {
        console.error('Error enviando mensaje:', error);
        throw error;
      }

      console.log('Mensaje enviado exitosamente');
      setNewMessage("");
      scrollToBottom();

      // Procesar mensaje para ver si ARCANA debe responder
      console.log('Procesando mensaje para ARCANA...');
      const botResponse = await ArcanaBot.processMessage(
        textToSend,
        room.id,
        userId
      );

      if (botResponse) {
        console.log('ARCANA generó respuesta:', botResponse.type);
        
        // Activar avatar con la expresión correspondiente
        setArcanaActive(true);
        setArcanaExpression(botResponse.expression || 'thinking');
        
        // Esperar un momento antes de que el bot responda para que parezca más natural
        setTimeout(async () => {
          console.log('Enviando respuesta de ARCANA...');
          try {
            // Agregar mensaje del bot localmente de inmediato para que se vea sin depender de realtime
            const botMessage: Message = {
              id: `temp-${Date.now()}`,
              message: botResponse.message,
              created_at: new Date().toISOString(),
              user_id: null,
              is_bot: true,
              actions: botResponse.actions || []
            };
            setMessages(prev => [...prev, botMessage]);
            
            // Luego guardar en BD (esto también llegará por realtime pero ignoraremos duplicados)
            await ArcanaBot.sendBotResponse(room.id, botResponse);
            console.log('Respuesta de ARCANA enviada exitosamente');
            
            // Mantener la expresión por un momento más
            setTimeout(() => {
              setArcanaActive(false);
              setArcanaExpression('idle');
            }, 2000);
          } catch (botError) {
            console.error('Error enviando respuesta del bot:', botError);
            setArcanaActive(false);
            setArcanaExpression('idle');
          }
        }, 2000);
      } else {
        console.log('ARCANA no generó respuesta para este mensaje');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isBot = (message: Message) => {
    return message.is_bot === true || message.user_id === null;
  };

  const getBotDisplayName = () => 'ARCANA Asistente';

  const getUserDisplayName = (message: Message) => {
    if (isBot(message)) {
      return getBotDisplayName();
    }
    return message.profiles?.full_name || 'Usuario';
  };

  const handleVoiceCommand = (command: string) => {
    console.log('Comando de voz recibido:', command);
    sendMessage(`ARCANA ${command}`);
  };

  const handleVoiceNote = (transcript: string) => {
    console.log('Nota de voz transcrita:', transcript);
    sendMessage(transcript);
  };

  const handleActionClick = async (action: BotAction) => {
    if (action.type === 'select_song') {
      try {
        // Usar el serviceId que viene en la acción
        const serviceId = action.serviceId;
        const serviceDate = action.serviceDate;

        if (!serviceId) {
          toast({
            title: "Error",
            description: "No tienes servicios asignados como director",
            variant: "destructive"
          });
          return;
        }

        // Verificar si la canción ya existe en el servicio
        const { data: existing } = await supabase
          .from('service_songs')
          .select('id')
          .eq('service_id', serviceId)
          .eq('song_id', action.songId)
          .maybeSingle();

        if (existing) {
          toast({
            title: "⚠️ Canción ya agregada",
            description: `"${action.songName}" ya está en este servicio`,
            variant: "default"
          });
          return;
        }

        // Insertar en la tabla service_songs
        const { error } = await supabase
          .from('service_songs')
          .insert({
            service_id: serviceId,
            song_id: action.songId
          });

        if (error) {
          console.error('Error agregando canción:', error);
          throw error;
        }

        toast({
          title: "✅ Canción agregada",
          description: `"${action.songName}" agregada al servicio del ${new Date(serviceDate!).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`,
        });

        // Send confirmation message from bot
        await supabase.from('chat_messages').insert({
          room_id: room.id,
          user_id: null,
          message: `✅ Perfecto! Agregué "${action.songName}" al servicio del ${new Date(serviceDate!).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`,
          is_bot: true
        });

      } catch (error) {
        console.error('Error agregando canción:', error);
        toast({
          title: "Error",
          description: "No se pudo agregar la canción al servicio",
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando mensajes...</div>;
  }

  return (
    <div className="space-y-4 relative">
      {/* Avatar animado de ARCANA */}
      <ArcanaAvatar 
        isActive={arcanaActive}
        expression={arcanaExpression}
        position="bottom-right"
      />
      {/* Room Header */}
      <Card className="bg-gradient-to-r from-arcana-blue-50 to-arcana-gold-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-arcana-blue-gradient rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{room.name}</CardTitle>
              {room.description && (
                <p className="text-sm text-gray-600">{room.description}</p>
              )}
              <p className="text-xs text-arcana-blue-600 mt-1">
                💡 Escribe "ARCANA" o "@ARCANA" seguido de tu consulta sobre turnos, ensayos y canciones
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <Card className="h-[70vh]">
        <CardContent className="p-0 h-full flex flex-col">
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No hay mensajes aún. ¡Sé el primero en escribir!
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.user_id === currentUser?.id;
                const isBotMessage = isBot(message);
                
                console.log('Renderizando mensaje:', {
                  id: message.id,
                  isBot: isBotMessage,
                  user_id: message.user_id,
                  is_bot: message.is_bot,
                  message: message.message.substring(0, 50)
                });
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage && !isBotMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    {(!isOwnMessage || isBotMessage) && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={`text-xs ${isBotMessage ? 'bg-purple-100' : 'bg-arcana-blue-100'}`}>
                          {isBotMessage ? (
                            <Bot className="w-4 h-4 text-purple-600" />
                          ) : (
                            getInitials(getUserDisplayName(message))
                          )}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-xs ${isOwnMessage && !isBotMessage ? 'order-first' : ''}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          isBotMessage
                            ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300'
                            : isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {(!isOwnMessage || isBotMessage) && (
                          <p className="text-xs font-medium mb-1 text-left">
                            {getUserDisplayName(message)}
                          </p>
                        )}
                        <div 
                          className="text-sm whitespace-pre-wrap text-left"
                          dangerouslySetInnerHTML={{
                            __html: message.message
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-purple-900 hover:text-purple-700">$1</a>')
                          }}
                        />
                        
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
                      <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage && !isBotMessage ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                    {isOwnMessage && !isBotMessage && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-arcana-gold-100">
                          Tú
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
            <div className="flex gap-2 items-end">
              <VoiceRecognition 
                onCommand={handleVoiceCommand}
                isEnabled={true}
              />
              <VoiceNoteRecorder 
                onVoiceNote={handleVoiceNote}
              />
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setTimeout(scrollToBottom, 50)}
                placeholder="Escribe o habla... (prueba: ARCANA ayuda)"
                className="flex-1"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!newMessage.trim()}
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
