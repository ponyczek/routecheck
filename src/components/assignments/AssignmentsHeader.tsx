import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AssignmentsHeaderProps {
  onAddClick: () => void;
  viewMode?: 'table' | 'timeline';
  onViewModeChange?: (mode: 'table' | 'timeline') => void;
}

/**
 * AssignmentsHeader
 * 
 * Nagłówek strony przypisań zawierający tytuł, przycisk dodawania
 * i opcjonalny toggle dla przełączania widoku.
 */
export function AssignmentsHeader({ 
  onAddClick, 
  viewMode, 
  onViewModeChange 
}: AssignmentsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Przypisania kierowca-pojazd
        </h1>
        <p className="text-muted-foreground mt-1">
          Zarządzaj harmonogramem przypisań kierowców do pojazdów
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Opcjonalny toggle widoku - na razie ukryty, można aktywować później */}
        {/* {viewMode && onViewModeChange && (
          <Tabs value={viewMode} onValueChange={onViewModeChange as any}>
            <TabsList>
              <TabsTrigger value="table">Tabela</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </Tabs>
        )} */}
        
        <Button onClick={onAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj przypisanie
        </Button>
      </div>
    </div>
  );
}


