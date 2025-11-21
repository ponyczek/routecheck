import * as React from "react";
import { cn } from "@/lib/utils";
import { MetricCard } from "./MetricCard";
import type { MetricsData } from "@/lib/dashboard/types";
import { Users, FileCheck, Clock, AlertTriangle } from "lucide-react";

export interface MetricsCardsGridProps {
  metrics: MetricsData;
  isLoading?: boolean;
  onPendingClick?: () => void;
  className?: string;
}

/**
 * MetricsCardsGrid - Grid container displaying key dashboard metrics
 *
 * Layout:
 * - Desktop (≥1024px): 4 columns
 * - Tablet (768-1023px): 2 columns
 * - Mobile (<768px): 1 column
 *
 * Cards:
 * 1. Total Active Drivers (Users icon)
 * 2. Submitted Reports (FileCheck icon)
 * 3. Pending Reports (Clock icon, clickable)
 * 4. Risk Breakdown (handled by RiskBreakdownCard - separate component)
 */
export function MetricsCardsGrid({ metrics, isLoading = false, onPendingClick, className }: MetricsCardsGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
      role="region"
      aria-label="Metryki dashboardu"
    >
      <MetricCard
        title="Aktywni kierowcy"
        value={metrics.totalActiveDrivers}
        icon={<Users className="size-5" />}
        isLoading={isLoading}
      />

      <MetricCard
        title="Wysłane raporty"
        value={metrics.submittedCount}
        icon={<FileCheck className="size-5" />}
        isLoading={isLoading}
        variant="accent"
      />

      <MetricCard
        title="Oczekujące raporty"
        value={metrics.pendingCount}
        icon={<Clock className="size-5" />}
        description={onPendingClick ? "Kliknij aby zobaczyć listę" : undefined}
        onClick={onPendingClick}
        isLoading={isLoading}
      />

      <MetricCard
        title="Raporty z problemami"
        value={
          metrics.riskBreakdown.low +
          metrics.riskBreakdown.medium +
          metrics.riskBreakdown.high
        }
        icon={<AlertTriangle className="size-5" />}
        isLoading={isLoading}
      />
    </div>
  );
}

