
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ServiceNotificationOverlay from "@/components/notifications/ServiceNotificationOverlay";

const formSchema = z.object({
  leader: z.string().min(1, "El líder es requerido"),
  service_date: z.date({
    required_error: "La fecha es requerida",
  }),
  service_time: z.string().default("08:00"),
  month_order: z.number().min(1, "El orden del mes debe ser mayor a 0"),
  assigned_group_id: z.string().optional(),
  title: z.string().min(1, "El título es requerido"),
  service_type: z.string().default("regular"),
  location: z.string().default("Templo Principal"),
  special_activity: z.string().optional(),
  choir_breaks: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AgendaFormProps {
  onSuccess: () => void;
}

export const AgendaForm: React.FC<AgendaFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<Array<{id: string, name: string}>>([]);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_type: "regular",
      location: "Templo Principal",
      service_time: "08:00",
    },
  });

  const serviceType = form.watch("service_type");

  // Auto-set time to 19:00 when cuarentena is selected
  useEffect(() => {
    if (serviceType === "cuarentena") {
      form.setValue("service_time", "19:00");
    }
  }, [serviceType, form]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('worship_groups')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Error al cargar los grupos');
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('No authenticated user');

      // Get Spanish month name
      const monthName = format(data.service_date, 'MMMM', { locale: es });

      // Combine date and time
      const serviceDate = new Date(data.service_date);
      const [hours, minutes] = data.service_time.split(':').map(Number);
      serviceDate.setHours(hours, minutes, 0, 0);

      const { service_time, ...restData } = data;

      const serviceData = {
        ...restData,
        service_date: serviceDate.toISOString(),
        month_name: monthName,
        created_by: user.user.id,
        is_confirmed: false,
      };

      const { error } = await supabase
        .from('services')
        .insert([serviceData]);

      if (error) throw error;

      toast.success('Servicio agregado exitosamente');
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('Error al crear el servicio');
    } finally {
      setIsLoading(false);
    }
  };

  const timeOptions = [
    { value: "08:00", label: "8:00 AM" },
    { value: "10:45", label: "10:45 AM" },
    { value: "19:00", label: "7:00 PM" },
  ];

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="leader"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirige</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del líder" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hora del servicio
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar hora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="month_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden del mes</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="1, 2, 3, 4..." 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigned_group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo Asignado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar grupo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servicio</FormLabel>
                  <FormControl>
                    <Input placeholder="Título del servicio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Servicio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={field.value === 'cuarentena' ? 'border-amber-500 bg-amber-50' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="cuarentena">
                        <span className="flex items-center gap-2">
                          ⚠️ Cuarentena
                        </span>
                      </SelectItem>
                      <SelectItem value="especial">Especial</SelectItem>
                      <SelectItem value="conferencia">Conferencia</SelectItem>
                      <SelectItem value="evento">Evento</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.value === 'cuarentena' && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Período de cuarentena: 12 Enero - 21 Febrero 2026
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="Templo Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="special_activity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actividad Especial</FormLabel>
                  <FormControl>
                    <Input placeholder="Actividad especial por el orden del mes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="choir_breaks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descansos de los coros</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Información sobre descansos de los coros"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descripción adicional del servicio"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Notas adicionales"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Guardando...' : 'Guardar Servicio'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Vista Previa Overlay
            </Button>
          </div>
        </form>
      </Form>

      {showPreview && (
        <ServiceNotificationOverlay
          forceShow={true}
          skipSaveNotification={true}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};
