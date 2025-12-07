import * as React from "react";
import { cn } from "@/lib/utils";
import { PendingDriversList } from "./PendingDriversList";
import type { PendingDriver } from "@/lib/dashboard/types";
import type { Uuid } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle } from "lucide-react";

export interface PendingDriversSectionProps {
  pendingDrivers: PendingDriver[];
  isLoading?: boolean;
  onDriverClick?: (driverUuid: Uuid) => void;
  className?: string;
}

/**
 * PendingDriversSection - Section displaying drivers without reports today
 *
 * Features:
 * - Section header with title and count
 * - Grid of pending driver cards
 * - Loading skeleton state
 * - Positive empty state when all drivers submitted reports
 *
 * Empty state message: "Wszyscy kierowcy wysłali raporty! 🎉"
 */
export function PendingDriversSection({
  pendingDrivers,
  isLoading = false,
  onDriverClick,
  className,
}: PendingDriversSectionProps) {
  if (isLoading) {
    return (
      <section className={cn("space-y-4", className)} aria-label="Oczekujące raporty">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("space-y-4", className)} aria-labelledby="pending-drivers-title">
      {/* Section Header */}
      <div>
        <h2 id="pending-drivers-title" className="text-2xl font-semibold tracking-tight">
          Oczekujące raporty
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {pendingDrivers.length === 0
            ? "Wszyscy kierowcy wysłali raporty"
            : `${pendingDrivers.length} ${pendingDrivers.length === 1 ? "kierowca" : pendingDrivers.length < 5 ? "kierowców" : "kierowców"} jeszcze nie wysłało raportu`}
        </p>
      </div>

      {/* Empty State - All reports submitted */}
      {pendingDrivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="size-16 text-green-600 dark:text-green-400 mb-4" aria-hidden="true" />
          <p className="text-lg font-semibold text-green-900 dark:text-green-100">
            Wszyscy kierowcy wysłali raporty! 🎉
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-2 text-center max-w-md">
            Świetna robota! Wszystkie raporty na dzisiaj zostały już złożone.
          </p>
        </div>
      ) : (
        <PendingDriversList drivers={pendingDrivers} onDriverClick={onDriverClick} />
      )}
    </section>
  );
}
