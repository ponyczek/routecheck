import * as React from "react";
import { formatDate } from "@/lib/utils/date";
import { ReportRiskBadge } from "./ReportRiskBadge";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { Clock, MapPin, Calendar } from "lucide-react";
import { useDriversList } from "@/lib/drivers";
import type { ReportDetailDTO } from "@/types";

interface ReportSummaryHeaderProps {
  report: ReportDetailDTO;
}

/**
 * Header section of report detail sheet
 * Shows date, driver, status, and risk level
 */
export function ReportSummaryHeader({ report }: ReportSummaryHeaderProps) {
  // Fetch drivers to get name (cached)
  const { data: driversData } = useDriversList({
    isActive: true,
    includeDeleted: false,
    limit: 100,
  });

  const driver = React.useMemo(() => {
    return driversData?.items.find((d) => d.uuid === report.driverUuid);
  }, [driversData, report.driverUuid]);
  return (
    <div className="space-y-4">
      {/* Date and Risk */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">{formatDate(report.reportDate, "dd MMM yyyy")}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            <span>Zgłoszono: {formatDate(report.occurredAt, "dd MMM yyyy")}</span>
          </div>
        </div>
        <ReportRiskBadge level={report.riskLevel} />
      </div>

      {/* Driver Info */}
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Kierowca</div>
        <div>
          <div className="font-medium">{driver?.name || "Nieznany kierowca"}</div>
          {driver && <div className="text-sm text-muted-foreground">{driver.email}</div>}
        </div>
      </div>

      {/* Status and Timezone */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">Status trasy</div>
          <ReportStatusBadge status={report.routeStatus} />
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Strefa czasowa
          </div>
          <div className="text-sm font-medium">{report.timezone}</div>
        </div>
      </div>

      {/* Delay Info */}
      {report.delayMinutes > 0 && (
        <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-3 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 mb-1">
            <Clock className="h-4 w-4" />
            <span className="font-semibold">Opóźnienie: {report.delayMinutes} minut</span>
          </div>
          {report.delayReason && (
            <div className="text-sm text-orange-600 dark:text-orange-300 mt-1">{report.delayReason}</div>
          )}
        </div>
      )}
    </div>
  );
}
