import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesService } from "@/lib/services/vehiclesService";
import { vehiclesKeys } from "./queryKeys";
import { toast } from "sonner";
import type { CreateVehicleCommand } from "@/types";

/**
 * Hook do tworzenia nowego pojazdu
 * Automatycznie invaliduje cache i wyświetla toast z wynikiem
 */
export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVehicleCommand) => vehiclesService.create(data),
    onSuccess: () => {
      // Invalidate wszystkie listy pojazdów
      queryClient.invalidateQueries({ queryKey: vehiclesKeys.lists() });
      toast.success("Pojazd został dodany pomyślnie");
    },
    onError: (error: any) => {
      // Obsługa specyficznych błędów
      if (error.response?.status === 409) {
        toast.error("Pojazd o tym numerze rejestracyjnym już istnieje");
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || "Nieprawidłowe dane";
        toast.error(message);
      } else if (error.response?.status === 403) {
        toast.error("Brak uprawnień do dodania pojazdu");
      } else {
        toast.error("Nie udało się dodać pojazdu");
      }
    },
  });
}
