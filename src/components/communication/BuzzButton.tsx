import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSounds } from "@/hooks/useSounds";

interface User {
  id: string;
  full_name: string;
  photo_url?: string;
}

interface BuzzButtonProps {
  currentUserId: string;
}

export const BuzzButton = ({ currentUserId }: BuzzButtonProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { playSound, vibrate } = useSounds();

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    if (!currentUserId) return;

    // Escuchar zumbidos entrantes en tiempo real
    const channel = supabase
      .channel(`buzzes-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_buzzes",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        async (payload) => {
          console.log("⚡ Zumbido recibido:", payload);
          
          try {
            // Obtener info del remitente
            const { data: sender } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.sender_id)
              .maybeSingle();

            // Reproducir sonido con volumen alto
            playSound('alert', 1.0);
            
            // Vibración intensa
            vibrate([200, 100, 200, 100, 200]);

            // Mostrar toast visual
            toast({
              title: "⚡ ¡ZUMBIDO RECIBIDO!",
              description: `${sender?.full_name || 'Alguien'} te ha enviado un zumbido`,
              duration: 5000,
            });
          } catch (error) {
            console.error('Error procesando zumbido:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, playSound, vibrate, toast]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, photo_url")
      .eq("is_approved", true)
      .eq("is_active", true)
      .neq("id", currentUserId)
      .order("full_name");

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    setUsers(data || []);
  };

  const sendBuzz = async (recipientId: string, recipientName: string) => {
    setSending(true);
    try {
      const { error } = await supabase.from("user_buzzes").insert({
        sender_id: currentUserId,
        recipient_id: recipientId,
        message: "¡Zumbido!",
        buzz_type: "general",
      });

      if (error) throw error;

      toast({
        title: "⚡ Zumbido enviado",
        description: `Le has enviado un zumbido a ${recipientName}`,
      });

      setOpen(false);
    } catch (error: any) {
      console.error("Error sending buzz:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el zumbido",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Enviar zumbido"
          className="relative"
        >
          <Zap className="w-4 h-4 text-yellow-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Enviar Zumbido
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground mb-4">
          Envía un zumbido a un usuario para llamar su atención con sonido y vibración
        </div>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {users.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No hay usuarios disponibles
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      {user.photo_url && (
                        <AvatarImage src={user.photo_url} alt={user.full_name} />
                      )}
                      <AvatarFallback className="text-xs">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.full_name}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendBuzz(user.id, user.full_name)}
                    disabled={sending}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Zumbido
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
