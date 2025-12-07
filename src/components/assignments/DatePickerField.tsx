import * as React from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerFieldProps {
  value?: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * DatePickerField
 * 
 * Komponent do wyboru daty z kalendarza.
 * Integruje się z react-hook-form przez value/onChange.
 * Format wewnętrzny: YYYY-MM-DD (IsoDateOnlyString)
 * Format wyświetlania: "dd MMM yyyy" z polską lokalizacją
 */
export const DatePickerField = React.forwardRef<HTMLButtonElement, DatePickerFieldProps>(
  ({ value, onChange, placeholder = "Wybierz datę", disabled = false }, ref) => {
    // Convert string value to Date object for Calendar
    const dateValue = value ? new Date(value) : undefined;

    const handleSelect = (date: Date | undefined) => {
      if (date) {
        // Convert Date to YYYY-MM-DD string
        const isoString = format(date, 'yyyy-MM-dd');
        onChange(isoString);
      } else {
        onChange('');
      }
    };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateValue && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? (
              format(dateValue, "PPP", { locale: pl })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            initialFocus
            locale={pl}
          />
        </PopoverContent>
      </Popover>
    );
  }
);

DatePickerField.displayName = "DatePickerField";


