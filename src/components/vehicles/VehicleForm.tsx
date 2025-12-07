import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { vehicleFormSchema, type VehicleFormData } from "@/lib/vehicles/validation";

interface VehicleFormProps {
  defaultValues?: Partial<VehicleFormData>;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Formularz dodawania/edycji pojazdu
 * - Walidacja z Zod
 * - Inline validation (onBlur)
 * - React Hook Form
 * - Obsługa błędów z API (przez setError)
 */
export function VehicleForm({ defaultValues, onSubmit, isSubmitting }: VehicleFormProps) {
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      registrationNumber: defaultValues?.registrationNumber || "",
      vin: defaultValues?.vin || null,
      isActive: defaultValues?.isActive ?? true,
    },
    mode: "onBlur", // Walidacja przy onBlur
  });

  const handleSubmit = async (data: VehicleFormData) => {
    try {
      await onSubmit(data);
    } catch (error: unknown) {
      // Obsługa błędów z API
      // Np. 409 Conflict dla duplikatu numeru rejestracyjnego
      const apiError = error as any;
      if (apiError?.response?.status === 409) {
        form.setError("registrationNumber", {
          type: "manual",
          message: "Pojazd o tym numerze rejestracyjnym już istnieje",
        });
      } else if (apiError?.response?.data?.errors) {
        // Mapowanie błędów walidacji z API na pola formularza
        Object.entries(apiError.response.data.errors).forEach(([field, message]) => {
          form.setError(field as keyof VehicleFormData, {
            type: "manual",
            message: message as string,
          });
        });
      }
      // Nie rzucamy błędu dalej - jest obsłużony przez toast w mutation hook
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Pole: Numer rejestracyjny */}
        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numer rejestracyjny *</FormLabel>
              <FormControl>
                <Input
                  placeholder="ABC1234"
                  {...field}
                  disabled={isSubmitting}
                  autoComplete="off"
                  className="uppercase"
                  onChange={(e) => {
                    // Automatyczna konwersja na wielkie litery
                    field.onChange(e.target.value.toUpperCase());
                  }}
                />
              </FormControl>
              <FormDescription>Unikalny numer rejestracyjny pojazdu w ramach firmy.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pole: VIN */}
        <FormField
          control={form.control}
          name="vin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VIN (opcjonalnie)</FormLabel>
              <FormControl>
                <Input
                  placeholder="1HGBH41JXMN109186"
                  {...field}
                  value={field.value || ""}
                  disabled={isSubmitting}
                  autoComplete="off"
                  className="uppercase"
                  onChange={(e) => {
                    // Automatyczna konwersja na wielkie litery i obsługa pustego stringa
                    const value = e.target.value.toUpperCase();
                    field.onChange(value === "" ? null : value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Numer VIN pojazdu (Vehicle Identification Number). Maksymalnie 17 znaków.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pole: Status aktywności */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Status aktywny</FormLabel>
                <FormDescription>Nieaktywne pojazdy nie będą dostępne do przypisania do kierowców.</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                  aria-label="Status aktywności pojazdu"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
