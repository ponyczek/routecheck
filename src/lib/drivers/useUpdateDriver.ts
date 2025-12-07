import { useMutation, useQueryClient } from "@tanstack/react-query";
import { driversService } from "@/lib/services/driversService";
import { driversKeys } from "./queryKeys";
import { toast } from "sonner";
import type { UpdateDriverCommand, DriverDTO, DriversListResponseDTO } from "@/types";

interface UpdateDriverVariables {
  uuid: string;
  data: UpdateDriverCommand;
}

/**
 * Hook do aktualizacji kierowcy z optimistic update
 * UI natychmiast się aktualizuje, a w przypadku błędu następuje rollback
 */
export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, data }: UpdateDriverVariables) => driversService.update(uuid, data),

    // Optimistic update - aktualizuj UI natychmiast przed otrzymaniem odpowiedzi
    onMutate: async ({ uuid, data }) => {
      // Anuluj wszystkie pending queries dla list kierowców
      await queryClient.cancelQueries({ queryKey: driversKeys.lists() });

      // Snapshot poprzedniego stanu (do rollback w przypadku błędu)
      const previousData = queryClient.getQueriesData({ queryKey: driversKeys.lists() });

      // Optimistically update wszystkie listy kierowców
      queryClient.setQueriesData<DriversListResponseDTO>({ queryKey: driversKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((driver) => (driver.uuid === uuid ? { ...driver, ...data } : driver)),
        };
      });

      // Zwróć context z poprzednim stanem
      return { previousData };
    },

    // Rollback w przypadku błędu
    onError: (error: any, _variables, context) => {
      // Przywróć poprzedni stan
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Obsługa błędów
      if (error.response?.status === 409) {
        toast.error("Kierowca z tym adresem e-mail już istnieje");
      } else if (error.response?.status === 404) {
        toast.error("Kierowca nie został znaleziony");
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || "Nieprawidłowe dane";
        toast.error(message);
      } else if (error.response?.status === 403) {
        toast.error("Brak uprawnień do edycji kierowcy");
      } else {
        toast.error("Nie udało się zaktualizować kierowcy");
      }
    },

    // Po sukcesie - invalidate aby pobrać aktualne dane z serwera
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driversKeys.lists() });
      toast.success("Kierowca został zaktualizowany");
    },
  });
}
