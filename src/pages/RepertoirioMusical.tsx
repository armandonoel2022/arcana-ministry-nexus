import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Music, Plus, Search, Upload, ArrowLeft, FileJson, Settings } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import AddSongForm from '@/components/songs/AddSongForm';
import CSVUpload from '@/components/songs/CSVUpload';
import JSONUpload from '@/components/songs/JSONUpload';
import SongCatalog from '@/components/songs/SongCatalog';
import RepertoiryCategorySelector from '@/components/songs/RepertoiryCategorySelector';
import HimnarioMigrationButton from '@/components/songs/HimnarioMigrationButton';

const RepertoirioMusical = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [initialSearch, setInitialSearch] = useState<string>('');

  useEffect(() => {
    checkUserRole();
    
    // Verificar si hay parámetros de categoría y búsqueda en la URL
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    
    if (searchParam) {
      setInitialSearch(searchParam);
    }
  }, [searchParams]);

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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="view" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Ver</span>
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Cargar</span>
              </TabsTrigger>
              {userRole === 'administrator' && (
                <TabsTrigger value="tools" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Herramientas</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="view" className="space-y-4">
              <SongCatalog 
                category={selectedCategory} 
                key={refreshTrigger} 
                initialSearch={initialSearch}
              />
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <AddSongForm onSongAdded={handleDataUpdate} />
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <JSONUpload onUploadComplete={handleDataUpdate} defaultCategory={selectedCategory} />
              <CSVUpload onUploadComplete={handleDataUpdate} />
            </TabsContent>

            {userRole === 'administrator' && (
              <TabsContent value="tools" className="space-y-4">
                <HimnarioMigrationButton onMigrationComplete={handleDataUpdate} />
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default RepertoirioMusical;
