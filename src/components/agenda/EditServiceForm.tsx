import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Service {
  id: string;
  title: string;
  service_date: string;
  leader: string;
  service_type: string;
  location: string;
  special_activity: string | null;
  description: string | null;
  notes: string | null;
  assigned_group_id: string | null;
}

interface WorshipGroup {
  id: string;
  name: string;
}

interface EditServiceFormProps {
  service: Service;
  onServiceUpdated: () => void;
  onCancel: () => void;
}

export const EditServiceForm: React.FC<EditServiceFormProps> = ({
  service,
  onServiceUpdated,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: service.title,
    service_date: format(new Date(service.service_date), 'yyyy-MM-dd'),
    leader: service.leader,
    service_type: service.service_type,
    location: service.location,
    special_activity: service.special_activity || '',
    description: service.description || '',
    notes: service.notes || '',
    assigned_group_id: service.assigned_group_id || ''
  });
  
  const [worshipGroups, setWorshipGroups] = useState<WorshipGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWorshipGroups();
  }, []);

  const fetchWorshipGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('worship_groups')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setWorshipGroups(data || []);
    } catch (error) {
      console.error('Error fetching worship groups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Parse date and set time to noon to avoid timezone issues
      const [year, month, day] = formData.service_date.split('-').map(Number);
      const serviceDate = new Date(year, month - 1, day, 12, 0, 0, 0);

      const updateData = {
        ...formData,
        service_date: serviceDate.toISOString(),
        assigned_group_id: formData.assigned_group_id || null,
        special_activity: formData.special_activity || null,
        description: formData.description || null,
        notes: formData.notes || null
      };

      const { error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', service.id);

      if (error) throw error;

      toast.success('Servicio actualizado exitosamente');
      onServiceUpdated();
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Error al actualizar el servicio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Título del Servicio</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="service_date">Fecha del Servicio</Label>
          <Input
            id="service_date"
            type="date"
            value={formData.service_date}
            onChange={(e) => handleInputChange('service_date', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="leader">Quien Dirige</Label>
          <Input
            id="leader"
            value={formData.leader}
            onChange={(e) => handleInputChange('leader', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="service_type">Tipo de Servicio</Label>
          <Select value={formData.service_type} onValueChange={(value) => handleInputChange('service_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="especial">Especial</SelectItem>
              <SelectItem value="conferencia">Conferencia</SelectItem>
              <SelectItem value="evento">Evento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="location">Ubicación</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="assigned_group_id">Grupo Asignado</Label>
          <Select value={formData.assigned_group_id || "none"} onValueChange={(value) => handleInputChange('assigned_group_id', value === "none" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin asignar</SelectItem>
              {worshipGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="special_activity">Actividad Especial</Label>
        <Input
          id="special_activity"
          value={formData.special_activity}
          onChange={(e) => handleInputChange('special_activity', e.target.value)}
          placeholder="Ej: Retiro Congregacional, Bautismo, etc."
        />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Descripción del servicio"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Notas adicionales"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Actualizando...' : 'Actualizar Servicio'}
        </Button>
      </div>
    </form>
  );
};