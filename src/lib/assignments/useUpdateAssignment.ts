import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateAssignmentCommand, AssignmentDTO, Uuid } from "@/types";
import { toast } from "sonner";

/**
 * useUpdateAssignment
 *
 * Hook do aktualizacji istniejącego przypisania kierowca-pojazd.
 * Obsługuje walidację konfliktów (409), nieprawidłowych zakresów dat (400) i brak zasobu (404).
 */
export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data }: { uuid: Uuid; data: UpdateAssignmentCommand }): Promise<AssignmentDTO> => {
      const response = await fetch(`/api/assignments/${uuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        // Dodaj status code do błędu dla łatwiejszej obsługi
        throw { ...error, status: response.status };
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate wszystkie queries z assignments aby odświeżyć listę
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Przypisanie zostało zaktualizowane");
    },
    onError: (error: any) => {
      // Błąd 409 (konflikt) jest obsługiwany w komponencie formularza
      if (error.code === "ASSIGNMENT_OVERLAP") {
        return;
      }

      // Błąd 404 - przypisanie zostało już usunięte
      if (error.status === 404) {
        toast.error("Nie znaleziono przypisania. Mogło zostać już usunięte.");
        // Odśwież listę aby usunąć nieistniejące przypisanie z UI
        queryClient.invalidateQueries({ queryKey: ["assignments"] });
        return;
      }

      // Pozostałe błędy wyświetlamy jako toast
      toast.error(error.message || "Nie udało się zaktualizować przypisania");
    },
  });
}
