import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { RowActionsMenu } from "./RowActionsMenu";
import { formatDate } from "@/lib/utils/date";
import type { VehicleDTO } from "@/types";

interface VehicleRowProps {
  vehicle: VehicleDTO;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

/**
 * Pojedynczy wiersz tabeli pojazdów
 * - Wyświetla: numer rejestracyjny, VIN, status, datę utworzenia
 * - Menu akcji po prawej stronie
 * - Oznaczenie usuniętych pojazdów (deletedAt !== null)
 */
export function VehicleRow({ vehicle, onEdit, onToggleActive, onDelete }: VehicleRowProps) {
  const isDeleted = vehicle.deletedAt !== null;

  return (
    <TableRow className={isDeleted ? "opacity-60" : ""}>
      {/* Numer rejestracyjny */}
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {vehicle.registrationNumber}
          {isDeleted && (
            <Badge variant="outline" className="border-gray-400 text-gray-600">
              Usunięty
            </Badge>
          )}
        </div>
      </TableCell>

      {/* VIN */}
      <TableCell className="text-muted-foreground">{vehicle.vin || "-"}</TableCell>

      {/* Status aktywności */}
      <TableCell>
        <StatusBadge vehicle={vehicle} />
      </TableCell>

      {/* Data utworzenia */}
      <TableCell className="text-muted-foreground">{formatDate(vehicle.createdAt, "dd MMM yyyy")}</TableCell>

      {/* Akcje */}
      <TableCell>
        {!isDeleted ? (
          <RowActionsMenu vehicle={vehicle} onEdit={onEdit} onToggleActive={onToggleActive} onDelete={onDelete} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
