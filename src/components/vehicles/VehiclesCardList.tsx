import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { VehicleCard } from './VehicleCard';
import type { VehicleDTO } from '@/types';

interface VehiclesCardListProps {
  vehicles: VehicleDTO[];
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
 * Lista kart pojazdów (widok mobile <768px)
 * - Grid layout
 * - Paginacja cursorowa
 */
export function VehiclesCardList({
  vehicles,
  onEditClick,
  onToggleActiveClick,
  onDeleteClick,
  pagination,
}: VehiclesCardListProps) {
  return (
    <div className="space-y-4">
      {/* Grid kart */}
      <div className="grid gap-4">
        {vehicles.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Brak pojazdów do wyświetlenia.
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.uuid}
              vehicle={vehicle}
              onEdit={() => onEditClick(vehicle)}
              onToggleActive={() => onToggleActiveClick(vehicle)}
              onDelete={() => onDeleteClick(vehicle)}
            />
          ))
        )}
      </div>

      {/* Paginacja */}
      {(pagination.hasNext || pagination.hasPrev) && (
        <div className="flex flex-col gap-2">
          <div className="text-center text-sm text-muted-foreground">
            {vehicles.length > 0 && `Wyświetlono ${vehicles.length} pojazdów`}
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


