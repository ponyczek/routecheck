import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateAssignmentCommand, AssignmentDTO } from "@/types";
import { toast } from "sonner";

/**
 * useCreateAssignment
 *
 * Hook do tworzenia nowego przypisania kierowca-pojazd.
 * Obsługuje walidację konfliktów (409) i nieprawidłowych zakresów dat (400).
 */
export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssignmentCommand): Promise<AssignmentDTO> => {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        // Rzuć błąd z pełną strukturą dla obsługi w komponencie
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate wszystkie queries z assignments aby odświeżyć listę
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Przypisanie zostało dodane");
    },
    onError: (error: any) => {
      // Błąd 409 (konflikt) jest obsługiwany w komponencie formularza
      // - wyświetlamy tam szczegółowy Alert z informacją o konflikcie
      if (error.code === "ASSIGNMENT_OVERLAP") {
        return;
      }

      // Pozostałe błędy wyświetlamy jako toast
      toast.error(error.message || "Nie udało się dodać przypisania");
    },
  });
}
