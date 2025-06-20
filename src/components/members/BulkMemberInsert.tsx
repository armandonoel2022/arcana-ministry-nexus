
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Upload, CheckCircle } from 'lucide-react';
import { insertAllMembers } from '@/utils/addMembersData';

interface BulkMemberInsertProps {
  onSuccess?: () => void;
}

const BulkMemberInsert = ({ onSuccess }: BulkMemberInsertProps) => {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();

  const handleInsertMembers = async () => {
    setLoading(true);
    try {
      const result = await insertAllMembers();
      
      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: `Se han agregado ${result.count} integrantes correctamente`,
        });
        setCompleted(true);
        onSuccess?.();
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudieron agregar los integrantes. Verifica la consola para más detalles.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ¡Integrantes Agregados!
            </h3>
            <p className="text-green-700">
              Todos los integrantes han sido agregados exitosamente. Ahora puedes subir sus fotos individualmente desde la lista de integrantes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Agregar Lista de Integrantes
        </CardTitle>
        <CardDescription>
          Esta función agregará todos los integrantes proporcionados a la base de datos. Las fotos se pueden subir posteriormente de forma individual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">¿Qué se va a agregar?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 51 integrantes del ministerio</li>
              <li>• Información completa de contacto</li>
              <li>• Cargos y grupos asignados</li>
              <li>• Datos de emergencia y referencias</li>
            </ul>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-2">Nota importante:</h4>
            <p className="text-sm text-amber-700">
              Las fotos de los integrantes se pueden subir posteriormente desde la lista de integrantes, editando cada perfil individualmente.
            </p>
          </div>

          <Button 
            onClick={handleInsertMembers}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Agregando integrantes...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Agregar Todos los Integrantes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkMemberInsert;
