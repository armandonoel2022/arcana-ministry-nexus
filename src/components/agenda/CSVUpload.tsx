
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
        'Grupo de Aleida',
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

    // Add BOM for UTF-8 encoding to ensure proper character display
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_agenda_ministerial.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            resolve([]);
            return;
          }

          // Parse CSV with better handling of quoted fields and special characters
          const parseCSVLine = (line: string): string[] => {
            const result = [];
            let current = '';
            let inQuotes = false;
            let i = 0;

            while (i < line.length) {
              const char = line[i];
              const nextChar = line[i + 1];

              if (char === '"') {
                if (inQuotes && nextChar === '"') {
                  // Handle escaped quotes
                  current += '"';
                  i += 2;
                } else {
                  // Toggle quote state
                  inQuotes = !inQuotes;
                  i++;
                }
              } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current.trim());
                current = '';
                i++;
              } else {
                current += char;
                i++;
              }
            }

            // Add the last field
            result.push(current.trim());
            return result;
          };

          const headers = parseCSVLine(lines[0]);
          const data = [];

          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length >= headers.length) {
              const row: any = {};
              headers.forEach((header, index) => {
                // Clean and normalize the data
                let value = values[index] || '';
                // Remove extra quotes if present
                value = value.replace(/^"(.*)"$/, '$1');
                // Normalize whitespace
                value = value.trim();
                row[header] = value;
              });
              data.push(row);
            }
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      
      // Read file as UTF-8 text
      reader.readAsText(file, 'UTF-8');
    });
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
    
    // Mapeo de nombres genéricos a nombres reales (con manejo de acentos)
    const groupNameMapping = {
      'alpha': 'Grupo de Aleida',
      'beta': 'Grupo de Massy', 
      'gamma': 'Grupo de Keyla',
      'grupo alpha': 'Grupo de Aleida',
      'grupo beta': 'Grupo de Massy',
      'grupo gamma': 'Grupo de Keyla',
      'grupo de aleida': 'Grupo de Aleida',
      'grupo de massy': 'Grupo de Massy',
      'grupo de keyla': 'Grupo de Keyla',
      // Versiones sin acentos
      'aleida': 'Grupo de Aleida',
      'massy': 'Grupo de Massy',
      'keyla': 'Grupo de Keyla'
    };

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

        // Find group ID with mapping (normalize for accent handling)
        let groupName = row['Grupo Asignado']?.toLowerCase().trim();
        let groupId = null;

        if (groupName) {
          // Normalize accents and special characters for comparison
          const normalizeString = (str: string) => {
            return str
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase();
          };

          const normalizedGroupName = normalizeString(groupName);
          
          // Try direct mapping first
          const mappedName = groupNameMapping[groupName] || groupNameMapping[normalizedGroupName];
          if (mappedName) {
            groupId = groupMap.get(mappedName.toLowerCase());
          } else {
            // Try finding by normalized name in existing groups
            for (const [existingName, id] of groupMap.entries()) {
              if (normalizeString(existingName) === normalizedGroupName) {
                groupId = id;
                break;
              }
            }
          }
        }

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
      const csvData = await parseCSV(file);

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
            <li>• Los nombres de grupos pueden ser: "Grupo de Aleida", "Grupo de Massy", "Grupo de Keyla"</li>
            <li>• También acepta nombres genéricos: "Alpha", "Beta", "Gamma" que se mapearán automáticamente</li>
            <li>• El orden del mes debe ser un número (1, 2, 3, 4...)</li>
            <li>• Los tipos de servicio válidos son: regular, especial, conferencia, evento</li>
            <li>• El archivo debe estar guardado con codificación UTF-8 para manejar acentos correctamente</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
