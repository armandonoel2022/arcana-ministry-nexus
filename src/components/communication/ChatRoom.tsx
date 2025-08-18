
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Users, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ArcanaBot } from "./ArcanaBot";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
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

    const messageText = newMessage.trim();

    try {
      console.log('Enviando mensaje:', messageText);
      
      // Enviar el mensaje del usuario
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: room.id,
          user_id: userId,
          message: messageText,
          is_bot: false
        });

      if (error) {
        console.error('Error enviando mensaje:', error);
        throw error;
      }

      console.log('Mensaje enviado exitosamente');
      setNewMessage("");

      // Procesar mensaje para ver si ARCANA debe responder
      console.log('Procesando mensaje para ARCANA...');
      const botResponse = await ArcanaBot.processMessage(
        messageText,
        room.id,
        userId
      );

      if (botResponse) {
        console.log('ARCANA generó respuesta:', botResponse.type);
        // Esperar un momento antes de que el bot responda para que parezca más natural
        setTimeout(async () => {
          console.log('Enviando respuesta de ARCANA...');
          try {
            await ArcanaBot.sendBotResponse(room.id, botResponse);
            console.log('Respuesta de ARCANA enviada exitosamente');
          } catch (botError) {
            console.error('Error enviando respuesta del bot:', botError);
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

  if (loading) {
    return <div className="text-center py-8">Cargando mensajes...</div>;
  }

  return (
    <div className="space-y-4">
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
      <Card className="h-96">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                          <p className="text-xs font-medium mb-1">
                            {getUserDisplayName(message)}
                          </p>
                        )}
                        <div className="text-sm whitespace-pre-wrap">{message.message}</div>
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
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje... (prueba: ARCANA ayuda)"
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
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
