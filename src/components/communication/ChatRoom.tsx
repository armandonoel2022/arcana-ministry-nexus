
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  user_id: string;
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
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
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

      if (error) throw error;
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
          console.log('New message received:', payload);
          fetchMessages(); // Refetch to get user data
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: room.id,
          user_id: currentUser.id,
          message: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
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
                const isOwn = message.user_id === currentUser?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwn && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-arcana-blue-100">
                          {getInitials(message.profiles?.full_name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-xs ${isOwn ? 'order-first' : ''}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          isOwn
                            ? 'bg-arcana-blue-gradient text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-medium mb-1">
                            {message.profiles?.full_name || 'Usuario'}
                          </p>
                        )}
                        <p className="text-sm">{message.message}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                    {isOwn && (
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
                placeholder="Escribe tu mensaje..."
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
