import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { VehicleRow } from "./VehicleRow";
import type { VehicleDTO } from "@/types";

interface VehiclesTableProps {
  vehicles: VehicleDTO[];
  sortBy: "registrationNumber" | "createdAt";
  sortDir: "asc" | "desc";
  onSortChange: (sortBy: "registrationNumber" | "createdAt", sortDir: "asc" | "desc") => void;
  onEditClick: (vehicle: VehicleDTO) => void;
  onToggleActiveClick: (vehicle: VehicleDTO) => void;
  onDeleteClick: (vehicle: VehicleDTO) => void;
  pagination: {
    hasNext: boolean;
    hasPrev: boolean;
    onNext: () => void;
    onPrev: () => void;
  };
}

/**
 * Tabela pojazdów (widok desktop ≥768px)
 * - Sortowalne kolumny (registrationNumber, createdAt)
 * - Paginacja cursorowa (Prev/Next)
 * - Menu akcji w każdym wierszu
 */
export function VehiclesTable({
  vehicles,
  sortBy,
  sortDir,
  onSortChange,
  onEditClick,
  onToggleActiveClick,
  onDeleteClick,
  pagination,
}: VehiclesTableProps) {
  const handleSort = (column: "registrationNumber" | "createdAt") => {
    if (sortBy === column) {
      // Toggle direction
      onSortChange(column, sortDir === "asc" ? "desc" : "asc");
    } else {
      // New column, default asc
      onSortChange(column, "asc");
    }
  };

  const getSortIcon = (column: "registrationNumber" | "createdAt") => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDir === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("registrationNumber")}
                  className="-ml-4 h-auto p-2 hover:bg-transparent"
                >
                  Numer rejestracyjny
                  {getSortIcon("registrationNumber")}
                </Button>
              </TableHead>
              <TableHead>VIN</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("createdAt")}
                  className="-ml-4 h-auto p-2 hover:bg-transparent"
                >
                  Data utworzenia
                  {getSortIcon("createdAt")}
                </Button>
              </TableHead>
              <TableHead className="w-[70px]">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Brak pojazdów do wyświetlenia.
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle) => (
                <VehicleRow
                  key={vehicle.uuid}
                  vehicle={vehicle}
                  onEdit={() => onEditClick(vehicle)}
                  onToggleActive={() => onToggleActiveClick(vehicle)}
                  onDelete={() => onDeleteClick(vehicle)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginacja */}
      {(pagination.hasNext || pagination.hasPrev) && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {vehicles.length > 0 && `Wyświetlono ${vehicles.length} pojazdów`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={pagination.onPrev} disabled={!pagination.hasPrev}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Poprzednia
            </Button>
            <Button variant="outline" size="sm" onClick={pagination.onNext} disabled={!pagination.hasNext}>
              Następna
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
