import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRangeSelectorProps } from "@/lib/reports/export/types";

/**
 * Date range selector component for CSV export
 * Uses shadcn/ui Calendar with range selection mode
 * Validates date range and displays error messages
 */
export function DateRangeSelector({
  value,
  onChange,
  error,
  disabled = false,
}: DateRangeSelectorProps) {
  const formatDateRange = () => {
    if (value.from) {
      if (value.to) {
        return `${format(value.from, "dd.MM.yyyy", { locale: pl })} - ${format(value.to, "dd.MM.yyyy", { locale: pl })}`;
      }
      return format(value.from, "dd.MM.yyyy", { locale: pl });
    }
    return "Wybierz zakres dat";
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="date-range">
        Zakres dat <span className="text-destructive">*</span>
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value.from && !value.to && "text-muted-foreground",
              error && "border-destructive"
            )}
            aria-invalid={!!error}
            aria-describedby={error ? "date-range-error" : undefined}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={value.from}
            selected={{ from: value.from, to: value.to }}
            onSelect={onChange}
            numberOfMonths={2}
            locale={pl}
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p
          id="date-range-error"
          className="text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}



