import { useQuery } from '@tanstack/react-query';
import type { VehicleDTO, VehiclesListResponseDTO } from '@/types';

/**
 * useVehicles
 * 
 * Hook do pobierania listy aktywnych pojazdów.
 * Używany w selectach formularza przypisań do wyboru pojazdu.
 * Cache z dłuższym staleTime gdyż lista pojazdów zmienia się rzadziej.
 */
export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles', 'active'],
    queryFn: async (): Promise<VehicleDTO[]> => {
      const response = await fetch('/api/vehicles?isActive=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      
      const data: VehiclesListResponseDTO = await response.json();
      return data.items || [];
    },
    staleTime: 60000, // 1 min - lista pojazdów zmienia się rzadko
    refetchOnWindowFocus: false, // nie ma potrzeby refresh przy każdym focus
  });
}


