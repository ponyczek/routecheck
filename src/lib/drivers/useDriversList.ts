import { useQuery } from '@tanstack/react-query';
import { driversService } from '@/lib/services/driversService';
import { driversKeys } from './queryKeys';
import type { DriversQueryParams } from './types';

/**
 * Hook do pobierania listy kierowców z filtrowaniem i paginacją
 */
export function useDriversList(params: DriversQueryParams) {
  return useQuery({
    queryKey: driversKeys.list(params),
    queryFn: () => driversService.list(params),
    staleTime: 30_000, // 30s - dane pozostają świeże przez 30s
    refetchInterval: 60_000, // Auto-refetch co 60s
    refetchOnWindowFocus: true, // Odśwież gdy okno odzyska focus
    retry: 2, // Retry 2 razy w przypadku błędu
  });
}



