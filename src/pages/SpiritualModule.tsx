
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyVerse } from "@/components/spiritual/DailyVerse";
import { VerseHistory } from "@/components/spiritual/VerseHistory";
import { VerseManagement } from "@/components/spiritual/VerseManagement";
import { BookOpen, Calendar, Settings, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SpiritualModule = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Cargando módulo espiritual...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-arcana-blue-600" />
          Módulo Espiritual
        </h1>
        <p className="text-gray-600">
          Encuentra inspiración diaria a través de la Palabra de Dios
        </p>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Verso del Día
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Historial
          </TabsTrigger>
          {userRole === 'administrator' && (
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Gestión
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <DailyVerse />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <VerseHistory />
        </TabsContent>

        {userRole === 'administrator' && (
          <TabsContent value="management" className="mt-6">
            <VerseManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SpiritualModule;
