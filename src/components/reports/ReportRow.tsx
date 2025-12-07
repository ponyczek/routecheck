import * as React from "react";
import { formatDate } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { ReportRiskBadge } from "./ReportRiskBadge";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { useDriversList } from "@/lib/drivers";
import type { ReportListItemDTO } from "@/types";

interface ReportRowProps {
  report: ReportListItemDTO;
  onView: (report: ReportListItemDTO) => void;
}

/**
 * Single row in the reports table (desktop view)
 */
export function ReportRow({ report, onView }: ReportRowProps) {
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
    <tr
      className="hover:bg-muted/50 cursor-pointer transition-colors"
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
      <td className="p-4">
        <div className="font-medium">{formatDate(report.reportDate, "dd MMM yyyy")}</div>
        <div className="text-xs text-muted-foreground">
          {report.occurredAt && formatDate(report.occurredAt, "dd MMM yyyy")}
        </div>
      </td>
      <td className="p-4">
        <div className="font-medium">{driver?.name || "Nieznany kierowca"}</div>
        <div className="text-xs text-muted-foreground">
          {driver?.email || report.driverUuid.substring(0, 8)}
        </div>
      </td>
      <td className="p-4">
        <ReportStatusBadge status={report.routeStatus} />
      </td>
      <td className="p-4">
        <ReportRiskBadge level={report.riskLevel} />
      </td>
      <td className="p-4">
        {report.delayMinutes > 0 && (
          <div className="text-sm">
            <span className="font-medium">{report.delayMinutes}</span>
            <span className="text-muted-foreground ml-1">min</span>
          </div>
        )}
      </td>
      <td className="p-4">
        {report.ai && (
          <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
            {report.ai.aiSummary}
          </div>
        )}
      </td>
      <td className="p-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onView(report);
          }}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Szczegóły
        </Button>
      </td>
    </tr>
  );
}

