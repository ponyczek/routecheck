import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createReportSchema, type CreateReportPayload } from "@/lib/validation/reportSchema";
import { useCreateReport, useUpdateReport } from "@/lib/reports";
import { getErrorMessage } from "@/lib/reports/api";
import { DriverSelect } from "./DriverSelect";
import type { ReportDetailDTO } from "@/types";

interface ReportFormDialogProps {
  open: boolean;
  initialData?: ReportDetailDTO | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Dialog for creating or editing a report
 * Uses React Hook Form with Zod validation
 */
export function ReportFormDialog({
  open,
  initialData,
  onOpenChange,
  onSuccess,
}: ReportFormDialogProps) {
  const isEditing = !!initialData;

  // Mutations
  const createMutation = useCreateReport();
  const updateMutation = useUpdateReport(initialData?.uuid || "");

  // Form setup with Zod validation
  const form = useForm<CreateReportPayload>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      driverUuid: initialData?.driverUuid || "",
      reportDate: initialData?.reportDate || new Date().toISOString().split("T")[0],
      timezone: initialData?.timezone || "Europe/Warsaw",
      routeStatus: initialData?.routeStatus || "COMPLETED",
      delayMinutes: initialData?.delayMinutes || 0,
      delayReason: initialData?.delayReason || null,
      cargoDamageDescription: initialData?.cargoDamageDescription || null,
      vehicleDamageDescription: initialData?.vehicleDamageDescription || null,
      nextDayBlockers: initialData?.nextDayBlockers || null,
      isProblem: initialData?.isProblem || false,
      riskLevel: initialData?.riskLevel || null,
      tags: initialData?.tags || [],
    },
  });

  // Watch delay minutes to show/hide delay reason field
  const delayMinutes = form.watch("delayMinutes");
  const routeStatus = form.watch("routeStatus");

  // Reset form when dialog opens/closes or initialData changes
  React.useEffect(() => {
    if (open && initialData) {
      form.reset({
        driverUuid: initialData.driverUuid,
        reportDate: initialData.reportDate,
        timezone: initialData.timezone,
        routeStatus: initialData.routeStatus,
        delayMinutes: initialData.delayMinutes,
        delayReason: initialData.delayReason,
        cargoDamageDescription: initialData.cargoDamageDescription,
        vehicleDamageDescription: initialData.vehicleDamageDescription,
        nextDayBlockers: initialData.nextDayBlockers,
        isProblem: initialData.isProblem,
        riskLevel: initialData.riskLevel,
        tags: initialData.tags || [],
      });
    } else if (open && !initialData) {
      form.reset({
        driverUuid: "",
        reportDate: new Date().toISOString().split("T")[0],
        timezone: "Europe/Warsaw",
        routeStatus: "COMPLETED",
        delayMinutes: 0,
        delayReason: null,
        cargoDamageDescription: null,
        vehicleDamageDescription: null,
        nextDayBlockers: null,
        isProblem: false,
        riskLevel: null,
        tags: [],
      });
    }
  }, [open, initialData, form]);

  // Submit handler
  const onSubmit = async (data: CreateReportPayload) => {
    try {
      if (isEditing) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { driverUuid, ...updateData } = data;
        await updateMutation.mutateAsync(updateData);
        toast.success("Raport zaktualizowany", {
          description: "Raport został pomyślnie zaktualizowany.",
        });
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Raport utworzony", {
          description: "Raport został pomyślnie utworzony.",
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Błąd", {
        description: getErrorMessage(error),
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edytuj raport" : "Dodaj nowy raport"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Wprowadź zmiany w raporcie. Pola oznaczone gwiazdką (*) są wymagane."
              : "Wypełnij formularz, aby ręcznie dodać raport. Pola oznaczone gwiazdką (*) są wymagane."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Driver UUID - only for create */}
            {!isEditing && (
              <FormField
                control={form.control}
                name="driverUuid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kierowca *</FormLabel>
                    <FormControl>
                      <DriverSelect
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                        placeholder="Wybierz kierowcę..."
                      />
                    </FormControl>
                    <FormDescription>
                      Wybierz kierowcę, dla którego tworzysz raport
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Report Date and Timezone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="reportDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data raportu *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        disabled={isSubmitting}
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strefa czasowa *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Europe/Warsaw"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Route Status */}
            <FormField
              control={form.control}
              name="routeStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status trasy *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COMPLETED">Ukończono</SelectItem>
                      <SelectItem value="PARTIALLY_COMPLETED">Częściowo ukończono</SelectItem>
                      <SelectItem value="CANCELLED">Anulowano</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Delay */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="delayMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opóźnienie (minuty)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {delayMinutes > 0 && (
                <FormField
                  control={form.control}
                  name="delayReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Przyczyna opóźnienia *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Np. korek na autostradzie"
                          {...field}
                          value={field.value || ""}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Damage descriptions */}
            <FormField
              control={form.control}
              name="cargoDamageDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis uszkodzenia ładunku</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Opisz uszkodzenia ładunku (jeśli wystąpiły)"
                      {...field}
                      value={field.value || ""}
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicleDamageDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis uszkodzenia pojazdu</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Opisz uszkodzenia pojazdu (jeśli wystąpiły)"
                      {...field}
                      value={field.value || ""}
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Next day blockers - required for PARTIALLY_COMPLETED */}
            {(routeStatus === "PARTIALLY_COMPLETED" || form.getValues("nextDayBlockers")) && (
              <FormField
                control={form.control}
                name="nextDayBlockers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Blokery na kolejny dzień
                      {routeStatus === "PARTIALLY_COMPLETED" && " *"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Opisz co blokuje ukończenie trasy"
                        {...field}
                        value={field.value || ""}
                        disabled={isSubmitting}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Problem flag */}
            <FormField
              control={form.control}
              name="isProblem"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Oznacz jako problem</FormLabel>
                    <FormDescription>
                      Zaznacz, jeśli w trasie wystąpił poważny problem wymagający uwagi
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Risk Level */}
            <FormField
              control={form.control}
              name="riskLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poziom ryzyka (opcjonalnie)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz poziom ryzyka" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NONE">Brak</SelectItem>
                      <SelectItem value="LOW">Niskie</SelectItem>
                      <SelectItem value="MEDIUM">Średnie</SelectItem>
                      <SelectItem value="HIGH">Wysokie</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    AI automatycznie oceni ryzyko, ale możesz też ustawić je ręcznie
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Zapisz zmiany" : "Utwórz raport"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

