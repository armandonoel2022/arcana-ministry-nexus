
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MembersCSVUploadProps {
  onSuccess?: () => void;
}

const MembersCSVUpload = ({ onSuccess }: MembersCSVUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = [
      'nombres',
      'apellidos', 
      'cargo',
      'fecha_nacimiento',
      'telefono',
      'celular',
      'email',
      'direccion',
      'referencias',
      'grupo',
      'persona_reporte',
      'voz_instrumento',
      'tipo_sangre',
      'contacto_emergencia'
    ];

    const csvContent = headers.join(',') + '\n' +
      'Juan,Pérez García,corista,1990-05-15,123456789,987654321,juan.perez@email.com,"Calle 123 #45-67",Excelente corista,coristas,Director de Alabanza,Tenor,O+,"María Pérez - 555-1234"';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'plantilla_integrantes.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || null;
        });
        rows.push(row);
      }
    }

    return rows;
  };

  const validateMember = (member: any, index: number): string[] => {
    const errors: string[] = [];
    
    if (!member.nombres || member.nombres.trim() === '') {
      errors.push(`Fila ${index + 2}: Los nombres son requeridos`);
    }
    
    if (!member.apellidos || member.apellidos.trim() === '') {
      errors.push(`Fila ${index + 2}: Los apellidos son requeridos`);
    }
    
    if (!member.cargo || member.cargo.trim() === '') {
      errors.push(`Fila ${index + 2}: El cargo es requerido`);
    }

    const validRoles = [
      'pastor', 'pastora', 'director_alabanza', 'directora_alabanza',
      'corista', 'directora_danza', 'director_multimedia', 'camarografo',
      'camarógrafa', 'encargado_piso', 'encargada_piso', 'musico',
      'sonidista', 'encargado_luces', 'encargado_proyeccion', 'encargado_streaming'
    ];

    if (member.cargo && !validRoles.includes(member.cargo)) {
      errors.push(`Fila ${index + 2}: Cargo inválido "${member.cargo}"`);
    }

    const validGroups = [
      'directiva', 'directores_alabanza', 'coristas', 'multimedia',
      'danza', 'teatro', 'piso', ''
    ];

    if (member.grupo && !validGroups.includes(member.grupo)) {
      errors.push(`Fila ${index + 2}: Grupo inválido "${member.grupo}"`);
    }

    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''];

    if (member.tipo_sangre && !validBloodTypes.includes(member.tipo_sangre)) {
      errors.push(`Fila ${index + 2}: Tipo de sangre inválido "${member.tipo_sangre}"`);
    }

    if (member.email && member.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(member.email)) {
        errors.push(`Fila ${index + 2}: Email inválido "${member.email}"`);
      }
    }

    return errors;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setResults(null);
      } else {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo CSV válido",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo CSV",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      const text = await file.text();
      const members = parseCSV(text);

      if (members.length === 0) {
        throw new Error('El archivo CSV está vacío o no tiene el formato correcto');
      }

      // Validate all members first
      const validationErrors: string[] = [];
      members.forEach((member, index) => {
        const memberErrors = validateMember(member, index);
        validationErrors.push(...memberErrors);
      });

      if (validationErrors.length > 0) {
        setResults({ success: 0, errors: validationErrors });
        return;
      }

      // Insert members
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        try {
          const { error } = await supabase.from('members').insert([{
            nombres: member.nombres?.trim(),
            apellidos: member.apellidos?.trim(),
            cargo: member.cargo?.trim(),
            fecha_nacimiento: member.fecha_nacimiento?.trim() || null,
            telefono: member.telefono?.trim() || null,
            celular: member.celular?.trim() || null,
            email: member.email?.trim() || null,
            direccion: member.direccion?.trim() || null,
            referencias: member.referencias?.trim() || null,
            grupo: member.grupo?.trim() || null,
            persona_reporte: member.persona_reporte?.trim() || null,
            voz_instrumento: member.voz_instrumento?.trim() || null,
            tipo_sangre: member.tipo_sangre?.trim() || null,
            contacto_emergencia: member.contacto_emergencia?.trim() || null,
          }]);

          if (error) {
            errors.push(`Fila ${i + 2}: ${error.message}`);
          } else {
            successCount++;
          }
        } catch (error) {
          errors.push(`Fila ${i + 2}: Error al insertar - ${error}`);
        }
      }

      setResults({ success: successCount, errors });

      if (successCount > 0) {
        toast({
          title: "Carga completada",
          description: `Se importaron ${successCount} integrantes exitosamente`,
        });
        onSuccess?.();
      }

    } catch (error) {
      console.error('Error processing CSV:', error);
      toast({
        title: "Error",
        description: "Error al procesar el archivo CSV",
        variant: "destructive",
      });
      setResults({ success: 0, errors: [String(error)] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Carga Masiva de Integrantes
          </CardTitle>
          <CardDescription>
            Importa múltiples integrantes desde un archivo CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Descarga primero la plantilla CSV, complétala con los datos de los integrantes y luego súbela aquí.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar Plantilla CSV
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">Archivo CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {file && (
              <p className="text-sm text-gray-600">
                Archivo seleccionado: {file.name}
              </p>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Cargar Integrantes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Resultados de la Importación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Integrantes importados exitosamente:</span>
                <span className="text-green-600 font-bold">{results.success}</span>
              </div>

              {results.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Errores encontrados:</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-64 overflow-y-auto">
                    {results.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700 mb-1">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Formato del CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Campos requeridos:</strong> nombres, apellidos, cargo</p>
            <p><strong>Campos opcionales:</strong> fecha_nacimiento, telefono, celular, email, direccion, referencias, grupo, persona_reporte, voz_instrumento, tipo_sangre, contacto_emergencia</p>
            
            <div className="mt-4">
              <p className="font-medium mb-2">Valores válidos para campos específicos:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>cargo:</strong> pastor, pastora, director_alabanza, directora_alabanza, corista, directora_danza, director_multimedia, camarografo, camarógrafa, encargado_piso, encargada_piso, musico, sonidista, encargado_luces, encargado_proyeccion, encargado_streaming</li>
                <li><strong>grupo:</strong> directiva, directores_alabanza, coristas, multimedia, danza, teatro, piso</li>
                <li><strong>tipo_sangre:</strong> A+, A-, B+, B-, AB+, AB-, O+, O-</li>
                <li><strong>fecha_nacimiento:</strong> Formato YYYY-MM-DD (ej: 1990-05-15)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembersCSVUpload;
