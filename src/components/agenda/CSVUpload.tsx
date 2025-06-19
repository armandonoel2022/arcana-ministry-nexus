
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CSVUploadProps {
  onSuccess: () => void;
}

export const CSVUpload: React.FC<CSVUploadProps> = ({ onSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);

  const downloadTemplate = () => {
    const headers = [
      'Dirige',
      'Fecha (DD/MM/YYYY)',
      'Orden del mes',
      'Grupo Asignado',
      'Servicio',
      'Tipo de Servicio',
      'Ubicación',
      'Actividad Especial',
      'Descansos de los coros',
      'Descripción',
      'Notas'
    ];

    const sampleData = [
      [
        'Juan Pérez',
        '07/01/2024',
        '1',
        'Grupo Jóvenes',
        'Servicio Dominical',
        'regular',
        'Templo Principal',
        'Oración especial',
        'Coro principal descansa',
        'Servicio de apertura del año',
        'Confirmar equipo de sonido'
      ]
    ];

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_agenda_ministerial.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length >= headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return data;
  };

  const processCSVData = async (data: any[]) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    // Get worship groups for mapping
    const { data: groups } = await supabase
      .from('worship_groups')
      .select('id, name')
      .eq('is_active', true);

    const groupMap = new Map();
    groups?.forEach(group => {
      groupMap.set(group.name.toLowerCase(), group.id);
    });

    const services = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Parse date (DD/MM/YYYY format)
        const dateParts = row['Fecha (DD/MM/YYYY)']?.split('/');
        if (!dateParts || dateParts.length !== 3) {
          throw new Error('Formato de fecha inválido. Use DD/MM/YYYY');
        }

        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
        const year = parseInt(dateParts[2]);
        const serviceDate = new Date(year, month, day);

        if (isNaN(serviceDate.getTime())) {
          throw new Error('Fecha inválida');
        }

        // Find group ID
        const groupName = row['Grupo Asignado']?.toLowerCase();
        const groupId = groupName ? groupMap.get(groupName) : null;

        // Get Spanish month name
        const monthName = format(serviceDate, 'MMMM', { locale: es });

        const service = {
          leader: row['Dirige'] || '',
          service_date: serviceDate.toISOString(),
          month_name: monthName,
          month_order: parseInt(row['Orden del mes']) || 1,
          assigned_group_id: groupId,
          title: row['Servicio'] || '',
          service_type: row['Tipo de Servicio'] || 'regular',
          location: row['Ubicación'] || 'Templo Principal',
          special_activity: row['Actividad Especial'] || null,
          choir_breaks: row['Descansos de los coros'] || null,
          description: row['Descripción'] || null,
          notes: row['Notas'] || null,
          created_by: user.user.id,
          is_confirmed: false,
        };

        services.push(service);
      } catch (error) {
        errors.push(`Fila ${i + 2}: ${error.message}`);
      }
    }

    return { services, errors };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor seleccione un archivo CSV');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const text = await file.text();
      const csvData = parseCSV(text);

      if (csvData.length === 0) {
        throw new Error('El archivo CSV está vacío o no tiene el formato correcto');
      }

      const { services, errors } = await processCSVData(csvData);

      if (services.length > 0) {
        const { error } = await supabase
          .from('services')
          .insert(services);

        if (error) throw error;
      }

      setUploadResult({
        success: services.length,
        errors: errors
      });

      if (services.length > 0) {
        toast.success(`${services.length} servicios cargados exitosamente`);
        onSuccess();
      }

      if (errors.length > 0) {
        toast.error(`${errors.length} filas tuvieron errores`);
      }

    } catch (error) {
      console.error('Error processing CSV:', error);
      toast.error('Error al procesar el archivo CSV');
      setUploadResult({
        success: 0,
        errors: [error.message]
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Descargar Plantilla
          </CardTitle>
          <CardDescription>
            Descargue la plantilla CSV con el formato correcto antes de cargar sus datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Descargar Plantilla CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Cargar Archivo CSV
          </CardTitle>
          <CardDescription>
            Seleccione el archivo CSV con los servicios para cargar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-file">Archivo CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="mt-1"
            />
          </div>

          {isUploading && (
            <div className="text-center text-gray-500">
              Procesando archivo...
            </div>
          )}

          {uploadResult && (
            <div className="space-y-4">
              {uploadResult.success > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ {uploadResult.success} servicios cargados exitosamente
                  </AlertDescription>
                </Alert>
              )}

              {uploadResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">
                      Errores encontrados ({uploadResult.errors.length}):
                    </div>
                    <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Formato del archivo CSV:</strong>
          <ul className="mt-2 text-sm space-y-1">
            <li>• Use el formato de fecha DD/MM/YYYY (ej: 07/01/2024)</li>
            <li>• Los nombres de grupos deben coincidir exactamente con los grupos existentes</li>
            <li>• El orden del mes debe ser un número (1, 2, 3, 4...)</li>
            <li>• Los tipos de servicio válidos son: regular, especial, conferencia, evento</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
