import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DriverCard } from './DriverCard';
import type { DriverDTO } from '@/types';

interface DriversCardListProps {
  drivers: DriverDTO[];
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
 * Lista kart kierowców (widok mobile <768px)
 * - Grid layout
 * - Paginacja cursorowa
 */
export function DriversCardList({
  drivers,
  onEditClick,
  onToggleActiveClick,
  onDeleteClick,
  pagination,
}: DriversCardListProps) {
  return (
    <div className="space-y-4">
      {/* Grid kart */}
      <div className="grid gap-4">
        {drivers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Brak kierowców do wyświetlenia.
          </div>
        ) : (
          drivers.map((driver) => (
            <DriverCard
              key={driver.uuid}
              driver={driver}
              onEdit={() => onEditClick(driver)}
              onToggleActive={() => onToggleActiveClick(driver)}
              onDelete={() => onDeleteClick(driver)}
            />
          ))
        )}
      </div>

      {/* Paginacja */}
      {(pagination.hasNext || pagination.hasPrev) && (
        <div className="flex flex-col gap-2">
          <div className="text-center text-sm text-muted-foreground">
            {drivers.length > 0 && `Wyświetlono ${drivers.length} kierowców`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onPrev}
              disabled={!pagination.hasPrev}
              className="flex-1"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Poprzednia
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onNext}
              disabled={!pagination.hasNext}
              className="flex-1"
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
