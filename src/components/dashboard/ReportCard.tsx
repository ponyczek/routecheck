import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "./RiskBadge";
import type { ReportListItemDTO, Uuid } from "@/types";
import { Eye, Clock } from "lucide-react";

export interface ReportCardProps {
  report: ReportListItemDTO;
  onCardClick: (reportUuid: Uuid) => void;
}

/**
 * ReportCard - Mobile card view for a single report
 *
 * Features:
 * - Compact layout optimized for mobile
 * - Driver name and date in header
 * - Route status, delay, and risk level in content
 * - "Zobacz szczegóły" button
 * - Click anywhere on card to view details
 */
export function ReportCard({ report, onCardClick }: ReportCardProps) {
  const handleClick = () => {
    onCardClick(report.uuid);
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
    <Card
      className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
      onClick={handleClick}
      role="article"
      aria-label={`Raport kierowcy z dnia ${new Date(report.reportDate).toLocaleDateString("pl-PL")}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{report.driverUuid}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(report.reportDate).toLocaleDateString("pl-PL", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <RiskBadge level={riskLevel} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Route Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status trasy:</span>
          <span className="font-medium">{routeStatusLabels[report.routeStatus]}</span>
        </div>

        {/* Delay */}
        {report.delayMinutes > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Opóźnienie:</span>
            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
              <Clock className="size-3" />+{report.delayMinutes} min
            </span>
          </div>
        )}

        {/* AI Summary (if available) */}
        {report.ai?.aiSummary && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground line-clamp-2">{report.ai.aiSummary}</p>
          </div>
        )}

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            handleClick();
          }}
        >
          <Eye className="size-4" />
          Zobacz szczegóły
        </Button>
      </CardContent>
    </Card>
  );
}
