import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Uuid } from '@/types';
import { toast } from 'sonner';

/**
 * useDeleteAssignment
 * 
 * Hook do usuwania przypisania kierowca-pojazd.
 * Wykonuje hard delete - przypisanie jest całkowicie usuwane z bazy.
 */
export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (uuid: Uuid): Promise<void> => {
      const response = await fetch(`/api/assignments/${uuid}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw { ...error, status: response.status };
      }
      
      // DELETE zwraca 204 No Content - brak body do parsowania
    },
    onSuccess: () => {
      // Invalidate wszystkie queries z assignments aby odświeżyć listę
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Przypisanie zostało usunięte');
    },
    onError: (error: any) => {
      // Błąd 404 - przypisanie zostało już usunięte
      if (error.status === 404) {
        toast.error('Nie znaleziono przypisania. Mogło zostać już usunięte.');
        // Odśwież listę aby usunąć nieistniejące przypisanie z UI
        queryClient.invalidateQueries({ queryKey: ['assignments'] });
        return;
      }
      
      // Pozostałe błędy (403, błędy sieciowe itp.)
      toast.error(error.message || 'Nie udało się usunąć przypisania');
    },
  });
}


