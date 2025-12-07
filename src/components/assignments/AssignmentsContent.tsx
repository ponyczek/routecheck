import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AssignmentsTable } from "./AssignmentsTable";
import { AssignmentCards } from "./AssignmentCards";
import { EmptyState } from "./EmptyState";
import type { AssignmentViewModel } from "@/lib/assignments/assignmentTypes";
import type { AssignmentDTO } from "@/types";

interface AssignmentsContentProps {
  assignments: AssignmentViewModel[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onEdit: (assignment: AssignmentDTO) => void;
  onDelete: (assignment: AssignmentDTO) => void;
  onRetry: () => void;
  onAddClick: () => void;
  hasActiveFilters: boolean;
  sortBy: "startDate" | "endDate" | "createdAt";
  sortDir: "asc" | "desc";
  onSortChange: (sortBy: string, sortDir: "asc" | "desc") => void;
}

/**
 * AssignmentsContent
 *
 * Wrapper odpowiedzialny za wyświetlanie odpowiedniego stanu listy przypisań:
 * loading, error, empty state lub właściwa zawartość (table/cards).
 */
export function AssignmentsContent({
  assignments,
  isLoading,
  isError,
  error,
  onEdit,
  onDelete,
  onRetry,
  onAddClick,
  hasActiveFilters,
  sortBy,
  sortDir,
  onSortChange,
}: AssignmentsContentProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-card">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nie udało się załadować przypisań</h3>
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          {error?.message || "Wystąpił nieoczekiwany błąd podczas pobierania danych"}
        </p>
        <Button onClick={onRetry}>Spróbuj ponownie</Button>
      </div>
    );
  }

  // Empty state
  if (assignments.length === 0) {
    return <EmptyState onAddClick={onAddClick} hasFilters={hasActiveFilters} />;
  }

  // Success state - renderuj zarówno table (desktop) jak i cards (mobile)
  // Responsywność zapewniona przez CSS w każdym komponencie
  return (
    <div className="space-y-4">
      <AssignmentsTable
        assignments={assignments}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={onSortChange}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <AssignmentCards assignments={assignments} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
