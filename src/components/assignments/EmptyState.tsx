import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

interface EmptyStateProps {
  onAddClick: () => void;
  hasFilters?: boolean;
}

/**
 * EmptyState
 *
 * Komponent wyświetlany gdy lista przypisań jest pusta.
 * Różnicuje komunikaty w zależności od tego, czy są aktywne filtry.
 */
export function EmptyState({ onAddClick, hasFilters = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-card">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <Calendar className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold mb-2">{hasFilters ? "Brak wyników" : "Brak przypisań"}</h3>

      <p className="text-muted-foreground text-center mb-6 max-w-md">
        {hasFilters
          ? "Nie znaleziono przypisań pasujących do wybranych filtrów. Spróbuj zmienić kryteria wyszukiwania."
          : "Nie masz jeszcze żadnych przypisań kierowca-pojazd. Dodaj pierwsze przypisanie, aby rozpocząć zarządzanie harmonogramem."}
      </p>

      {!hasFilters && (
        <Button onClick={onAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj pierwsze przypisanie
        </Button>
      )}
    </div>
  );
}
