import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { AssignmentViewModel } from "@/lib/assignments/assignmentTypes";
import type { AssignmentDTO } from "@/types";

interface AssignmentRowProps {
  assignment: AssignmentViewModel;
  onEdit: (assignment: AssignmentDTO) => void;
  onDelete: (assignment: AssignmentDTO) => void;
}

/**
 * AssignmentRow
 *
 * Pojedynczy wiersz tabeli reprezentujący jedno przypisanie kierowca-pojazd.
 * Zawiera komórki z danymi oraz menu akcji (Edytuj, Usuń).
 */
export function AssignmentRow({ assignment, onEdit, onDelete }: AssignmentRowProps) {
  const { assignment: assignmentData, driverName, vehicleRegistration, status, daysRemaining } = assignment;

  // Status badge variants
  const statusConfig = {
    active: {
      variant: "default" as const,
      label: "Aktywne",
    },
    upcoming: {
      variant: "secondary" as const,
      label: "Przyszłe",
    },
    completed: {
      variant: "outline" as const,
      label: "Zakończone",
    },
  };

  const statusInfo = statusConfig[status];

  // Format dates
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: pl });
  };

  return (
    <TableRow>
      {/* Driver Name */}
      <TableCell className="font-medium">{driverName}</TableCell>

      {/* Vehicle Registration */}
      <TableCell>{vehicleRegistration}</TableCell>

      {/* Start Date */}
      <TableCell>{formatDate(assignmentData.startDate)}</TableCell>

      {/* End Date */}
      <TableCell>
        {assignmentData.endDate ? (
          <div className="flex flex-col">
            <span>{formatDate(assignmentData.endDate)}</span>
            {daysRemaining !== null && daysRemaining > 0 && (
              <span className="text-xs text-muted-foreground">
                ({daysRemaining} {daysRemaining === 1 ? "dzień" : "dni"} pozostało)
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground italic">Bezterminowe</span>
        )}
      </TableCell>

      {/* Status Badge */}
      <TableCell>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </TableCell>

      {/* Actions Menu */}
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Otwórz menu akcji">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(assignmentData)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(assignmentData)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
