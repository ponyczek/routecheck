import { Badge } from "@/components/ui/badge";
import type { ReportRouteStatus } from "@/types";

interface ReportStatusBadgeProps {
  status: ReportRouteStatus;
  className?: string;
}

/**
 * Badge component for displaying report route status
 * Uses consistent color scheme:
 * - COMPLETED: green
 * - PARTIALLY_COMPLETED: yellow
 * - CANCELLED: red
 */
export function ReportStatusBadge({ status, className }: ReportStatusBadgeProps) {
  const variants: Record<ReportRouteStatus, { label: string; className: string }> = {
    COMPLETED: {
      label: "Ukończono",
      className: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    },
    PARTIALLY_COMPLETED: {
      label: "Częściowo",
      className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    CANCELLED: {
      label: "Anulowano",
      className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const { label, className: variantClassName } = variants[status];

  return (
    <Badge variant="secondary" className={`${variantClassName} ${className || ""}`}>
      {label}
    </Badge>
  );
}



