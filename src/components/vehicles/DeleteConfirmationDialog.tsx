import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import type { VehicleDTO } from '@/types';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  vehicle: VehicleDTO | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

/**
 * Dialog potwierdzenia usunięcia pojazdu (soft delete)
 * - Ostrzeżenie o skutkach (pojazd zostanie oznaczony jako usunięty)
 * - Focus trap na przycisku Anuluj (bezpieczniejsze)
 * - Loading state podczas usuwania
 */
export function DeleteConfirmationDialog({
  isOpen,
  vehicle,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  if (!vehicle) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń pojazd</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Czy na pewno chcesz usunąć pojazd{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {vehicle.registrationNumber}
                </span>
                ?
              </p>
              <p className="text-sm">
                Pojazd zostanie oznaczony jako usunięty i ukryty, ale jego historia raportów pozostanie
                widoczna w systemie. Ta operacja nie usuwa trwale danych.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


