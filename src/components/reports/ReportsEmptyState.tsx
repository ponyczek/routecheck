import * as React from "react";
import { FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReportsEmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Empty state for reports list
 * Shows when no reports match current filters
 */
export function ReportsEmptyState({
  title = "Brak raportów",
  description = "Nie znaleziono raportów spełniających wybrane kryteria. Spróbuj zmienić filtry.",
  className,
}: ReportsEmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center min-h-[400px] p-8 text-center", className)}
      role="status"
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileSearch className="size-10 text-muted-foreground" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}
