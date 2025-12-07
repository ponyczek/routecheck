import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, AlertCircle } from "lucide-react";
import { useReportDetail } from "@/lib/reports";
import { ReportSummaryHeader } from "./ReportSummaryHeader";
import { AITimeline } from "./AITimeline";
import { ReportMetadata } from "./ReportMetadata";
import type { ReportDetailDTO } from "@/types";

interface ReportDetailSheetProps {
  reportId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (report: ReportDetailDTO) => void;
}

/**
 * Side panel (Sheet) displaying full report details
 * Includes summary, AI analysis, and metadata
 * Loads data dynamically when opened
 */
export function ReportDetailSheet({ reportId, isOpen, onClose, onEdit }: ReportDetailSheetProps) {
  const { data: report, isLoading, isError, error } = useReportDetail(reportId, true, true);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Szczegóły raportu</SheetTitle>
          <SheetDescription>Pełne informacje o raporcie z analizą AI</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Loading state */}
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nie udało się załadować raportu</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd"}
              </p>
              <Button onClick={onClose} variant="outline">
                Zamknij
              </Button>
            </div>
          )}

          {/* Data loaded */}
          {report && !isLoading && !isError && (
            <>
              {/* Header with summary */}
              <ReportSummaryHeader report={report} />

              {/* Divider */}
              <div className="border-t" />

              {/* AI Analysis */}
              <AITimeline aiResult={report.ai} />

              {/* Divider */}
              <div className="border-t" />

              {/* Additional Metadata */}
              <ReportMetadata report={report} />

              {/* Edit Button */}
              {onEdit && (
                <div className="pt-4 border-t">
                  <Button onClick={() => onEdit(report)} className="w-full gap-2" variant="outline">
                    <Edit className="h-4 w-4" />
                    Edytuj raport
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
