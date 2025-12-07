import { Badge } from '@/components/ui/badge';
import { Check, X, Trash2 } from 'lucide-react';
import type { VehicleDTO } from '@/types';

interface StatusBadgeProps {
  vehicle: VehicleDTO;
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * Komponent wyświetlający status pojazdu
 * - Aktywny: zielony badge z ikoną check
 * - Nieaktywny: szary badge z ikoną X
 * - Usunięty: czerwony badge z ikoną Trash
 */
export function StatusBadge({ vehicle, variant = 'default', className }: StatusBadgeProps) {
  const isCompact = variant === 'compact';
  const isDeleted = vehicle.deletedAt !== null;

  if (isDeleted) {
    return (
      <Badge
        variant="destructive"
        className={`${className || ''}`}
      >
        {!isCompact && <Trash2 className="mr-1 h-3 w-3" />}
        Usunięty
      </Badge>
    );
  }

  if (vehicle.isActive) {
    return (
      <Badge
        variant="outline"
        className={`border-green-600 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-950 dark:text-green-400 ${className || ''}`}
      >
        {!isCompact && <Check className="mr-1 h-3 w-3" />}
        Aktywny
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`border-gray-400 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400 ${className || ''}`}
    >
      {!isCompact && <X className="mr-1 h-3 w-3" />}
      Nieaktywny
    </Badge>
  );
}


