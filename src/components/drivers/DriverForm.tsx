import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TimezoneCombobox } from "./TimezoneCombobox";
import { driverFormSchema, type DriverFormData } from "@/lib/drivers/validation";

interface DriverFormProps {
  defaultValues?: Partial<DriverFormData>;
  onSubmit: (data: DriverFormData) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Formularz dodawania/edycji kierowcy
 * - Walidacja z Zod
 * - Inline validation (onBlur)
 * - React Hook Form
 * - Obsługa błędów z API (przez setError)
 */
export function DriverForm({ defaultValues, onSubmit, isSubmitting }: DriverFormProps) {
  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      email: defaultValues?.email || "",
      timezone: defaultValues?.timezone || "Europe/Warsaw",
      isActive: defaultValues?.isActive ?? true,
    },
    mode: "onBlur", // Walidacja przy onBlur
  });

  const handleSubmit = async (data: DriverFormData) => {
    try {
      await onSubmit(data);
    } catch (error: unknown) {
      // Obsługa błędów z API
      // Np. 409 Conflict dla duplikatu emaila
      const apiError = error as any;
      if (apiError?.response?.status === 409) {
        form.setError("email", {
          type: "manual",
          message: "Kierowca z tym adresem e-mail już istnieje",
        });
      } else if (apiError?.response?.data?.errors) {
        // Mapowanie błędów walidacji z API na pola formularza
        Object.entries(apiError.response.data.errors).forEach(([field, message]) => {
          form.setError(field as keyof DriverFormData, {
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
        {/* Pole: Imię i nazwisko */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imię i nazwisko *</FormLabel>
              <FormControl>
                <Input placeholder="Jan Kowalski" {...field} disabled={isSubmitting} autoComplete="name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pole: Adres e-mail */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adres e-mail *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="jan.kowalski@example.com"
                  {...field}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </FormControl>
              <FormDescription>Na ten adres będą wysyłane linki do raportów dziennych.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pole: Strefa czasowa */}
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strefa czasowa *</FormLabel>
              <FormControl>
                <TimezoneCombobox value={field.value} onChange={field.onChange} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>Raporty będą generowane zgodnie z tą strefą czasową.</FormDescription>
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
                <FormDescription>Nieaktywni kierowcy nie będą otrzymywać linków do raportów dziennych.</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                  aria-label="Status aktywności kierowcy"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
