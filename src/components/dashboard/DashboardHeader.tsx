import * as React from "react";
import { cn } from "@/lib/utils";
import type { IsoDateString } from "@/types";
import { LastUpdateIndicator } from "./LastUpdateIndicator";
import { RefreshButton } from "./RefreshButton";

export interface DashboardHeaderProps {
  lastUpdatedAt: IsoDateString;
  isRefreshing: boolean;
  onRefresh: () => void;
  className?: string;
}

/**
 * DashboardHeader - Header section for dashboard view
 *
 * Contains:
 * - Page title "Dashboard – Dzisiaj"
 * - LastUpdateIndicator showing time since last update
 * - RefreshButton for manual data refresh
 *
 * Layout:
 * - Desktop: Title left, controls right (flex row)
 * - Mobile: Stacked (flex column)
 */
export function DashboardHeader({ lastUpdatedAt, isRefreshing, onRefresh, className }: DashboardHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard – Dzisiaj</h1>
        <p className="text-muted-foreground">Przegląd dzisiejszych raportów i statusu kierowców</p>
      </div>

      <div className="flex items-center gap-4">
        <LastUpdateIndicator lastUpdatedAt={lastUpdatedAt} />
        <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} />
      </div>
    </header>
  );
}
