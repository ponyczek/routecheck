import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReportRiskLevel } from "@/types";
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";

export interface RiskBadgeProps {
  level: ReportRiskLevel;
  showIcon?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * RiskBadge - Badge displaying risk level with WCAG-compliant colors
 *
 * Color schemes:
 * - NONE: Green (safe)
 * - LOW: Blue (informational)
 * - MEDIUM: Orange (warning)
 * - HIGH: Red (danger)
 *
 * All combinations meet WCAG AA contrast requirements
 */
export function RiskBadge({ level, showIcon = true, onClick, size = "md", className }: RiskBadgeProps) {
  // Map risk level to display text (Polish)
  const riskLabels: Record<ReportRiskLevel, string> = {
    NONE: "Brak",
    LOW: "Niskie",
    MEDIUM: "Średnie",
    HIGH: "Wysokie",
  };

  // Map risk level to icon
  const RiskIcon = React.useMemo(() => {
    switch (level) {
      case "NONE":
        return CheckCircle;
      case "LOW":
        return Info;
      case "MEDIUM":
        return AlertTriangle;
      case "HIGH":
        return AlertCircle;
      default:
        return Info;
    }
  }, [level]);

  // Map risk level to Tailwind classes (WCAG compliant)
  const riskStyles: Record<ReportRiskLevel, string> = {
    NONE: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
    LOW: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    MEDIUM:
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800",
    HIGH: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
  };

  // Size variants
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "size-3",
    md: "size-4",
    lg: "size-5",
  };

  return (
    <Badge
      className={cn(
        riskStyles[level],
        sizeClasses[size],
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={`Poziom ryzyka: ${riskLabels[level]}`}
    >
      {showIcon && <RiskIcon className={iconSizes[size]} aria-hidden="true" />}
      <span>{riskLabels[level]}</span>
    </Badge>
  );
}

