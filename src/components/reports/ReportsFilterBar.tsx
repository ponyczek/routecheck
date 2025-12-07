import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker, type DateRange } from "./DateRangePicker";
import { MultiSelect, type MultiSelectOption } from "./MultiSelect";
import { ActiveFiltersList } from "./ActiveFiltersList";
import type { ReportsFiltersState } from "@/lib/reports/types";
import type { ReportRiskLevel, ReportRouteStatus } from "@/types";
import { useDriversList } from "@/lib/drivers";

interface ReportsFilterBarProps {
  filters: ReportsFiltersState;
  onFilterChange: (newFilters: Partial<ReportsFiltersState>) => void;
  onResetFilters: () => void;
}

/**
 * Filter bar for reports view
 * Contains:
 * - Date range picker
 * - Search input (debounced)
 * - Risk level multi-select
 * - Route status multi-select
 * - Driver multi-select (TODO: fetch drivers list)
 * - Active filters list with chips
 */
export function ReportsFilterBar({ filters, onFilterChange, onResetFilters }: ReportsFilterBarProps) {
  const [searchQuery, setSearchQuery] = React.useState(filters.q || "");
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Fetch active drivers for filter
  const { data: driversData } = useDriversList({
    isActive: true,
    includeDeleted: false,
    limit: 100,
    sortBy: "name",
    sortDir: "asc",
  });

  const drivers = driversData?.items || [];

  // Debounced search with 500ms delay
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery !== filters.q) {
        onFilterChange({ q: searchQuery || undefined });
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, filters.q, onFilterChange]);

  // Date range handling
  const dateRange = React.useMemo<DateRange>(() => {
    return {
      from: filters.from ? new Date(filters.from) : undefined,
      to: filters.to ? new Date(filters.to) : undefined,
    };
  }, [filters.from, filters.to]);

  const handleDateRangeChange = (range: DateRange) => {
    onFilterChange({
      from: range.from ? range.from.toISOString().split("T")[0] : undefined,
      to: range.to ? range.to.toISOString().split("T")[0] : undefined,
    });
  };

  // Risk level options
  const riskLevelOptions: MultiSelectOption[] = [
    { value: "NONE", label: "Brak" },
    { value: "LOW", label: "Niskie" },
    { value: "MEDIUM", label: "Średnie" },
    { value: "HIGH", label: "Wysokie" },
  ];

  // Route status options
  const routeStatusOptions: MultiSelectOption[] = [
    { value: "COMPLETED", label: "Ukończono" },
    { value: "PARTIALLY_COMPLETED", label: "Częściowo" },
    { value: "CANCELLED", label: "Anulowano" },
  ];

  // Driver options from fetched data
  const driverOptions: MultiSelectOption[] = React.useMemo(() => {
    return drivers.map((driver) => ({
      value: driver.uuid,
      label: `${driver.name} (${driver.email})`,
    }));
  }, [drivers]);

  // Handle removing a specific filter
  const handleRemoveFilter = (key: keyof ReportsFiltersState, value?: string) => {
    if (key === "q") {
      setSearchQuery("");
      onFilterChange({ q: undefined });
    } else if (key === "riskLevel" && value) {
      const newRiskLevel = filters.riskLevel?.filter((level) => level !== value);
      onFilterChange({ riskLevel: newRiskLevel?.length ? newRiskLevel : undefined });
    } else if (key === "routeStatus" && value) {
      const newRouteStatus = filters.routeStatus?.filter((status) => status !== value);
      onFilterChange({ routeStatus: newRouteStatus?.length ? newRouteStatus : undefined });
    } else if (key === "driverUuid" && value) {
      const newDriverUuid = filters.driverUuid?.filter((uuid) => uuid !== value);
      onFilterChange({ driverUuid: newDriverUuid?.length ? newDriverUuid : undefined });
    }
  };

  return (
    <div className="space-y-4">
      {/* Main filters row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Date range picker */}
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          placeholder="Wybierz zakres dat"
          className="w-full"
        />

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Szukaj kierowcy, opisu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              aria-label="Wyczyść wyszukiwanie"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Driver filter */}
        <MultiSelect
          options={driverOptions}
          value={filters.driverUuid || []}
          onChange={(value) => onFilterChange({ driverUuid: value.length > 0 ? value : undefined })}
          placeholder="Kierowcy"
          searchPlaceholder="Szukaj kierowcy..."
          emptyText="Nie znaleziono kierowcy."
        />

        {/* Risk level filter */}
        <MultiSelect
          options={riskLevelOptions}
          value={filters.riskLevel || []}
          onChange={(value) => onFilterChange({ riskLevel: value as ReportRiskLevel[] })}
          placeholder="Poziom ryzyka"
          searchPlaceholder="Szukaj poziomu ryzyka..."
          emptyText="Nie znaleziono poziomu ryzyka."
        />

        {/* Route status filter */}
        <MultiSelect
          options={routeStatusOptions}
          value={filters.routeStatus || []}
          onChange={(value) => onFilterChange({ routeStatus: value as ReportRouteStatus[] })}
          placeholder="Status trasy"
          searchPlaceholder="Szukaj statusu..."
          emptyText="Nie znaleziono statusu."
        />
      </div>

      {/* Active filters list */}
      <ActiveFiltersList filters={filters} onRemove={handleRemoveFilter} onClear={onResetFilters} />
    </div>
  );
}
