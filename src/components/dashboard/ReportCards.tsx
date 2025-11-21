import * as React from "react";
import { ReportCard } from "./ReportCard";
import type { ReportListItemDTO, Uuid } from "@/types";
import { cn } from "@/lib/utils";

export interface ReportCardsProps {
  reports: ReportListItemDTO[];
  onCardClick: (reportUuid: Uuid) => void;
  className?: string;
}

/**
 * ReportCards - Mobile card list view for reports
 *
 * Features:
 * - Vertical stack of report cards
 * - Optimized for mobile/tablet viewports
 * - Gap between cards for visual separation
 * - Empty state handled by parent component
 */
export function ReportCards({ reports, onCardClick, className }: ReportCardsProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-muted-foreground text-lg">Brak raportów na dzisiaj</p>
        <p className="text-sm text-muted-foreground mt-2">
          Raporty pojawią się tutaj po ich wysłaniu przez kierowców
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)} role="list" aria-label="Lista raportów">
      {reports.map((report) => (
        <ReportCard key={report.uuid} report={report} onCardClick={onCardClick} />
      ))}
    </div>
  );
}

