import { Truck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  hasFilters: boolean;
  onAddClick?: () => void;
}

/**
 * Komponent wyświetlający komunikat gdy lista pojazdów jest pusta
 *
 * Warianty:
 * - Brak filtrów: Brak pojazdów w systemie (pokaż CTA do dodania)
 * - Z filtrami: Brak wyników po filtrowaniu (pokaż CTA do wyczyszczenia filtrów)
 */
export function EmptyState({ hasFilters, onAddClick }: EmptyStateProps) {
  if (!hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
          <Truck className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Brak pojazdów</h3>
        <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
          Nie masz jeszcze żadnych pojazdów w systemie. Dodaj pierwszy pojazd, aby móc zarządzać flotą.
        </p>
        {onAddClick && (
          <Button onClick={onAddClick} size="lg">
            <Truck className="mr-2 h-4 w-4" />
            Dodaj pierwszy pojazd
          </Button>
        )}
      </div>
    );
  }

  // Z filtrami - brak wyników
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Brak wyników</h3>
      <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
        Nie znaleziono pojazdów spełniających wybrane kryteria. Spróbuj zmienić filtry lub wyszukiwane frazy.
      </p>
    </div>
  );
}
