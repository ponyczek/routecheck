import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getTimezoneOptions, searchTimezones } from '@/lib/drivers/timezones';
import { cn } from '@/lib/utils';

interface TimezoneComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Searchable combobox dla wyboru strefy czasowej
 * Wyświetla listę IANA timezones z offsetami UTC
 * Wspiera wyszukiwanie i filtrowanie
 */
export function TimezoneCombobox({ value, onChange, disabled }: TimezoneComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pobierz wszystkie dostępne strefy czasowe
  const allTimezones = useMemo(() => getTimezoneOptions(), []);

  // Filtruj strefy czasowe na podstawie wyszukiwania
  const filteredTimezones = useMemo(() => {
    return searchTimezones(searchQuery, allTimezones);
  }, [searchQuery, allTimezones]);

  // Znajdź wybraną strefę czasową
  const selectedTimezone = allTimezones.find((tz) => tz.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedTimezone ? selectedTimezone.label : 'Wybierz strefę czasową...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Szukaj strefy czasowej..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>Nie znaleziono strefy czasowej.</CommandEmpty>
            <CommandGroup>
              {filteredTimezones.map((timezone) => (
                <CommandItem
                  key={timezone.value}
                  value={timezone.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === timezone.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {timezone.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}



