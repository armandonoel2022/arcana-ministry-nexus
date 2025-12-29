import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Smile, Paperclip, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VoiceNoteRecorder } from "./VoiceNoteRecorder";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { EmoticonPicker } from "./EmoticonPicker";
import { BuzzButton } from "./BuzzButton";
import { useEmoticons } from "@/hooks/useEmoticons";
import { useSounds } from "@/hooks/useSounds";
import { useMediaUpload } from "@/hooks/useMediaUpload";

interface Partner {
  id: string;
  full_name: string;
  photo_url: string | null;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_read: boolean;
  media_url?: string;
  media_type?: string;
}

interface DirectMessageProps {
  partner: Partner;
  currentUserId: string;
  onBack: () => void;
}

export const DirectMessage = ({ partner, currentUserId, onBack }: DirectMessageProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmoticons, setShowEmoticons] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { replaceEmoticons } = useEmoticons();
  const { playSound } = useSounds();
  const { uploadMedia, uploading, progress } = useMediaUpload();

  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();
    markMessagesAsRead();
  }, [partner.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partner.id}),and(sender_id.eq.${partner.id},receiver_id.eq.${currentUserId})`)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`dm-${currentUserId}-${partner.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === partner.id) ||
            (newMsg.sender_id === partner.id && newMsg.receiver_id === currentUserId)
          ) {
            setMessages(prev => [...prev, newMsg]);
            if (newMsg.sender_id === partner.id) {
              playSound("notification", 0.5);
              markMessagesAsRead();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    await supabase
      .from("direct_messages")
      .update({ is_read: true })
      .eq("sender_id", partner.id)
      .eq("receiver_id", currentUserId)
      .eq("is_read", false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    const textToSend = replaceEmoticons(newMessage.trim());
    if (!textToSend && !attachedMedia) return;

    try {
      const messageData: any = {
        sender_id: currentUserId,
        receiver_id: partner.id,
        message: textToSend || "📎 Archivo",
      };

      if (attachedMedia) {
        messageData.media_url = attachedMedia.url;
        messageData.media_type = attachedMedia.type;
      }

      const { error } = await supabase
        .from("direct_messages")
        .insert(messageData);

      if (error) throw error;

      playSound("alert", 0.3);
      setNewMessage("");
      setAttachedMedia(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  };

  const handleVoiceNote = async (audioUrl: string) => {
    try {
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: currentUserId,
        receiver_id: partner.id,
        message: "🎤 Nota de voz",
        media_url: audioUrl,
        media_type: "voice",
      });

      if (error) throw error;
      playSound("notification", 0.5);
    } catch (error) {
      console.error("Error sending voice note:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la nota de voz",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Solo se permiten imágenes y videos",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo no puede ser mayor a 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const mediaFile = await uploadMedia(file, `dm-${currentUserId}`, currentUserId);
      if (mediaFile) {
        setAttachedMedia(mediaFile);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-3 py-2 flex items-center gap-3 shadow-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10 ring-2 ring-primary-foreground/20">
          <AvatarImage src={partner.photo_url || undefined} alt={partner.full_name} className="object-cover" />
          <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-sm">
            {getInitials(partner.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-primary-foreground truncate">{partner.full_name}</h2>
          <p className="text-xs text-primary-foreground/70">Chat privado</p>
        </div>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 bg-[url('/chat-bg.png')] bg-repeat"
        style={{ backgroundSize: '400px' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Avatar className="w-20 h-20 mb-4">
              <AvatarImage src={partner.photo_url || undefined} className="object-cover" />
              <AvatarFallback className="text-2xl bg-primary/10">
                {getInitials(partner.full_name)}
              </AvatarFallback>
            </Avatar>
            <p className="text-center">Inicia una conversación con</p>
            <p className="font-semibold">{partner.full_name}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card text-card-foreground rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  
                  {msg.media_url && (
                    <div className="mt-2">
                      {msg.media_type === "image" && (
                        <img src={msg.media_url} alt="" className="max-w-full rounded-lg max-h-48 object-cover" />
                      )}
                      {msg.media_type === "video" && (
                        <video controls className="max-w-full rounded-lg max-h-48">
                          <source src={msg.media_url} type="video/mp4" />
                        </video>
                      )}
                      {(msg.media_type === "voice" || msg.media_type === "audio") && (
                        <VoiceMessagePlayer audioUrl={msg.media_url} />
                      )}
                    </div>
                  )}
                  
                  <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                    <span className={`text-[10px] ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {formatTime(msg.created_at)}
                    </span>
                    {isOwn && msg.is_read && (
                      <span className="text-[10px] text-primary-foreground/70">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-2 space-y-2">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEmoticons(!showEmoticons)}
            className="h-8 w-8"
          >
            <Smile className="w-5 h-5 text-muted-foreground" />
          </Button>
          <BuzzButton currentUserId={currentUserId} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-8 w-8"
          >
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {showEmoticons && (
          <EmoticonPicker
            visible={showEmoticons}
            onClose={() => setShowEmoticons(false)}
            onSelect={(emoticon) => {
              setNewMessage(prev => prev + emoticon);
              setShowEmoticons(false);
            }}
          />
        )}

        {uploading && (
          <div className="bg-muted rounded-lg p-2">
            <div className="text-xs text-muted-foreground mb-1">Subiendo... {progress.toFixed(0)}%</div>
            <div className="h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {attachedMedia && (
          <div className="bg-muted rounded-lg p-2 flex items-center justify-between">
            <span className="text-sm truncate">{attachedMedia.name}</span>
            <Button variant="ghost" size="sm" onClick={() => setAttachedMedia(null)}>×</Button>
          </div>
        )}

        {/* Input row */}
        <div className="flex items-center gap-2">
          <VoiceNoteRecorder onVoiceNote={handleVoiceNote} roomId={`dm-${partner.id}`} userId={currentUserId} />
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-full bg-muted border-0"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() && !attachedMedia}
            size="icon"
            className="rounded-full h-10 w-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
