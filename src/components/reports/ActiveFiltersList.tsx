import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReportsFiltersState } from "@/lib/reports/types";
import type { ReportRiskLevel, ReportRouteStatus } from "@/types";
import { useDriversList } from "@/lib/drivers";

interface ActiveFiltersListProps {
  filters: ReportsFiltersState;
  onRemove: (key: keyof ReportsFiltersState, value?: string) => void;
  onClear: () => void;
}

/**
 * Displays active filters as badges with remove buttons
 */
export function ActiveFiltersList({ filters, onRemove, onClear }: ActiveFiltersListProps) {
  // Fetch drivers for displaying names
  const { data: driversData } = useDriversList({
    isActive: true,
    includeDeleted: false,
    limit: 100,
  });

  const drivers = driversData?.items || [];

  // Create a map for quick driver lookup
  const driversMap = React.useMemo(() => {
    const map = new Map();
    drivers.forEach((driver) => {
      map.set(driver.uuid, driver);
    });
    return map;
  }, [drivers]);
  const activeFilters: Array<{
    key: keyof ReportsFiltersState;
    label: string;
    value?: string;
  }> = [];

  // Add search filter
  if (filters.q) {
    activeFilters.push({ key: "q", label: `Szukaj: ${filters.q}` });
  }

  // Add risk level filters
  if (filters.riskLevel && filters.riskLevel.length > 0) {
    const riskLabels: Record<ReportRiskLevel, string> = {
      NONE: "Brak ryzyka",
      LOW: "Niskie ryzyko",
      MEDIUM: "Średnie ryzyko",
      HIGH: "Wysokie ryzyko",
    };
    filters.riskLevel.forEach((level) => {
      activeFilters.push({
        key: "riskLevel",
        label: riskLabels[level],
        value: level,
      });
    });
  }

  // Add route status filters
  if (filters.routeStatus && filters.routeStatus.length > 0) {
    const statusLabels: Record<ReportRouteStatus, string> = {
      COMPLETED: "Ukończono",
      PARTIALLY_COMPLETED: "Częściowo",
      CANCELLED: "Anulowano",
    };
    filters.routeStatus.forEach((status) => {
      activeFilters.push({
        key: "routeStatus",
        label: statusLabels[status],
        value: status,
      });
    });
  }

  // Add driver filters (TODO: fetch driver names)
  if (filters.driverUuid && filters.driverUuid.length > 0) {
    filters.driverUuid.forEach((uuid) => {
      const driver = driversMap.get(uuid);
      activeFilters.push({
        key: "driverUuid",
        label: driver ? `Kierowca: ${driver.name}` : `Kierowca: ${uuid.substring(0, 8)}...`,
        value: uuid,
      });
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Filtry:</span>
      {activeFilters.map((filter, index) => (
        <Badge key={`${filter.key}-${filter.value || index}`} variant="secondary" className="gap-1">
          {filter.label}
          <button
            onClick={() => onRemove(filter.key, filter.value)}
            className="ml-1 rounded-full hover:bg-muted"
            aria-label={`Usuń filtr: ${filter.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-auto px-2 py-1 text-xs"
      >
        Wyczyść wszystkie
      </Button>
    </div>
  );
}

