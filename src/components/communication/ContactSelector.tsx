import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";

interface Contact {
  id: string;
  full_name: string;
  photo_url: string | null;
}

interface ContactSelectorProps {
  currentUserId: string;
  onSelectContact: (contact: Contact) => void;
  onBack: () => void;
}

export const ContactSelector = ({ currentUserId, onSelectContact, onBack }: ContactSelectorProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, photo_url")
        .eq("is_active", true)
        .neq("id", currentUserId)
        .order("full_name");

      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  // Agrupar por letra inicial
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const letter = contact.full_name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

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
        <div>
          <h2 className="font-semibold text-primary-foreground">Nuevo mensaje</h2>
          <p className="text-xs text-primary-foreground/70">{contacts.length} contactos</p>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar contacto..."
            className="pl-10 bg-muted border-0"
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron contactos
          </div>
        ) : (
          Object.entries(groupedContacts).sort().map(([letter, letterContacts]) => (
            <div key={letter}>
              <div className="sticky top-0 bg-muted/80 backdrop-blur px-4 py-1">
                <span className="text-sm font-semibold text-primary">{letter}</span>
              </div>
              {letterContacts.map(contact => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors active:bg-muted"
                  onClick={() => onSelectContact(contact)}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={contact.photo_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40">
                      {getInitials(contact.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{contact.full_name}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
