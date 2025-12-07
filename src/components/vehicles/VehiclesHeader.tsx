import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface VehiclesHeaderProps {
  onAddClick: () => void;
}

/**
 * Nagłówek strony z tytułem i przyciskiem dodawania pojazdu
 */
export function VehiclesHeader({ onAddClick }: VehiclesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pojazdy</h1>
        <p className="text-muted-foreground">
          Zarządzaj flotą pojazdów i ich aktywnością
        </p>
      </div>
      <Button onClick={onAddClick} size="default">
        <Plus className="mr-2 h-4 w-4" />
        Dodaj pojazd
      </Button>
    </div>
  );
}


