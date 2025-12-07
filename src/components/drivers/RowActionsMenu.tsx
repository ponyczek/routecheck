import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, MoreVertical, Power, Trash2 } from "lucide-react";
import type { DriverDTO } from "@/types";

interface RowActionsMenuProps {
  driver: DriverDTO;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

/**
 * Dropdown menu z akcjami dla pojedynczego kierowcy
 * - Edytuj (ikona Edit)
 * - Aktywuj/Dezaktywuj (ikona Power)
 * - Usuń (ikona Trash, kolor czerwony)
 */
export function RowActionsMenu({ driver, onEdit, onToggleActive, onDelete }: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Otwórz menu akcji dla {driver.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edytuj
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleActive}>
          <Power className="mr-2 h-4 w-4" />
          {driver.isActive ? "Dezaktywuj" : "Aktywuj"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Usuń
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
