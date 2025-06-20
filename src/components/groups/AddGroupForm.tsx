
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddGroupFormProps {
  onSuccess: () => void;
}

const AddGroupForm: React.FC<AddGroupFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color_theme: '#3B82F6'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del grupo es obligatorio",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('worship_groups')
        .insert([
          {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            color_theme: formData.color_theme,
            is_active: true
          }
        ]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Grupo de alabanza creado correctamente",
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        color_theme: '#3B82F6'
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating worship group:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el grupo de alabanza",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const colorOptions = [
    { value: '#3B82F6', name: 'Azul' },
    { value: '#EF4444', name: 'Rojo' },
    { value: '#10B981', name: 'Verde' },
    { value: '#F59E0B', name: 'Amarillo' },
    { value: '#8B5CF6', name: 'Púrpura' },
    { value: '#EC4899', name: 'Rosa' },
    { value: '#6B7280', name: 'Gris' },
    { value: '#F97316', name: 'Naranja' }
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Crear Nuevo Grupo de Alabanza</CardTitle>
        <CardDescription>
          Completa la información para crear un nuevo grupo de alabanza
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Grupo *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ej: Grupo de Adoración Principal"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe el propósito o características del grupo..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color del Grupo</Label>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    formData.color_theme === color.value 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleInputChange('color_theme', color.value)}
                  title={color.name}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Selecciona un color para identificar visualmente el grupo
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Creando...' : 'Crear Grupo'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setFormData({
                name: '',
                description: '',
                color_theme: '#3B82F6'
              })}
              disabled={loading}
            >
              Limpiar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddGroupForm;
