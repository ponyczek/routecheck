import * as React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "./RiskBadge";
import type { ReportListItemDTO, Uuid } from "@/types";
import { Eye } from "lucide-react";

export interface ReportRowProps {
  report: ReportListItemDTO;
  onRowClick: (reportUuid: Uuid) => void;
}

/**
 * ReportRow - Single table row displaying a report
 *
 * Columns:
 * 1. Driver Name
 * 2. Route Status (badge)
 * 3. Delay (minutes, only if > 0)
 * 4. Risk Level (RiskBadge)
 * 5. Actions (View button)
 *
 * Features:
 * - Clickable row (hover effect)
 * - Risk level with color coding
 * - Route status translation
 */
export function ReportRow({ report, onRowClick }: ReportRowProps) {
  const handleClick = () => {
    onRowClick(report.uuid);
  };

  // Map route status to Polish labels
  const routeStatusLabels = {
    COMPLETED: "Ukończona",
    PARTIALLY_COMPLETED: "Częściowo ukończona",
    CANCELLED: "Anulowana",
  };

  // Get risk level from AI or fallback to report level
  const riskLevel = report.ai?.riskLevel || report.riskLevel || "NONE";

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleClick}
    >
      {/* Driver Name */}
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span>{report.driverUuid}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(report.reportDate).toLocaleDateString("pl-PL")}
          </span>
        </div>
      </TableCell>

      {/* Route Status */}
      <TableCell>
        <span className="text-sm">{routeStatusLabels[report.routeStatus]}</span>
      </TableCell>

      {/* Delay */}
      <TableCell>
        {report.delayMinutes > 0 ? (
          <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
            +{report.delayMinutes} min
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Risk Level */}
      <TableCell>
        <RiskBadge level={riskLevel} size="sm" />
      </TableCell>

      {/* Actions */}
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            handleClick();
          }}
          aria-label={`Zobacz szczegóły raportu`}
        >
          <Eye className="size-4" />
          <span className="hidden xl:inline ml-1">Szczegóły</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}

