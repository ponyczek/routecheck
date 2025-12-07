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
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { AssignmentViewModel } from "@/lib/assignments/assignmentTypes";

interface DeleteAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentViewModel | null;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

/**
 * DeleteAssignmentDialog
 *
 * Dialog potwierdzenia usunięcia przypisania kierowca-pojazd.
 * Wyświetla szczegóły przypisania i ostrzeżenie przed usunięciem.
 */
export function DeleteAssignmentDialog({
  isOpen,
  onClose,
  assignment,
  onConfirm,
  isDeleting = false,
}: DeleteAssignmentDialogProps) {
  if (!assignment) return null;

  const { driverName, vehicleRegistration, assignment: assignmentData } = assignment;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: pl });
  };

  const handleConfirm = async () => {
    await onConfirm();
    // onClose będzie wywołane przez rodzica po sukcesie
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć to przypisanie?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta akcja jest nieodwracalna. Przypisanie zostanie trwale usunięte z systemu.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Assignment Details */}
        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kierowca:</span>
            <span className="font-medium">{driverName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pojazd:</span>
            <span className="font-medium">{vehicleRegistration}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data rozpoczęcia:</span>
            <span className="font-medium">{formatDate(assignmentData.startDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data zakończenia:</span>
            <span className="font-medium">
              {assignmentData.endDate ? formatDate(assignmentData.endDate) : "Bezterminowe"}
            </span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
