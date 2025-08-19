
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, User, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const memberSchema = z.object({
  nombres: z.string().min(1, 'Los nombres son requeridos'),
  apellidos: z.string().min(1, 'Los apellidos son requeridos'),
  cargo: z.string().min(1, 'El cargo es requerido'),
  fecha_nacimiento: z.string().optional(),
  telefono: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  referencias: z.string().optional(),
  grupo: z.string().optional(),
  persona_reporte: z.string().optional(),
  voz_instrumento: z.string().optional(),
  tipo_sangre: z.string().optional(),
  contacto_emergencia: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface AddMemberFormProps {
  onSuccess?: () => void;
}

const AddMemberForm = ({ onSuccess }: AddMemberFormProps) => {
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      cargo: '',
      fecha_nacimiento: '',
      telefono: '',
      celular: '',
      email: '',
      direccion: '',
      referencias: '',
      grupo: '',
      persona_reporte: '',
      voz_instrumento: '',
      tipo_sangre: '',
      contacto_emergencia: '',
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (memberId: string): Promise<string | null> => {
    if (!photoFile) return null;

    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${memberId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('member-photos')
      .upload(fileName, photoFile, {
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('member-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const onSubmit = async (data: MemberFormData) => {
    setLoading(true);
    try {
      // Insert member first
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert([{
          nombres: data.nombres,
          apellidos: data.apellidos,
          cargo: data.cargo,
          fecha_nacimiento: data.fecha_nacimiento || null,
          telefono: data.telefono || null,
          celular: data.celular || null,
          email: data.email || null,
          direccion: data.direccion || null,
          referencias: data.referencias || null,
          grupo: data.grupo || null,
          persona_reporte: data.persona_reporte || null,
          voz_instrumento: data.voz_instrumento || null,
          tipo_sangre: data.tipo_sangre || null,
          contacto_emergencia: data.contacto_emergencia || null,
        }])
        .select()
        .single();

      if (memberError) throw memberError;

      // Upload photo if provided
      let photoUrl = null;
      if (photoFile && memberData) {
        try {
          photoUrl = await uploadPhoto(memberData.id);
          
          // Update member with photo URL
          if (photoUrl) {
            const { error: updateError } = await supabase
              .from('members')
              .update({ photo_url: photoUrl })
              .eq('id', memberData.id);

            if (updateError) throw updateError;
          }
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          // Don't fail the entire operation if photo upload fails
        }
      }

      toast({
        title: "Éxito",
        description: "Integrante agregado correctamente",
      });

      form.reset();
      setPhotoFile(null);
      setPhotoPreview('');
      onSuccess?.();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el integrante",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'pastor', label: 'Pastor' },
    { value: 'pastora', label: 'Pastora' },
    { value: 'director_alabanza', label: 'Director de Alabanza' },
    { value: 'directora_alabanza', label: 'Directora de Alabanza' },
    { value: 'director_musical', label: 'Director Musical' },
    { value: 'corista', label: 'Corista' },
    { value: 'directora_danza', label: 'Directora de Danza' },
    { value: 'danzarina', label: 'Danzarina' },
    { value: 'director_multimedia', label: 'Director Multimedia' },
    { value: 'camarografo', label: 'Camarógrafo' },
    { value: 'camarógrafa', label: 'Camarógrafa' },
    { value: 'encargado_piso', label: 'Encargado de Piso' },
    { value: 'encargada_piso', label: 'Encargada de Piso' },
    { value: 'musico', label: 'Músico' },
    { value: 'sonidista', label: 'Sonidista' },
    { value: 'encargado_luces', label: 'Encargado de Luces' },
    { value: 'encargado_proyeccion', label: 'Encargado de Proyección' },
    { value: 'encargado_streaming', label: 'Encargado de Streaming' },
  ];

  const groups = [
    { value: 'directiva', label: 'Directiva' },
    { value: 'directores_alabanza', label: 'Directores de Alabanza' },
    { value: 'coristas', label: 'Coristas' },
    { value: 'musicos', label: 'Músicos' },
    { value: 'multimedia', label: 'Multimedia' },
    { value: 'danza', label: 'Danza' },
    { value: 'teatro', label: 'Teatro' },
    { value: 'piso', label: 'Piso' },
    // Grupos específicos de adoración
    { value: 'grupo_massy', label: 'Grupo de Massy' },
    { value: 'grupo_aleida', label: 'Grupo de Aleida' },
    { value: 'grupo_keyla', label: 'Grupo de Keyla' },
  ];

  const bloodTypes = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Agregar Nuevo Integrante
        </CardTitle>
        <CardDescription>
          Completa la información del nuevo miembro del ministerio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="photo">Foto del Integrante</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                <Input
                  id="photo"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  onChange={handlePhotoChange}
                  className="w-full"
                />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos soportados: JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombres del integrante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apellidos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos *</FormLabel>
                    <FormControl>
                      <Input placeholder="Apellidos del integrante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo/Rol *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
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
                name="grupo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grupo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un grupo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.value} value={group.value}>
                            {group.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="fecha_nacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Teléfono fijo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="celular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de celular" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Dirección de residencia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="voz_instrumento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voz/Instrumento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Soprano, Guitarra, Piano" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_sangre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Sangre</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo de sangre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bloodTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="persona_reporte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona de Reporte</FormLabel>
                    <FormControl>
                      <Input placeholder="A quién reporta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contacto_emergencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contacto de Emergencia</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre y teléfono de emergencia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="referencias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencias</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Referencias adicionales del integrante" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Agregar Integrante
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddMemberForm;
