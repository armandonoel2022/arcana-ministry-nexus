import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, UserCheck, CheckCircle, XCircle } from "lucide-react";

interface ServiceActionsMenuProps {
  service: {
    id: string;
    is_confirmed: boolean;
    leader: string;
  };
  currentUser?: string;
  onToggleConfirmation: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  onRequestDirectorChange: (id: string) => void;
}

const ServiceActionsMenu: React.FC<ServiceActionsMenuProps> = ({
  service,
  currentUser,
  onToggleConfirmation,
  onDelete,
  onRequestDirectorChange
}) => {
  const isMyService = currentUser && service.leader?.toLowerCase().includes(currentUser.toLowerCase());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onToggleConfirmation(service.id, service.is_confirmed)}>
          {service.is_confirmed ? (
            <>
              <XCircle className="h-4 w-4 mr-2" />
              Quitar Confirmación
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Servicio
            </>
          )}
        </DropdownMenuItem>
        
        {isMyService && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRequestDirectorChange(service.id)}>
              <UserCheck className="h-4 w-4 mr-2" />
              Solicitar Reemplazo
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(service.id)} className="text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar Servicio
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ServiceActionsMenu;
