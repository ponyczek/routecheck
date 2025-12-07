import * as React from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Date range picker component using shadcn/ui Calendar
 * Allows selecting a date range (from-to)
 */
export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = "Wybierz zakres dat",
  disabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatDateRange = React.useCallback(() => {
    if (value.from) {
      if (value.to) {
        return `${format(value.from, "dd.MM.yyyy", { locale: pl })} - ${format(value.to, "dd.MM.yyyy", { locale: pl })}`;
      }
      return format(value.from, "dd.MM.yyyy", { locale: pl });
    }
    return placeholder;
  }, [value, placeholder]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value.from && "text-muted-foreground",
            className
          )}
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
          onSelect={(range) => {
            if (range) {
              onChange({ from: range.from, to: range.to });
              // Close popover when both dates are selected
              if (range.from && range.to) {
                setIsOpen(false);
              }
            }
          }}
          numberOfMonths={2}
          locale={pl}
          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
        />
      </PopoverContent>
    </Popover>
  );
}
