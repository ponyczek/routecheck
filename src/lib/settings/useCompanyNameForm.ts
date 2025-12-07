import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { editCompanyNameSchema, type EditCompanyNameFormValues } from "./validation";
import { useUpdateCompany } from "./queries";
import type { CompanyDTO } from "@/types";
import type { CompanyApiError } from "./types";

/**
 * Custom hook dla formularza edycji nazwy firmy
 * Integruje React Hook Form, Zod walidację i TanStack Query mutation
 */
export function useCompanyNameForm(company: CompanyDTO) {
  const { mutateAsync: updateCompany, isPending } = useUpdateCompany();

  const form = useForm<EditCompanyNameFormValues>({
    resolver: zodResolver(editCompanyNameSchema),
    defaultValues: {
      name: company.name,
    },
  });

  const onSubmit = async (values: EditCompanyNameFormValues) => {
    try {
      const updated = await updateCompany({ name: values.name });

      toast.success("Nazwa firmy została zaktualizowana", {
        description: `Nowa nazwa: ${updated.name}`,
      });

      form.reset({ name: updated.name });
    } catch (error) {
      const apiError = error as CompanyApiError;

      if (apiError.code === "forbidden") {
        toast.error("Nie masz uprawnień do edycji profilu firmy");
      } else if (apiError.code === "validation_error") {
        toast.error("Błąd walidacji", {
          description: apiError.message,
        });
      } else {
        toast.error("Nie udało się zaktualizować nazwy firmy", {
          description: "Spróbuj ponownie później",
        });
      }
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isPending,
  };
}
