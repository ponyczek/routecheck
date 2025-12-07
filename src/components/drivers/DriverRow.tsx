import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { RowActionsMenu } from './RowActionsMenu';
import { formatDate } from '@/lib/utils/date';
import type { DriverDTO } from '@/types';

interface DriverRowProps {
  driver: DriverDTO;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

/**
 * Pojedynczy wiersz tabeli kierowców
 * - Wyświetla: nazwę, email, strefę czasową, status, datę dodania
 * - Menu akcji po prawej stronie
 * - Oznaczenie usuniętych kierowców (deletedAt !== null)
 */
export function DriverRow({ driver, onEdit, onToggleActive, onDelete }: DriverRowProps) {
  const isDeleted = driver.deletedAt !== null;

  return (
    <TableRow className={isDeleted ? 'opacity-60' : ''}>
      {/* Imię i nazwisko */}
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {driver.name}
          {isDeleted && (
            <Badge variant="outline" className="border-gray-400 text-gray-600">
              Usunięty
            </Badge>
          )}
        </div>
      </TableCell>

      {/* E-mail */}
      <TableCell className="text-muted-foreground">{driver.email}</TableCell>

      {/* Strefa czasowa */}
      <TableCell className="text-muted-foreground">{driver.timezone}</TableCell>

      {/* Status aktywności */}
      <TableCell>
        <StatusBadge isActive={driver.isActive} />
      </TableCell>

      {/* Data dodania */}
      <TableCell className="text-muted-foreground">
        {formatDate(driver.createdAt, 'dd MMM yyyy')}
      </TableCell>

      {/* Akcje */}
      <TableCell>
        {!isDeleted ? (
          <RowActionsMenu
            driver={driver}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
