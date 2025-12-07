import * as React from "react";
import { ReportCard } from "./ReportCard";
import type { ReportListItemDTO } from "@/types";

interface ReportsMobileListProps {
  reports: ReportListItemDTO[];
  onViewReport: (report: ReportListItemDTO) => void;
}

/**
 * Mobile list view for reports (cards)
 */
export function ReportsMobileList({ reports, onViewReport }: ReportsMobileListProps) {
  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard key={report.uuid} report={report} onView={onViewReport} />
      ))}
    </div>
  );
}



