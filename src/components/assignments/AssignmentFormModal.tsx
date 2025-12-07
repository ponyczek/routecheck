import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { DatePickerField } from "./DatePickerField";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { assignmentFormSchema, type AssignmentFormSchema } from "@/lib/assignments/assignmentFormSchema";
import type { AssignmentDTO, DriverDTO, VehicleDTO } from "@/types";
import type { AssignmentConflictError } from "@/lib/assignments/assignmentTypes";

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  assignment?: AssignmentDTO | null;
  drivers: DriverDTO[];
  vehicles: VehicleDTO[];
  onSubmit: (data: AssignmentFormSchema) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * AssignmentFormModal
 *
 * Modal z formularzem dodawania lub edycji przypisania kierowca-pojazd.
 * Wykorzystuje React Hook Form + Zod do walidacji.
 * Responsive: Dialog na desktop, Sheet na mobile.
 */
export function AssignmentFormModal({
  isOpen,
  onClose,
  mode,
  assignment,
  drivers,
  vehicles,
  onSubmit,
  isSubmitting = false,
}: AssignmentFormModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [conflictError, setConflictError] = useState<AssignmentConflictError | null>(null);

  // React Hook Form
  const form = useForm<AssignmentFormSchema>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      driverUuid: "",
      vehicleUuid: "",
      startDate: "",
      endDate: "",
    },
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (mode === "edit" && assignment) {
      form.reset({
        driverUuid: assignment.driverUuid,
        vehicleUuid: assignment.vehicleUuid,
        startDate: assignment.startDate,
        endDate: assignment.endDate || "",
      });
    } else if (mode === "create") {
      form.reset({
        driverUuid: "",
        vehicleUuid: "",
        startDate: "",
        endDate: "",
      });
    }
  }, [mode, assignment, form]);

  // Reset conflict error when form values change
  useEffect(() => {
    const subscription = form.watch(() => {
      if (conflictError) {
        setConflictError(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, conflictError]);

  const handleSubmit = async (data: AssignmentFormSchema) => {
    try {
      setConflictError(null);
      await onSubmit(data);
      // onClose will be called by parent after successful submit
    } catch (error: unknown) {
      // Błąd 409 (konflikt) wyświetlamy w formularzu jako Alert
      if (error && typeof error === 'object' && 'code' in error && error.code === "ASSIGNMENT_OVERLAP") {
        setConflictError(error as AssignmentConflictError);
      }
      // Inne błędy są obsługiwane przez toast w hooku mutacji
    }
  };

  const handleClose = () => {
    form.reset();
    setConflictError(null);
    onClose();
  };

  const title = mode === "create" ? "Dodaj przypisanie" : "Edytuj przypisanie";
  const description =
    mode === "create"
      ? "Przypisz kierowcę do pojazdu na określony okres czasu"
      : "Zaktualizuj dane przypisania kierowca-pojazd";

  // Form content - będzie użyty zarówno w Dialog jak i Sheet
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Conflict Error Alert */}
        {conflictError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Konflikt przypisań</AlertTitle>
            <AlertDescription>
              {conflictError.message}
              {conflictError.details?.conflictingAssignment && (
                <div className="mt-2 text-sm">
                  <p className="font-medium">Istniejące przypisanie:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {conflictError.details.conflictingAssignment.driverName && (
                      <li>Kierowca: {conflictError.details.conflictingAssignment.driverName}</li>
                    )}
                    {conflictError.details.conflictingAssignment.vehicleRegistration && (
                      <li>Pojazd: {conflictError.details.conflictingAssignment.vehicleRegistration}</li>
                    )}
                    <li>
                      Okres: {conflictError.details.conflictingAssignment.startDate} -{" "}
                      {conflictError.details.conflictingAssignment.endDate || "bezterminowo"}
                    </li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Driver Select */}
        <FormField
          control={form.control}
          name="driverUuid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kierowca *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kierowcę" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {drivers.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">Brak dostępnych kierowców</div>
                  ) : (
                    drivers.map((driver) => (
                      <SelectItem key={driver.uuid} value={driver.uuid}>
                        {driver.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Vehicle Select */}
        <FormField
          control={form.control}
          name="vehicleUuid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pojazd *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz pojazd" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vehicles.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">Brak dostępnych pojazdów</div>
                  ) : (
                    vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.uuid} value={vehicle.uuid}>
                        {vehicle.registrationNumber}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start Date Picker */}
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data rozpoczęcia *</FormLabel>
              <FormControl>
                <DatePickerField
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Wybierz datę rozpoczęcia"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Date Picker */}
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data zakończenia (opcjonalnie)</FormLabel>
              <FormControl>
                <DatePickerField
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Wybierz datę zakończenia lub zostaw puste"
                  disabled={isSubmitting}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">Pozostaw puste dla przypisania bezterminowego</p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Anuluj
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Dodaj" : "Zapisz"}
          </Button>
        </div>
      </form>
    </Form>
  );

  // Render Dialog (desktop) or Sheet (mobile)
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="mt-4">{formContent}</div>
      </SheetContent>
    </Sheet>
  );
}
