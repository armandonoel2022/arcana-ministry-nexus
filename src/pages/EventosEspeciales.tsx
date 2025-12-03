
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Plus, Save, Trash2, FileText, Download, Music, Pencil, Target } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import WorshipSetsManager from '@/components/events/WorshipSetsManager';

interface SpecialEvent {
  id: string;
  title: string;
  event_date: string;
  location: string;
  description: string;
  event_type: string;
  objectives: string;
  created_at: string;
}

interface ProgramItem {
  id: string;
  event_id: string;
  time_slot: string;
  title: string;
  description: string;
  responsible_person: string;
  duration_minutes: number;
  item_order: number;
  notes: string;
}

const EventosEspeciales = () => {
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SpecialEvent | null>(null);
  const [programItems, setProgramItems] = useState<ProgramItem[]>([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [loading, setLoading] = useState(true);

  const [eventForm, setEventForm] = useState({
    title: '',
    event_date: '',
    location: 'Templo Principal',
    description: '',
    event_type: 'special',
    objectives: '',
  });

  const [isEditingEvent, setIsEditingEvent] = useState(false);

  const [itemForm, setItemForm] = useState({
    start_time: '',
    end_time: '',
    title: '',
    description: '',
    responsible_person: '',
    notes: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchProgramItems(selectedEvent.id);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('special_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error('Error al cargar eventos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramItems = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_program_items')
        .select('*')
        .eq('event_id', eventId)
        .order('item_order', { ascending: true });

      if (error) throw error;
      setProgramItems(data || []);
    } catch (error: any) {
      toast.error('Error al cargar programa: ' + error.message);
    }
  };

  const createEvent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión');
        return;
      }

      const { error } = await supabase
        .from('special_events')
        .insert([{ ...eventForm, created_by: user.id }]);

      if (error) throw error;

      toast.success('Evento creado exitosamente');
      setIsCreatingEvent(false);
      setEventForm({
        title: '',
        event_date: '',
        location: 'Templo Principal',
        description: '',
        event_type: 'special',
        objectives: '',
      });
      fetchEvents();
    } catch (error: any) {
      toast.error('Error al crear evento: ' + error.message);
    }
  };

  const updateEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      const { error } = await supabase
        .from('special_events')
        .update({
          title: eventForm.title,
          event_date: eventForm.event_date,
          location: eventForm.location,
          description: eventForm.description,
          objectives: eventForm.objectives,
        })
        .eq('id', selectedEvent.id);

      if (error) throw error;

      toast.success('Evento actualizado');
      setIsEditingEvent(false);
      fetchEvents();
      // Update selectedEvent with new data
      setSelectedEvent({
        ...selectedEvent,
        title: eventForm.title,
        event_date: eventForm.event_date,
        location: eventForm.location,
        description: eventForm.description,
        objectives: eventForm.objectives,
      });
    } catch (error: any) {
      toast.error('Error al actualizar: ' + error.message);
    }
  };

  const openEditEvent = () => {
    if (!selectedEvent) return;
    setEventForm({
      title: selectedEvent.title,
      event_date: selectedEvent.event_date,
      location: selectedEvent.location || '',
      description: selectedEvent.description || '',
      event_type: selectedEvent.event_type || 'special',
      objectives: selectedEvent.objectives || '',
    });
    setIsEditingEvent(true);
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  };

  const createProgramItem = async () => {
    if (!selectedEvent) return;

    try {
      const duration = calculateDuration(itemForm.start_time, itemForm.end_time);
      
      if (duration <= 0) {
        toast.error('La hora de finalización debe ser posterior a la hora de inicio');
        return;
      }

      const nextOrder = programItems.length + 1;
      
      const { error } = await supabase
        .from('event_program_items')
        .insert([{
          event_id: selectedEvent.id,
          time_slot: `${itemForm.start_time} - ${itemForm.end_time}`,
          title: itemForm.title,
          description: itemForm.description,
          responsible_person: itemForm.responsible_person,
          duration_minutes: duration,
          item_order: nextOrder,
          notes: itemForm.notes,
        }]);

      if (error) throw error;

      toast.success('Item agregado al programa');
      setIsCreatingItem(false);
      setItemForm({
        start_time: '',
        end_time: '',
        title: '',
        description: '',
        responsible_person: '',
        notes: '',
      });
      fetchProgramItems(selectedEvent.id);
    } catch (error: any) {
      toast.error('Error al agregar item: ' + error.message);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('event_program_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Item eliminado');
      if (selectedEvent) {
        fetchProgramItems(selectedEvent.id);
      }
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  const generatePDF = () => {
    if (!selectedEvent || programItems.length === 0) {
      toast.error('Selecciona un evento con items en el programa');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Logo/Header - ARCA DE NOE
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ARCA DE NOE', 15, 15);
      
      // Título principal
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(selectedEvent.title, pageWidth - 30);
      doc.text(titleLines, pageWidth / 2, 30, { align: 'center' });
      
      // Subtítulo (si existe)
      let yPosition = 30 + (titleLines.length * 7);
      if (selectedEvent.description) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        const subtitleLines = doc.splitTextToSize(selectedEvent.description, pageWidth - 30);
        doc.text(subtitleLines, pageWidth / 2, yPosition + 5, { align: 'center' });
        yPosition += subtitleLines.length * 6 + 5;
      }
      
      // Programación
      yPosition += 10;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Programación', pageWidth / 2, yPosition, { align: 'center' });
      
      // Información general
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const eventDate = format(new Date(selectedEvent.event_date), "EEEE d 'de' MMMM yyyy", { locale: es });
      doc.text(`Fecha: ${eventDate}`, 15, yPosition);
      yPosition += 6;
      
      if (selectedEvent.location) {
        doc.text(`Lugar: ${selectedEvent.location}`, 15, yPosition);
        yPosition += 6;
      }
      
      // Calcular duración total
      const totalMinutes = programItems.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const durationText = hours > 0 
        ? `${hours} hora${hours > 1 ? 's' : ''}, ${minutes} minutos`
        : `${minutes} minutos`;
      doc.text(`Tiempo de programa: ${durationText}`, 15, yPosition);
      yPosition += 6;
      
      if (programItems[0]?.time_slot) {
        doc.text(`Inicio formal: ${programItems[0].time_slot}`, 15, yPosition);
        yPosition += 10;
      } else {
        yPosition += 6;
      }
      
      // Tabla de programa
      const tableData = programItems.map(item => {
        const timeRange = item.time_slot || 'N/A';
        const durationText = `${item.duration_minutes} minutos`;
        
        return [
          `${timeRange}\n${durationText}`,
          item.title,
          item.responsible_person || '',
          item.notes || item.description || ''
        ];
      });
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Hora / Duración', 'Actividad', 'Responsable', 'Observaciones']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          overflow: 'linebreak',
          valign: 'top'
        },
        columnStyles: {
          0: { cellWidth: 35, halign: 'center' },
          1: { cellWidth: 45 },
          2: { cellWidth: 40 },
          3: { cellWidth: 'auto' }
        },
        margin: { left: 15, right: 15 }
      });
      
      // Footer
      const finalY = (doc as any).lastAutoTable.finalY || yPosition + 20;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        'Nota: Al finalizar el servicio, tendremos música de ambientación mientras los invitados se despiden.',
        15,
        finalY + 10,
        { maxWidth: pageWidth - 30 }
      );
      
      // Guardar PDF
      const fileName = `Programa_${selectedEvent.title.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy')}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF generado exitosamente');
    } catch (error: any) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar PDF: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Cargando eventos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Eventos Especiales</h1>
          <p className="text-muted-foreground">Gestión de programas para eventos especiales</p>
        </div>
        <Button onClick={() => setIsCreatingEvent(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Lista de eventos */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Eventos</CardTitle>
            <CardDescription>Selecciona un evento para ver su programa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.map((event) => (
              <Button
                key={event.id}
                variant={selectedEvent?.id === event.id ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setSelectedEvent(event)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-xs">
                    {format(new Date(event.event_date), "d 'de' MMMM, yyyy", { locale: es })}
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Programa del evento */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {selectedEvent ? selectedEvent.title : 'Selecciona un evento'}
                  {selectedEvent && (
                    <Button variant="ghost" size="sm" onClick={openEditEvent}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </CardTitle>
                {selectedEvent && (
                  <>
                    <CardDescription>
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {selectedEvent.location} • {format(new Date(selectedEvent.event_date), "d 'de' MMMM, yyyy", { locale: es })}
                    </CardDescription>
                    {selectedEvent.objectives && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium mb-1">
                          <Target className="w-4 h-4" />
                          Objetivos Principales
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedEvent.objectives}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              {selectedEvent && (
                <Button 
                  variant="default" 
                  onClick={generatePDF}
                  disabled={programItems.length === 0}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <Tabs defaultValue="sets" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="sets" className="flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    Sets de Adoración
                  </TabsTrigger>
                  <TabsTrigger value="program" className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Programa General
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="sets">
                  <WorshipSetsManager 
                    eventId={selectedEvent.id} 
                    eventTitle={selectedEvent.title} 
                  />
                </TabsContent>
                
                <TabsContent value="program">
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button onClick={() => setIsCreatingItem(true)} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Item
                      </Button>
                    </div>
                    {programItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold">{item.time_slot}</span>
                                <span className="text-sm text-muted-foreground">
                                  ({item.duration_minutes} min)
                                </span>
                              </div>
                              <h3 className="font-bold">{item.title}</h3>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                              )}
                              {item.responsible_person && (
                                <p className="text-sm mt-2">
                                  <span className="font-medium">Responsable:</span> {item.responsible_person}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  <span className="font-medium">Notas:</span> {item.notes}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {programItems.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No hay items en el programa general.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Selecciona un evento de la lista para ver su programa
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para crear evento */}
      <Dialog open={isCreatingEvent} onOpenChange={setIsCreatingEvent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título del Evento</Label>
              <Input
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Ej: Aniversario Iglesia Arca de Noé"
                required
              />
            </div>
            <div>
              <Label>Fecha y Hora</Label>
              <Input
                type="datetime-local"
                value={eventForm.event_date}
                onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Ubicación</Label>
              <Input
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="Templo Principal"
                required
              />
            </div>
            <div>
              <Label>Descripción / Subtítulo</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Ej: 70 años de Gracia y Fidelidad - Retiro para conmemorar la Reforma Protestante"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Puedes incluir el subtítulo y detalles adicionales del evento
              </p>
            </div>
            <div>
              <Label>Objetivos Principales</Label>
              <Textarea
                value={eventForm.objectives}
                onChange={(e) => setEventForm({ ...eventForm, objectives: e.target.value })}
                placeholder="Ej: Motivar a los jóvenes, Presentar el evangelio, Fortalecer la comunión..."
                rows={4}
              />
            </div>
            <Button onClick={createEvent} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Crear Evento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar evento */}
      <Dialog open={isEditingEvent} onOpenChange={setIsEditingEvent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título del Evento</Label>
              <Input
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Ej: Aniversario Iglesia Arca de Noé"
                required
              />
            </div>
            <div>
              <Label>Fecha y Hora</Label>
              <Input
                type="datetime-local"
                value={eventForm.event_date}
                onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Ubicación</Label>
              <Input
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="Templo Principal"
              />
            </div>
            <div>
              <Label>Descripción / Subtítulo</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Ej: 70 años de Gracia y Fidelidad"
                rows={2}
              />
            </div>
            <div>
              <Label>Objetivos Principales</Label>
              <Textarea
                value={eventForm.objectives}
                onChange={(e) => setEventForm({ ...eventForm, objectives: e.target.value })}
                placeholder="Ej: Motivar a los jóvenes, Presentar el evangelio..."
                rows={4}
              />
            </div>
            <Button onClick={updateEvent} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear item del programa */}
      <Dialog open={isCreatingItem} onOpenChange={setIsCreatingItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Item al Programa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora de Inicio</Label>
                <Input
                  type="time"
                  value={itemForm.start_time}
                  onChange={(e) => setItemForm({ ...itemForm, start_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Hora de Finalización</Label>
                <Input
                  type="time"
                  value={itemForm.end_time}
                  onChange={(e) => setItemForm({ ...itemForm, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
            {itemForm.start_time && itemForm.end_time && (
              <div className="text-sm text-muted-foreground">
                Duración: {calculateDuration(itemForm.start_time, itemForm.end_time)} minutos
              </div>
            )}
            <div>
              <Label>Título</Label>
              <Input
                value={itemForm.title}
                onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                placeholder="Ej: Adoración y Alabanzas"
                required
              />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Detalles del item..."
              />
            </div>
            <div>
              <Label>Responsable</Label>
              <Input
                value={itemForm.responsible_person}
                onChange={(e) => setItemForm({ ...itemForm, responsible_person: e.target.value })}
                placeholder="Nombre del responsable"
              />
            </div>
            <div>
              <Label>Observaciones (opcional)</Label>
              <Textarea
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                placeholder="Notas adicionales, canciones específicas, etc."
              />
            </div>
            <Button onClick={createProgramItem} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Agregar al Programa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventosEspeciales;
