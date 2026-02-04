import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { UserMinus, Plus, Clock, CheckCircle, XCircle, List } from 'lucide-react';
import MemberLeavesList from './MemberLeavesList';
import MemberLeaveForm from './MemberLeaveForm';
import { usePermissions } from '@/hooks/usePermissions';

const MemberLeavesTab: React.FC = () => {
  const { isAdmin } = usePermissions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  return (
    <div className="space-y-6">
      {/* Header con botón de crear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
            <UserMinus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Gestión de Licencias</h2>
            <p className="text-sm text-gray-600">
              Administra las licencias e inactividades de los integrantes
            </p>
          </div>
        </div>

        {isAdmin && (
          <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nueva Licencia
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Crear Nueva Licencia</SheetTitle>
                <SheetDescription>
                  Asigna una licencia o inactividad a un integrante del ministerio
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <MemberLeaveForm
                  onSuccess={() => setIsFormOpen(false)}
                  onCancel={() => setIsFormOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Tabs para diferentes vistas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Activas</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Pendientes</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Finalizadas</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Todas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
              <CardTitle className="text-amber-800">Licencias Activas</CardTitle>
              <CardDescription className="text-amber-600">
                Integrantes actualmente en licencia o inactivos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <MemberLeavesList showOnlyActive />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="text-blue-800">Solicitudes Pendientes</CardTitle>
              <CardDescription className="text-blue-600">
                Solicitudes de licencia que requieren aprobación
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <PendingLeavesView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="text-green-800">Licencias Finalizadas</CardTitle>
              <CardDescription className="text-green-600">
                Historial de licencias completadas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <CompletedLeavesView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
              <CardTitle className="text-gray-800">Todas las Licencias</CardTitle>
              <CardDescription className="text-gray-600">
                Vista completa del historial de licencias
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <MemberLeavesList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Componente para licencias pendientes
const PendingLeavesView: React.FC = () => {
  return <FilteredLeavesList status="pendiente" />;
};

// Componente para licencias finalizadas
const CompletedLeavesView: React.FC = () => {
  return <FilteredLeavesList status="finalizada" />;
};

// Componente auxiliar para filtrar por estado
import { useMemberLeaves, LeaveStatus } from '@/hooks/useMemberLeaves';

const FilteredLeavesList: React.FC<{ status: LeaveStatus }> = ({ status }) => {
  const { leaves, loading } = useMemberLeaves();

  const filteredLeaves = leaves.filter((l) => l.status === status);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (filteredLeaves.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay licencias en este estado
      </div>
    );
  }

  return <MemberLeavesList />;
};

export default MemberLeavesTab;
