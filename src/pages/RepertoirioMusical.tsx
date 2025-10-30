import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Music, Plus, Search, Upload, ArrowLeft } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import AddSongForm from '@/components/songs/AddSongForm';
import CSVUpload from '@/components/songs/CSVUpload';
import SongCatalog from '@/components/songs/SongCatalog';
import RepertoiryCategorySelector from '@/components/songs/RepertoiryCategorySelector';

const RepertoirioMusical = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
    }
  };

  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  const getCategoryName = (categoryId: string) => {
    const names: Record<string, string> = {
      general: 'Repertorio General',
      himnario: 'Himnario de Gloria',
      villancicos: 'Villancicos',
      adn: 'ADN Arca de Noé'
    };
    return names[categoryId] || 'Repertorio';
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {!selectedCategory ? (
        <RepertoiryCategorySelector onSelectCategory={handleCategorySelect} />
      ) : (
        <>
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCategories}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{getCategoryName(selectedCategory)}</h1>
              <p className="text-sm text-muted-foreground">Gestión del catálogo de canciones</p>
            </div>
          </div>

          <Tabs defaultValue="view" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="view" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Ver Repertorio</span>
                <span className="sm:hidden">Ver</span>
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar</span>
                <span className="sm:hidden">+</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Cargar</span>
                <span className="sm:hidden">CSV</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="space-y-4">
              <SongCatalog category={selectedCategory} key={refreshTrigger} />
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <AddSongForm onSongAdded={handleDataUpdate} />
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <CSVUpload onUploadComplete={handleDataUpdate} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default RepertoirioMusical;
