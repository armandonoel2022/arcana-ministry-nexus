import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

interface Contact {
  id: string;
  full_name: string;
  photo_url: string | null;
  interaction_count?: number;
}

interface FrequentContactsProps {
  currentUserId: string;
  onSelectContact: (contact: Contact) => void;
  onShowAllContacts: () => void;
}

export const FrequentContacts = ({ currentUserId, onSelectContact, onShowAllContacts }: FrequentContactsProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFrequentContacts();
  }, [currentUserId]);

  const fetchFrequentContacts = async () => {
    try {
      // Primero intentar obtener contactos frecuentes
      const { data: frequentData } = await supabase
        .from("frequent_contacts")
        .select(`
          contact_id,
          interaction_count,
          profiles:contact_id (
            id,
            full_name,
            photo_url
          )
        `)
        .eq("user_id", currentUserId)
        .order("interaction_count", { ascending: false })
        .limit(10);

      if (frequentData && frequentData.length > 0) {
        const mappedContacts = frequentData
          .filter(fc => fc.profiles)
          .map(fc => ({
            id: (fc.profiles as any).id,
            full_name: (fc.profiles as any).full_name,
            photo_url: (fc.profiles as any).photo_url,
            interaction_count: fc.interaction_count
          }));
        setContacts(mappedContacts);
      } else {
        // Si no hay contactos frecuentes, mostrar algunos perfiles activos
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, photo_url")
          .eq("is_active", true)
          .neq("id", currentUserId)
          .limit(10);
        
        setContacts(profiles || []);
      }
    } catch (error) {
      console.error("Error fetching frequent contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Colores pastel para los bordes de los avatares
  const borderColors = [
    "ring-emerald-400",
    "ring-amber-400", 
    "ring-pink-400",
    "ring-sky-400",
    "ring-violet-400",
    "ring-rose-400",
    "ring-teal-400",
    "ring-orange-400"
  ];

  if (loading) {
    return (
      <div className="flex gap-4 px-4 py-3 overflow-x-auto">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex flex-col items-center gap-1 min-w-[60px]">
            <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-3 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-hide">
      {/* Botón para agregar nuevo chat */}
      <button
        onClick={onShowAllContacts}
        className="flex flex-col items-center gap-1 min-w-[60px] group"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all">
          <Plus className="w-6 h-6 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground truncate w-14 text-center">Nuevo</span>
      </button>

      {/* Contactos frecuentes */}
      {contacts.map((contact, index) => (
        <button
          key={contact.id}
          onClick={() => onSelectContact(contact)}
          className="flex flex-col items-center gap-1 min-w-[60px] group"
        >
          <Avatar className={`w-14 h-14 ring-2 ${borderColors[index % borderColors.length]} ring-offset-2 ring-offset-background group-hover:scale-105 transition-transform`}>
            <AvatarImage src={contact.photo_url || undefined} alt={contact.full_name} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-sm font-medium">
              {getInitials(contact.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate w-14 text-center">
            {contact.full_name.split(" ")[0]}
          </span>
        </button>
      ))}
    </div>
  );
};
