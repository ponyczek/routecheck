import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesService } from "@/lib/services/vehiclesService";
import { vehiclesKeys } from "./queryKeys";
import { toast } from "sonner";

/**
 * Hook do usuwania pojazdu (soft delete)
 * Automatycznie invaliduje cache i wyświetla toast z wynikiem
 */
export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => vehiclesService.delete(uuid),
    onSuccess: () => {
      // Invalidate wszystkie listy pojazdów
      queryClient.invalidateQueries({ queryKey: vehiclesKeys.lists() });
      toast.success("Pojazd został usunięty");
    },
    onError: (error: { response?: { status?: number } }) => {
      // Obsługa błędów
      if (error.response?.status === 404) {
        toast.error("Pojazd nie został znaleziony");
      } else if (error.response?.status === 403) {
        toast.error("Brak uprawnień do usunięcia pojazdu");
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || "Nie można usunąć pojazdu";
        toast.error(message);
      } else {
        toast.error("Nie udało się usunąć pojazdu");
      }
    },
  });
}
