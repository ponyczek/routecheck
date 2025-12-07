import { useQuery } from "@tanstack/react-query";
import type { DriverDTO, DriversListResponseDTO } from "@/types";

/**
 * useDrivers
 *
 * Hook do pobierania listy aktywnych kierowców.
 * Używany w selectach formularza przypisań do wyboru kierowcy.
 * Cache z dłuższym staleTime gdyż lista kierowców zmienia się rzadziej.
 */
export function useDrivers() {
  return useQuery({
    queryKey: ["drivers", "active"],
    queryFn: async (): Promise<DriverDTO[]> => {
      const response = await fetch("/api/drivers?isActive=true");

      if (!response.ok) {
        throw new Error("Failed to fetch drivers");
      }

      const data: DriversListResponseDTO = await response.json();
      return data.items || [];
    },
    staleTime: 60000, // 1 min - lista kierowców zmienia się rzadko
    refetchOnWindowFocus: false, // nie ma potrzeby refresh przy każdym focus
  });
}
