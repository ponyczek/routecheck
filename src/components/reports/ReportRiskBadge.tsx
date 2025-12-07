import { Badge } from "@/components/ui/badge";
import type { ReportRiskLevel } from "@/types";

interface ReportRiskBadgeProps {
  level: ReportRiskLevel | null;
  className?: string;
}

/**
 * Badge component for displaying report risk level
 * Uses consistent color scheme:
 * - NONE: gray
 * - LOW: blue
 * - MEDIUM: yellow
 * - HIGH: red
 */
export function ReportRiskBadge({ level, className }: ReportRiskBadgeProps) {
  if (!level || level === "NONE") {
    return (
      <Badge variant="secondary" className={className}>
        Brak
      </Badge>
    );
  }

  const variants: Record<Exclude<ReportRiskLevel, "NONE">, { label: string; className: string }> = {
    LOW: {
      label: "Niskie",
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    MEDIUM: {
      label: "Średnie",
      className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    HIGH: {
      label: "Wysokie",
      className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const { label, className: variantClassName } = variants[level];

  return (
    <Badge variant="secondary" className={`${variantClassName} ${className || ""}`}>
      {label}
    </Badge>
  );
}



