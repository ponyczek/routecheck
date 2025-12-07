import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { DriverDTO } from "@/types";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  driver: DriverDTO | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

/**
 * Dialog potwierdzenia usunięcia kierowcy (soft delete)
 * - Ostrzeżenie o skutkach (kierowca zostanie dezaktywowany)
 * - Focus trap na przycisku Anuluj (bezpieczniejsze)
 * - Loading state podczas usuwania
 */
export function DeleteConfirmationDialog({
  isOpen,
  driver,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmationDialogProps) {
  if (!driver) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń kierowcę</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Czy na pewno chcesz usunąć kierowcę{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">{driver.name}</span>?
              </p>
              <p className="text-sm">
                Kierowca zostanie dezaktywowany i ukryty, ale jego historyczne raporty pozostaną widoczne w systemie. Ta
                operacja nie usuwa trwale danych.
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
