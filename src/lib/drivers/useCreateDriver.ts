import { useMutation, useQueryClient } from '@tanstack/react-query';
import { driversService } from '@/lib/services/driversService';
import { driversKeys } from './queryKeys';
import { toast } from 'sonner';
import type { CreateDriverCommand } from '@/types';

/**
 * Hook do tworzenia nowego kierowcy
 * Automatycznie invaliduje cache i wyświetla toast z wynikiem
 */
export function useCreateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDriverCommand) => driversService.create(data),
    onSuccess: () => {
      // Invalidate wszystkie listy kierowców
      queryClient.invalidateQueries({ queryKey: driversKeys.lists() });
      toast.success('Kierowca został dodany pomyślnie');
    },
    onError: (error: any) => {
      // Obsługa specyficznych błędów
      if (error.response?.status === 409) {
        toast.error('Kierowca z tym adresem e-mail już istnieje');
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || 'Nieprawidłowe dane';
        toast.error(message);
      } else if (error.response?.status === 403) {
        toast.error('Brak uprawnień do dodania kierowcy');
      } else {
        toast.error('Nie udało się dodać kierowcy');
      }
    },
  });
}



