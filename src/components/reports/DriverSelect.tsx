import * as React from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDriversList } from "@/lib/drivers";

interface DriverSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Combobox for selecting a driver from the list
 * Fetches active drivers and allows search by name or email
 */
export function DriverSelect({
  value,
  onChange,
  placeholder = "Wybierz kierowcę...",
  disabled = false,
  className,
}: DriverSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch active drivers
  const { data: driversData, isLoading } = useDriversList({
    isActive: true,
    includeDeleted: false,
    q: searchQuery,
    limit: 50,
    sortBy: "name",
    sortDir: "asc",
  });

  const drivers = driversData?.items || [];

  // Find selected driver
  const selectedDriver = React.useMemo(() => {
    return drivers.find((driver) => driver.uuid === value);
  }, [drivers, value]);

  // Display value
  const displayValue = React.useMemo(() => {
    if (!value) return placeholder;
    if (selectedDriver) {
      return `${selectedDriver.name} (${selectedDriver.email})`;
    }
    // If driver not found in current list, show UUID
    return value;
  }, [value, selectedDriver, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", !value && "text-muted-foreground", className)}
        >
          <span className="flex items-center gap-2 truncate">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">{displayValue}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Szukaj kierowcy..." value={searchQuery} onValueChange={setSearchQuery} />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Ładowanie kierowców...</div>
            ) : drivers.length === 0 ? (
              <CommandEmpty>{searchQuery ? "Nie znaleziono kierowcy." : "Brak aktywnych kierowców."}</CommandEmpty>
            ) : (
              <CommandGroup>
                {drivers.map((driver) => {
                  const isSelected = driver.uuid === value;
                  return (
                    <CommandItem
                      key={driver.uuid}
                      value={driver.uuid}
                      onSelect={() => {
                        onChange(driver.uuid);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col">
                        <span className="font-medium">{driver.name}</span>
                        <span className="text-xs text-muted-foreground">{driver.email}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
