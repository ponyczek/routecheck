import { Progress } from "@/components/ui/progress";
import type { ExportProgressSectionProps } from "@/lib/reports/export/types";

/**
 * Progress section displayed during CSV export
 * Shows indeterminate progress bar and status message
 */
export function ExportProgressSection({ isExporting }: ExportProgressSectionProps) {
  if (!isExporting) return null;

  return (
    <div className="space-y-2" role="status" aria-live="polite">
      <Progress value={undefined} className="w-full" />
      <p className="text-sm text-muted-foreground">Przygotowuję eksport...</p>
    </div>
  );
}
