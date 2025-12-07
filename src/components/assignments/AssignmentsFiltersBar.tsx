import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { AssignmentFilters } from "@/lib/assignments/assignmentTypes";
import type { DriverDTO, VehicleDTO } from "@/types";

interface AssignmentsFiltersBarProps {
  filters: AssignmentFilters;
  onFiltersChange: (filters: AssignmentFilters) => void;
  drivers: DriverDTO[];
  vehicles: VehicleDTO[];
  isLoading?: boolean;
}

/**
 * AssignmentsFiltersBar
 * 
 * Pasek filtrów umożliwiający zawężenie listy przypisań według kierowcy,
 * pojazdu lub daty aktywności. Wspiera wyszukiwanie w selectach i wybór daty z kalendarza.
 */
export function AssignmentsFiltersBar({
  filters,
  onFiltersChange,
  drivers,
  vehicles,
  isLoading = false,
}: AssignmentsFiltersBarProps) {
  const [date, setDate] = useState<Date | undefined>(
    filters.activeOn ? new Date(filters.activeOn) : undefined
  );

  const handleDriverChange = (value: string) => {
    onFiltersChange({
      ...filters,
      driverUuid: value === "all" ? undefined : value,
    });
  };

  const handleVehicleChange = (value: string) => {
    onFiltersChange({
      ...filters,
      vehicleUuid: value === "all" ? undefined : value,
    });
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    onFiltersChange({
      ...filters,
      activeOn: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleClearFilters = () => {
    setDate(undefined);
    onFiltersChange({
      sortBy: 'startDate',
      sortDir: 'asc',
      limit: 50,
    });
  };

  const hasActiveFilters = 
    filters.driverUuid || 
    filters.vehicleUuid || 
    filters.activeOn;

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Driver Select */}
        <div className="space-y-2">
          <Label htmlFor="driver-filter">Kierowca</Label>
          <Select
            value={filters.driverUuid || "all"}
            onValueChange={handleDriverChange}
            disabled={isLoading}
          >
            <SelectTrigger id="driver-filter">
              <SelectValue placeholder="Wszyscy kierowcy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszyscy kierowcy</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.uuid} value={driver.uuid}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Select */}
        <div className="space-y-2">
          <Label htmlFor="vehicle-filter">Pojazd</Label>
          <Select
            value={filters.vehicleUuid || "all"}
            onValueChange={handleVehicleChange}
            disabled={isLoading}
          >
            <SelectTrigger id="vehicle-filter">
              <SelectValue placeholder="Wszystkie pojazdy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie pojazdy</SelectItem>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.uuid} value={vehicle.uuid}>
                  {vehicle.registrationNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Picker */}
        <div className="space-y-2">
          <Label>Aktywne dnia</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? (
                  format(date, "PPP", { locale: pl })
                ) : (
                  <span>Wybierz datę</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                locale={pl}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Wyczyść filtry
          </Button>
        </div>
      )}
    </div>
  );
}


