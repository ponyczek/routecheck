import { useQuery } from '@tanstack/react-query';
import { vehiclesService } from '@/lib/services/vehiclesService';
import { vehiclesKeys } from './queryKeys';
import type { VehiclesQueryParams } from './types';

/**
 * Hook do pobierania listy pojazdów z filtrowaniem i paginacją
 */
export function useVehiclesList(params: VehiclesQueryParams) {
  return useQuery({
    queryKey: vehiclesKeys.list(params),
    queryFn: () => vehiclesService.list(params),
    staleTime: 30_000, // 30s - dane pozostają świeże przez 30s
    refetchInterval: 60_000, // Auto-refetch co 60s
    refetchOnWindowFocus: true, // Odśwież gdy okno odzyska focus
    retry: 2, // Retry 2 razy w przypadku błędu
  });
}


