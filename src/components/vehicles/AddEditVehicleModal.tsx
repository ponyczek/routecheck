import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { VehicleForm } from './VehicleForm';
import { useCreateVehicle } from '@/lib/vehicles/useCreateVehicle';
import { useUpdateVehicle } from '@/lib/vehicles/useUpdateVehicle';
import type { VehicleDTO } from '@/types';
import type { VehicleFormData } from '@/lib/vehicles/validation';

interface AddEditVehicleModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  vehicle?: VehicleDTO;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal do dodawania i edycji pojazdu
 * - Tryb add: pusty formularz
 * - Tryb edit: formularz wypełniony danymi pojazdu
 * - Walidacja z Zod
 * - Optimistic updates przy edycji
 */
export function AddEditVehicleModal({
  isOpen,
  mode,
  vehicle,
  onClose,
  onSuccess,
}: AddEditVehicleModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Reset mutation state przy zamykaniu
  useEffect(() => {
    if (!isOpen) {
      createMutation.reset();
      updateMutation.reset();
    }
  }, [isOpen]);

  const handleSubmit = async (data: VehicleFormData) => {
    if (mode === 'add') {
      await createMutation.mutateAsync({
        registrationNumber: data.registrationNumber,
        vin: data.vin,
        isActive: data.isActive,
      });
      onSuccess();
      onClose();
    } else if (mode === 'edit' && vehicle) {
      await updateMutation.mutateAsync({
        uuid: vehicle.uuid,
        data: {
          registrationNumber: data.registrationNumber,
          vin: data.vin,
          isActive: data.isActive,
        },
      });
      onSuccess();
      onClose();
    }
  };

  const handleFormSubmit = () => {
    // Trigger submit na formularzu wewnątrz (form jest w VehicleForm)
    const form = formRef.current?.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
  };

  const defaultValues = vehicle
    ? {
        registrationNumber: vehicle.registrationNumber,
        vin: vehicle.vin,
        isActive: vehicle.isActive,
      }
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Dodaj pojazd' : 'Edytuj pojazd'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Dodaj nowy pojazd do systemu. Pojazd będzie dostępny do przypisania do kierowców.'
              : 'Edytuj dane pojazdu. Zmiany zostaną zapisane natychmiast.'}
          </DialogDescription>
        </DialogHeader>

        <div ref={formRef}>
          <VehicleForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
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


