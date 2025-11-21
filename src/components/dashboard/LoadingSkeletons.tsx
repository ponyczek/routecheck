import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface LoadingSkeletonsProps {
  className?: string;
}

/**
 * LoadingSkeletons - Complete loading skeleton for dashboard view
 *
 * Mimics the structure of the full dashboard:
 * - Header with title and controls
 * - 4 metric cards grid
 * - Reports section with table/cards
 * - Pending drivers section
 *
 * Features:
 * - Matches actual component dimensions
 * - Responsive layout (same breakpoints as real content)
 * - Smooth loading animation
 */
export function LoadingSkeletons({ className }: LoadingSkeletonsProps) {
  return (
    <div className={cn("space-y-8", className)} aria-label="Ładowanie danych dashboardu" role="status">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Metrics Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-10 w-16" />
          </div>
        ))}
      </div>

      {/* Risk Breakdown Card Skeleton */}
      <div className="rounded-xl border p-6 space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Today Reports Section Skeleton */}
      <div className="space-y-4">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>

        {/* Desktop Table Skeleton */}
        <div className="hidden md:block rounded-md border">
          <div className="p-4 border-b">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          </div>
          <div className="divide-y">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4">
                <div className="flex gap-4 items-center">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Cards Skeleton */}
        <div className="md:hidden space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Pending Drivers Section Skeleton */}
      <div className="space-y-4">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Ładowanie danych dashboardu...</span>
    </div>
  );
}

