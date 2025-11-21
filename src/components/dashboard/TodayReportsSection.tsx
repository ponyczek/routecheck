import * as React from "react";
import { cn } from "@/lib/utils";
import { ReportsTable } from "./ReportsTable";
import { ReportCards } from "./ReportCards";
import type { ReportListItemDTO, Uuid } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export interface TodayReportsSectionProps {
  reports: ReportListItemDTO[];
  isLoading?: boolean;
  onReportClick: (reportUuid: Uuid) => void;
  className?: string;
}

/**
 * TodayReportsSection - Section displaying today's reports
 *
 * Features:
 * - Responsive: Table on desktop (≥768px), Cards on mobile (<768px)
 * - Section header with title
 * - Loading skeleton state
 * - Empty state with helpful message
 *
 * Layout:
 * - Desktop: ReportsTable (horizontal scrollable)
 * - Mobile: ReportCards (vertical stack)
 */
export function TodayReportsSection({
  reports,
  isLoading = false,
  onReportClick,
  className,
}: TodayReportsSectionProps) {
  if (isLoading) {
    return (
      <section className={cn("space-y-4", className)} aria-label="Dzisiejsze raporty">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("space-y-4", className)} aria-labelledby="today-reports-title">
      {/* Section Header */}
      <div>
        <h2 id="today-reports-title" className="text-2xl font-semibold tracking-tight">
          Dzisiejsze raporty
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {reports.length === 0
            ? "Brak raportów"
            : `${reports.length} ${reports.length === 1 ? "raport" : reports.length < 5 ? "raporty" : "raportów"}`}
        </p>
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block">
        <ReportsTable reports={reports} onRowClick={onReportClick} />
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden">
        <ReportCards reports={reports} onCardClick={onReportClick} />
      </div>
    </section>
  );
}

