import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DriversHeaderProps {
  onAddClick: () => void;
}

/**
 * Nagłówek strony z tytułem i przyciskiem dodawania kierowcy
 */
export function DriversHeader({ onAddClick }: DriversHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kierowcy</h1>
        <p className="text-muted-foreground">Zarządzaj bazą kierowców i ich aktywnością</p>
      </div>
      <Button onClick={onAddClick} size="default">
        <Plus className="mr-2 h-4 w-4" />
        Dodaj kierowcę
      </Button>
    </div>
  );
}
