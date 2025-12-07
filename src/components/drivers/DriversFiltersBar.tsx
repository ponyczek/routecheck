import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useDebouncedValue } from '@/lib/drivers/useDebouncedValue';
import type { DriversFiltersState } from '@/lib/drivers/types';

interface DriversFiltersBarProps {
  filters: DriversFiltersState;
  onFiltersChange: (filters: Partial<DriversFiltersState>) => void;
  resultsCount?: number;
}

/**
 * Pasek filtrów dla listy kierowców
 * - Wyszukiwarka (debounced 300ms)
 * - Filtr aktywności (Wszyscy/Aktywni/Nieaktywni)
 * - Toggle "Pokaż usuniętych"
 * - Sortowanie (Nazwa A-Z, Nazwa Z-A, Najnowsi, Najstarsi)
 */
export function DriversFiltersBar({
  filters,
  onFiltersChange,
  resultsCount,
}: DriversFiltersBarProps) {
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
    if (value === 'all') {
      onFiltersChange({ isActive: undefined });
    } else if (value === 'active') {
      onFiltersChange({ isActive: true });
    } else if (value === 'inactive') {
      onFiltersChange({ isActive: false });
    }
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortDir] = value.split('-') as [
      'name' | 'createdAt',
      'asc' | 'desc',
    ];
    onFiltersChange({ sortBy, sortDir });
  };

  const activeFilterValue =
    filters.isActive === undefined
      ? 'all'
      : filters.isActive
        ? 'active'
        : 'inactive';

  const sortValue = `${filters.sortBy}-${filters.sortDir}`;

  return (
    <div className="space-y-4">
      {/* Wyszukiwarka */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj kierowcy po imieniu lub emailu..."
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
                <SelectItem value="all">Wszyscy</SelectItem>
                <SelectItem value="active">Aktywni</SelectItem>
                <SelectItem value="inactive">Nieaktywni</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggle "Pokaż usuniętych" */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-deleted"
              checked={filters.includeDeleted}
              onCheckedChange={(checked) =>
                onFiltersChange({ includeDeleted: checked === true })
              }
            />
            <Label
              htmlFor="show-deleted"
              className="cursor-pointer text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Pokaż usuniętych
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
                <SelectItem value="name-asc">Nazwa A-Z</SelectItem>
                <SelectItem value="name-desc">Nazwa Z-A</SelectItem>
                <SelectItem value="createdAt-desc">Najnowsi</SelectItem>
                <SelectItem value="createdAt-asc">Najstarsi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}



