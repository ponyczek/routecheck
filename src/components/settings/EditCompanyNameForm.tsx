import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCompanyNameForm } from "@/lib/settings/useCompanyNameForm";
import type { CompanyDTO } from "@/types";

interface EditCompanyNameFormProps {
  company: CompanyDTO;
  onUpdate?: (updatedCompany: CompanyDTO) => void;
}

/**
 * Formularz edycji nazwy firmy
 * Używa React Hook Form + Zod do walidacji
 * Obsługuje stany ładowania i błędy API
 */
export function EditCompanyNameForm({ company, onUpdate }: EditCompanyNameFormProps) {
  const { form, onSubmit, isPending } = useCompanyNameForm(company);

  const isDisabled = isPending || !form.formState.isDirty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);

    // Wywołaj callback jeśli został przekazany
    if (onUpdate && !form.formState.errors.name) {
      // Jeśli nie ma błędów, oznacza to sukces
      const updatedName = form.getValues("name");
      onUpdate({
        ...company,
        name: updatedName,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edytuj nazwę firmy</CardTitle>
        <CardDescription>Zmień nazwę wyświetlaną w aplikacji</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa firmy</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Wprowadź nazwę firmy" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isDisabled}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
