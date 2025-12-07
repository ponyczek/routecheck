import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesService } from "@/lib/services/vehiclesService";
import { vehiclesKeys } from "./queryKeys";
import { toast } from "sonner";
import type { UpdateVehicleCommand, VehiclesListResponseDTO } from "@/types";

interface UpdateVehicleVariables {
  uuid: string;
  data: UpdateVehicleCommand;
}

/**
 * Hook do aktualizacji pojazdu z optimistic update
 * UI natychmiast się aktualizuje, a w przypadku błędu następuje rollback
 */
export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid, data }: UpdateVehicleVariables) => vehiclesService.update(uuid, data),

    // Optimistic update - aktualizuj UI natychmiast przed otrzymaniem odpowiedzi
    onMutate: async ({ uuid, data }) => {
      // Anuluj wszystkie pending queries dla list pojazdów
      await queryClient.cancelQueries({ queryKey: vehiclesKeys.lists() });

      // Snapshot poprzedniego stanu (do rollback w przypadku błędu)
      const previousData = queryClient.getQueriesData({ queryKey: vehiclesKeys.lists() });

      // Optimistically update wszystkie listy pojazdów
      queryClient.setQueriesData<VehiclesListResponseDTO>({ queryKey: vehiclesKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((vehicle) => (vehicle.uuid === uuid ? { ...vehicle, ...data } : vehicle)),
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
        toast.error("Pojazd o tym numerze rejestracyjnym już istnieje");
      } else if (error.response?.status === 404) {
        toast.error("Pojazd nie został znaleziony");
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || "Nieprawidłowe dane";
        toast.error(message);
      } else if (error.response?.status === 403) {
        toast.error("Brak uprawnień do edycji pojazdu");
      } else {
        toast.error("Nie udało się zaktualizować pojazdu");
      }
    },

    // Po sukcesie - invalidate aby pobrać aktualne dane z serwera
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehiclesKeys.lists() });
      toast.success("Pojazd został zaktualizowany");
    },
  });
}
