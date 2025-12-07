import { Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  variant: 'no-drivers' | 'no-results';
  onAddClick?: () => void;
  onClearFilters?: () => void;
}

/**
 * Komponent wyświetlający komunikat gdy lista kierowców jest pusta
 * 
 * Warianty:
 * - no-drivers: Brak kierowców w systemie (pokaż CTA do dodania)
 * - no-results: Brak wyników po filtrowaniu (pokaż CTA do wyczyszczenia filtrów)
 */
export function EmptyState({ variant, onAddClick, onClearFilters }: EmptyStateProps) {
  if (variant === 'no-drivers') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
          <Users className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Brak kierowców
        </h3>
        <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
          Nie masz jeszcze żadnych kierowców w systemie. Dodaj pierwszego kierowcę, aby móc
          zarządzać raportami.
        </p>
        {onAddClick && (
          <Button onClick={onAddClick} size="lg">
            <Users className="mr-2 h-4 w-4" />
            Dodaj pierwszego kierowcę
          </Button>
        )}
      </div>
    );
  }

  // variant === 'no-results'
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Brak wyników
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
        Nie znaleziono kierowców spełniających wybrane kryteria. Spróbuj zmienić filtry lub
        wyszukiwane frazy.
      </p>
      {onClearFilters && (
        <Button onClick={onClearFilters} variant="outline">
          Wyczyść filtry
        </Button>
      )}
    </div>
  );
}



