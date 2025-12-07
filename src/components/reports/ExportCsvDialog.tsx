import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker, type DateRange } from "./DateRangePicker";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { exportReportsCsv, getErrorMessage } from "@/lib/reports/api";

const exportCsvSchema = z.object({
  from: z.date({ required_error: "Data początkowa jest wymagana" }),
  to: z.date({ required_error: "Data końcowa jest wymagana" }),
  includeAi: z.boolean().default(true),
  includeTags: z.boolean().default(true),
});

type ExportCsvFormData = z.infer<typeof exportCsvSchema>;

interface ExportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for exporting reports to CSV
 * Allows selecting date range and export options
 */
export function ExportCsvDialog({ open, onOpenChange }: ExportCsvDialogProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  // Form setup with Zod validation
  const form = useForm<ExportCsvFormData>({
    resolver: zodResolver(exportCsvSchema),
    defaultValues: {
      from: new Date(),
      to: new Date(),
      includeAi: true,
      includeTags: true,
    },
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        from: new Date(),
        to: new Date(),
        includeAi: true,
        includeTags: true,
      });
    }
  }, [open, form]);

  // Submit handler
  const onSubmit = async (data: ExportCsvFormData) => {
    setIsExporting(true);
    try {
      const fromStr = data.from.toISOString().split("T")[0];
      const toStr = data.to.toISOString().split("T")[0];

      const blob = await exportReportsCsv(fromStr, toStr, data.includeAi, data.includeTags);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `raporty_${fromStr}_${toStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Eksport zakończony", {
        description: "Plik CSV został pomyślnie pobrany.",
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Błąd eksportu", {
        description: getErrorMessage(error),
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eksportuj raporty do CSV</DialogTitle>
          <DialogDescription>
            Wybierz zakres dat i opcje eksportu. Wszystkie pola są wymagane.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Range */}
            <FormField
              control={form.control}
              name="from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zakres dat *</FormLabel>
                  <FormControl>
                    <DateRangePicker
                      value={{
                        from: field.value,
                        to: form.getValues("to"),
                      }}
                      onChange={(range: DateRange) => {
                        if (range.from) field.onChange(range.from);
                        if (range.to) form.setValue("to", range.to);
                      }}
                      disabled={isExporting}
                    />
                  </FormControl>
                  <FormDescription>
                    Wybierz zakres dat dla raportów do eksportu
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Export options */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="includeAi"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isExporting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Dołącz analizę AI</FormLabel>
                      <FormDescription>
                        Eksportuj kolumny z podsumowaniem i oceną AI
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeTags"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isExporting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Dołącz tagi ryzyka</FormLabel>
                      <FormDescription>
                        Eksportuj kolumnę z tagami ryzyka
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isExporting}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isExporting} className="gap-2">
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Eksportowanie...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Eksportuj CSV
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}



