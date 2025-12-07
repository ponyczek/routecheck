import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useDebouncedValue } from "@/lib/vehicles/useDebouncedValue";
import type { VehiclesFiltersState } from "@/lib/vehicles/types";

interface VehiclesFiltersBarProps {
  filters: VehiclesFiltersState;
  onFiltersChange: (filters: Partial<VehiclesFiltersState>) => void;
  resultsCount?: number;
}

/**
 * Pasek filtrów dla listy pojazdów
 * - Wyszukiwarka (debounced 300ms)
 * - Filtr aktywności (Wszystkie/Aktywne/Nieaktywne)
 * - Toggle "Pokaż usunięte"
 * - Sortowanie (Numer rejestracyjny A-Z, Z-A, Najnowsze, Najstarsze)
 */
export function VehiclesFiltersBar({ filters, onFiltersChange, resultsCount }: VehiclesFiltersBarProps) {
  // Local state dla wyszukiwarki (bez debounce)
  const [searchValue, setSearchValue] = useState(filters.q);
  // Debounced wartość do wysłania do API
  const debouncedSearch = useDebouncedValue(searchValue, 300);

  // Sync debounced search z filters
  useEffect(() => {
    if (debouncedSearch !== filters.q) {
      onFiltersChange({ q: debouncedSearch });
    }
  }, [debouncedSearch]);

  // Sync external filters.q changes with local state
  useEffect(() => {
    if (filters.q !== searchValue && filters.q !== debouncedSearch) {
      setSearchValue(filters.q);
    }
  }, [filters.q]);

  const handleActiveFilterChange = (value: string) => {
    if (value === "all") {
      onFiltersChange({ isActive: undefined });
    } else if (value === "active") {
      onFiltersChange({ isActive: true });
    } else if (value === "inactive") {
      onFiltersChange({ isActive: false });
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortDir] = value.split("-") as ["registrationNumber" | "createdAt", "asc" | "desc"];
    onFiltersChange({ sortBy, sortDir });
  };

  const activeFilterValue = filters.isActive === undefined ? "all" : filters.isActive ? "active" : "inactive";

  const sortValue = `${filters.sortBy}-${filters.sortDir}`;

  return (
    <div className="space-y-4">
      {/* Wyszukiwarka */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj pojazdu po numerze rejestracyjnym lub VIN..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtry i sortowanie */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {/* Lewy panel: Filtry */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Filtr aktywności */}
          <div className="space-y-2">
            <Label htmlFor="active-filter" className="text-sm">
              Status
            </Label>
            <Select value={activeFilterValue} onValueChange={handleActiveFilterChange}>
              <SelectTrigger id="active-filter" className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="active">Aktywne</SelectItem>
                <SelectItem value="inactive">Nieaktywne</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggle "Pokaż usunięte" */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-deleted"
              checked={filters.includeDeleted}
              onCheckedChange={(checked) => onFiltersChange({ includeDeleted: checked === true })}
            />
            <Label
              htmlFor="show-deleted"
              className="cursor-pointer text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Pokaż usunięte
            </Label>
          </div>
        </div>

        {/* Prawy panel: Sortowanie + liczba wyników */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Liczba wyników */}
          {resultsCount !== undefined && (
            <div className="text-sm text-muted-foreground">
              Znaleziono: <span className="font-medium">{resultsCount}</span>
            </div>
          )}

          {/* Sortowanie */}
          <div className="space-y-2">
            <Label htmlFor="sort" className="text-sm">
              Sortuj
            </Label>
            <Select value={sortValue} onValueChange={handleSortChange}>
              <SelectTrigger id="sort" className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registrationNumber-asc">Numer rejestracyjny A-Z</SelectItem>
                <SelectItem value="registrationNumber-desc">Numer rejestracyjny Z-A</SelectItem>
                <SelectItem value="createdAt-desc">Najnowsze</SelectItem>
                <SelectItem value="createdAt-asc">Najstarsze</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
