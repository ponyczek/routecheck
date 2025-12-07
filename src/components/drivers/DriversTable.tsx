import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DriverRow } from './DriverRow';
import type { DriverDTO } from '@/types';

interface DriversTableProps {
  drivers: DriverDTO[];
  sortBy: 'name' | 'createdAt';
  sortDir: 'asc' | 'desc';
  onSortChange: (sortBy: 'name' | 'createdAt', sortDir: 'asc' | 'desc') => void;
  onEditClick: (driver: DriverDTO) => void;
  onToggleActiveClick: (driver: DriverDTO) => void;
  onDeleteClick: (driver: DriverDTO) => void;
  pagination: {
    hasNext: boolean;
    hasPrev: boolean;
    onNext: () => void;
    onPrev: () => void;
  };
}

/**
 * Tabela kierowców (widok desktop ≥768px)
 * - Sortowalne kolumny (name, createdAt)
 * - Paginacja cursorowa (Prev/Next)
 * - Menu akcji w każdym wierszu
 */
export function DriversTable({
  drivers,
  sortBy,
  sortDir,
  onSortChange,
  onEditClick,
  onToggleActiveClick,
  onDeleteClick,
  pagination,
}: DriversTableProps) {
  const handleSort = (column: 'name' | 'createdAt') => {
    if (sortBy === column) {
      // Toggle direction
      onSortChange(column, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default asc
      onSortChange(column, 'asc');
    }
  };

  const getSortIcon = (column: 'name' | 'createdAt') => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
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
                  onClick={() => handleSort('name')}
                  className="-ml-4 h-auto p-2 hover:bg-transparent"
                >
                  Imię i nazwisko
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Strefa czasowa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('createdAt')}
                  className="-ml-4 h-auto p-2 hover:bg-transparent"
                >
                  Data dodania
                  {getSortIcon('createdAt')}
                </Button>
              </TableHead>
              <TableHead className="w-[70px]">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Brak kierowców do wyświetlenia.
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => (
                <DriverRow
                  key={driver.uuid}
                  driver={driver}
                  onEdit={() => onEditClick(driver)}
                  onToggleActive={() => onToggleActiveClick(driver)}
                  onDelete={() => onDeleteClick(driver)}
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
            {drivers.length > 0 && `Wyświetlono ${drivers.length} kierowców`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onPrev}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Poprzednia
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onNext}
              disabled={!pagination.hasNext}
            >
              Następna
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
