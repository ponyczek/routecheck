import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ReportsLoadingSkeletonsProps {
  className?: string;
  view?: "desktop" | "mobile";
}

/**
 * Loading skeletons for reports list
 * Shows skeleton for table (desktop) or cards (mobile)
 */
export function ReportsLoadingSkeletons({ className, view }: ReportsLoadingSkeletonsProps) {
  if (view === "mobile") {
    return (
      <div className={cn("space-y-4", className)} aria-label="Ładowanie raportów" role="status">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
        <span className="sr-only">Ładowanie raportów...</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border", className)} aria-label="Ładowanie raportów" role="status">
      {/* Table header */}
      <div className="border-b bg-muted/50 p-4">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      </div>
      {/* Table rows */}
      <div className="divide-y">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="p-4">
            <div className="flex gap-4 items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20 ml-auto" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Ładowanie raportów...</span>
    </div>
  );
}
