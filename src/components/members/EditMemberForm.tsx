import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, User } from 'lucide-react';
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

interface Member {
  id: string;
  nombres: string;
  apellidos: string;
  photo_url?: string;
  cargo: string;
  fecha_nacimiento?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  direccion?: string;
  referencias?: string;
  grupo?: string;
  persona_reporte?: string;
  voz_instrumento?: string;
  tipo_sangre?: string;
  contacto_emergencia?: string;
}

interface EditMemberFormProps {
  member: Member;
  onSuccess?: () => void;
}

const EditMemberForm = ({ member, onSuccess }: EditMemberFormProps) => {
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(member.photo_url || '');
  const { toast } = useToast();

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      nombres: member.nombres || '',
      apellidos: member.apellidos || '',
      cargo: member.cargo || '',
      fecha_nacimiento: member.fecha_nacimiento || '',
      telefono: member.telefono || '',
      celular: member.celular || '',
      email: member.email || '',
      direccion: member.direccion || '',
      referencias: member.referencias || '',
      grupo: member.grupo || '',
      persona_reporte: member.persona_reporte || '',
      voz_instrumento: member.voz_instrumento || '',
      tipo_sangre: member.tipo_sangre || '',
      contacto_emergencia: member.contacto_emergencia || '',
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

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;

    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${member.id}.${fileExt}`;

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
      let photoUrl = member.photo_url;

      // Upload new photo if provided
      if (photoFile) {
        try {
          photoUrl = await uploadPhoto();
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
          // Don't fail the entire operation if photo upload fails
        }
      }

      // Update member
      const { error: updateError } = await supabase
        .from('members')
        .update({
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
          photo_url: photoUrl,
        })
        .eq('id', member.id);

      if (updateError) throw updateError;

      toast({
        title: "Éxito",
        description: "Integrante actualizado correctamente",
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el integrante",
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
    <div className="space-y-6 mt-6">
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
                  accept="image/*"
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                Actualizando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Actualizar Integrante
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EditMemberForm;
