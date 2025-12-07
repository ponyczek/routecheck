import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DriverForm } from "./DriverForm";
import { useCreateDriver } from "@/lib/drivers/useCreateDriver";
import { useUpdateDriver } from "@/lib/drivers/useUpdateDriver";
import type { DriverDTO } from "@/types";
import type { DriverFormData } from "@/lib/drivers/validation";

interface AddEditDriverModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  driver?: DriverDTO;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal do dodawania i edycji kierowcy
 * - Tryb add: pusty formularz
 * - Tryb edit: formularz wypełniony danymi kierowcy
 * - Walidacja z Zod
 * - Optimistic updates przy edycji
 * - Unsaved changes guard (TODO)
 */
export function AddEditDriverModal({ isOpen, mode, driver, onClose, onSuccess }: AddEditDriverModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Reset mutation state przy zamykaniu
  useEffect(() => {
    if (!isOpen) {
      createMutation.reset();
      updateMutation.reset();
    }
  }, [isOpen]);

  const handleSubmit = async (data: DriverFormData) => {
    if (mode === "add") {
      await createMutation.mutateAsync({
        name: data.name,
        email: data.email,
        timezone: data.timezone,
        isActive: data.isActive,
      });
      onSuccess();
      onClose();
    } else if (mode === "edit" && driver) {
      await updateMutation.mutateAsync({
        uuid: driver.uuid,
        data: {
          name: data.name,
          email: data.email,
          timezone: data.timezone,
          isActive: data.isActive,
        },
      });
      onSuccess();
      onClose();
    }
  };

  const handleFormSubmit = () => {
    // Trigger submit na formularzu wewnątrz (form jest w DriverForm)
    const form = formRef.current?.querySelector("form");
    if (form) {
      form.requestSubmit();
    }
  };

  const defaultValues = driver
    ? {
        name: driver.name,
        email: driver.email,
        timezone: driver.timezone,
        isActive: driver.isActive,
      }
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Dodaj kierowcę" : "Edytuj kierowcę"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Dodaj nowego kierowcę do systemu. Kierowca będzie otrzymywać codzienne linki do raportów."
              : "Edytuj dane kierowcy. Zmiany zostaną zapisane natychmiast."}
          </DialogDescription>
        </DialogHeader>

        <div ref={formRef}>
          <DriverForm defaultValues={defaultValues} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Anuluj
          </Button>
          <Button onClick={handleFormSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
