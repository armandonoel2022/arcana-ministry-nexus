import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, UserX } from "lucide-react";

interface Contact {
  id: string;
  full_name: string;
  photo_url: string | null;
  email?: string | null;
  is_registered: boolean;
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
      // Fetch all registered profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, photo_url, email")
        .eq("is_active", true)
        .neq("id", currentUserId)
        .order("full_name");

      // Fetch all active members
      const { data: members } = await supabase
        .from("members")
        .select("id, nombres, apellidos, photo_url, email, cargo")
        .eq("is_active", true);

      const profilesMap = new Map<string, typeof profiles extends (infer T)[] | null ? T : never>();
      const matchedMemberIds = new Set<string>();

      // Index profiles by email (lowercase) for matching
      const profilesByEmail = new Map<string, (typeof profiles extends (infer T)[] | null ? T : never)>();
      (profiles || []).forEach(p => {
        profilesMap.set(p.id, p);
        if (p.email) profilesByEmail.set(p.email.toLowerCase(), p);
      });

      const allContacts: Contact[] = [];

      // First, add all registered profiles
      (profiles || []).forEach(profile => {
        let photoUrl = profile.photo_url;

        // Try to find matching member for photo
        if (!photoUrl && members) {
          const member = members.find(m =>
            (m.email && profile.email && m.email.toLowerCase() === profile.email.toLowerCase()) ||
            (profile.full_name && m.nombres && profile.full_name.toLowerCase().includes(m.nombres.toLowerCase()))
          );
          if (member?.photo_url) photoUrl = member.photo_url;
          if (member) matchedMemberIds.add(member.id);
        } else if (members) {
          // Still track matched members even if profile has photo
          const member = members.find(m =>
            (m.email && profile.email && m.email.toLowerCase() === profile.email.toLowerCase()) ||
            (profile.full_name && m.nombres && profile.full_name.toLowerCase().includes(m.nombres.toLowerCase()))
          );
          if (member) matchedMemberIds.add(member.id);
        }

        allContacts.push({
          id: profile.id,
          full_name: profile.full_name,
          photo_url: photoUrl,
          email: profile.email,
          is_registered: true,
        });
      });

      // Then, add unmatched members (not registered)
      (members || []).forEach(member => {
        if (matchedMemberIds.has(member.id)) return;

        // Check if member has a matching profile by email
        if (member.email && profilesByEmail.has(member.email.toLowerCase())) return;

        allContacts.push({
          id: member.id, // member ID, not profile ID
          full_name: `${member.nombres} ${member.apellidos}`,
          photo_url: member.photo_url,
          email: member.email,
          is_registered: false,
        });
      });

      // Sort: registered first, then alphabetically
      allContacts.sort((a, b) => {
        if (a.is_registered !== b.is_registered) return a.is_registered ? -1 : 1;
        return a.full_name.localeCompare(b.full_name);
      });

      setContacts(allContacts);
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

  // Group by letter
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const letter = contact.full_name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const registeredCount = contacts.filter(c => c.is_registered).length;
  const totalCount = contacts.length;

  return (
    <div className="flex flex-col h-full bg-background">
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
          <p className="text-xs text-primary-foreground/70">
            {registeredCount} registrados · {totalCount} integrantes
          </p>
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
                  className={`flex items-center gap-3 p-3 transition-colors ${
                    contact.is_registered
                      ? "hover:bg-muted/50 cursor-pointer active:bg-muted"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (contact.is_registered) {
                      onSelectContact(contact);
                    }
                  }}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={contact.photo_url || undefined} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40">
                        {getInitials(contact.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {!contact.is_registered && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-muted-foreground/60 rounded-full flex items-center justify-center">
                        <UserX className="w-2.5 h-2.5 text-background" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground break-words">{contact.full_name}</span>
                    {!contact.is_registered && (
                      <Badge variant="outline" className="ml-2 text-[10px] text-muted-foreground border-muted-foreground/30">
                        No registrado
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
