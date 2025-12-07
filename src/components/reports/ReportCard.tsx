import * as React from "react";
import { formatDate } from "@/lib/utils/date";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Clock, AlertTriangle } from "lucide-react";
import { ReportRiskBadge } from "./ReportRiskBadge";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { useDriversList } from "@/lib/drivers";
import type { ReportListItemDTO } from "@/types";

interface ReportCardProps {
  report: ReportListItemDTO;
  onView: (report: ReportListItemDTO) => void;
}

/**
 * Single card in the reports list (mobile view)
 */
export function ReportCard({ report, onView }: ReportCardProps) {
  // Fetch drivers to get names (cached)
  const { data: driversData } = useDriversList({
    isActive: true,
    includeDeleted: false,
    limit: 100,
  });

  const driver = React.useMemo(() => {
    return driversData?.items.find((d) => d.uuid === report.driverUuid);
  }, [driversData, report.driverUuid]);
  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => onView(report)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(report);
        }
      }}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: Date and Risk */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">{formatDate(report.reportDate, "dd MMM yyyy")}</div>
            <div className="text-xs text-muted-foreground">
              {report.occurredAt && formatDate(report.occurredAt, "dd MMM yyyy")}
            </div>
          </div>
          <ReportRiskBadge level={report.riskLevel} />
        </div>

        {/* Driver and Status */}
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Kierowca:</div>
          <div className="text-sm font-medium truncate">
            {driver?.name || report.driverUuid.substring(0, 8) + "..."}
          </div>
          <ReportStatusBadge status={report.routeStatus} className="ml-auto" />
        </div>

        {/* Delay info */}
        {report.delayMinutes > 0 && (
          <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
            <Clock className="h-4 w-4" />
            <span>Opóźnienie: {report.delayMinutes} min</span>
          </div>
        )}

        {/* Problem indicator */}
        {report.isProblem && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>Zgłoszono problem</span>
          </div>
        )}

        {/* AI Summary */}
        {report.ai && report.ai.aiSummary && (
          <div className="text-sm text-muted-foreground line-clamp-2">
            {report.ai.aiSummary}
          </div>
        )}

        {/* View button */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(report);
            }}
            className="w-full gap-2"
          >
            <Eye className="h-4 w-4" />
            Zobacz szczegóły
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

