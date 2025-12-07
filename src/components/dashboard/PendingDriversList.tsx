import * as React from "react";
import { PendingDriverCard } from "./PendingDriverCard";
import type { PendingDriver } from "@/lib/dashboard/types";
import type { Uuid } from "@/types";
import { cn } from "@/lib/utils";

export interface PendingDriversListProps {
  drivers: PendingDriver[];
  onDriverClick?: (driverUuid: Uuid) => void;
  className?: string;
}

/**
 * PendingDriversList - Grid list of drivers awaiting reports
 *
 * Features:
 * - Responsive grid layout
 *   - Desktop (≥1024px): 3 columns
 *   - Tablet (768-1023px): 2 columns
 *   - Mobile (<768px): 1 column
 * - Empty state handled by parent component
 */
export function PendingDriversList({ drivers, onDriverClick, className }: PendingDriversListProps) {
  if (drivers.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <div
      className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
      role="list"
      aria-label="Lista kierowców oczekujących na wysłanie raportu"
    >
      {drivers.map((driver) => (
        <PendingDriverCard key={driver.uuid} driver={driver} onDriverClick={onDriverClick} />
      ))}
    </div>
  );
}
