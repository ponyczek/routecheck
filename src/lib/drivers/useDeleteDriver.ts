import { useMutation, useQueryClient } from '@tanstack/react-query';
import { driversService } from '@/lib/services/driversService';
import { driversKeys } from './queryKeys';
import { toast } from 'sonner';

/**
 * Hook do usuwania kierowcy (soft delete)
 * Automatycznie invaliduje cache i wyświetla toast z wynikiem
 */
export function useDeleteDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) => driversService.delete(uuid),
    onSuccess: () => {
      // Invalidate wszystkie listy kierowców
      queryClient.invalidateQueries({ queryKey: driversKeys.lists() });
      toast.success('Kierowca został usunięty');
    },
    onError: (error: any) => {
      // Obsługa błędów
      if (error.response?.status === 404) {
        toast.error('Kierowca nie został znaleziony');
      } else if (error.response?.status === 403) {
        toast.error('Brak uprawnień do usunięcia kierowcy');
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || 'Nie można usunąć kierowcy';
        toast.error(message);
      } else {
        toast.error('Nie udało się usunąć kierowcy');
      }
    },
  });
}



