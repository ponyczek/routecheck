import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RiskBadge } from "./RiskBadge";
import type { RiskBreakdown } from "@/lib/dashboard/types";
import type { ReportRiskLevel } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export interface RiskBreakdownCardProps {
  breakdown: RiskBreakdown;
  onRiskClick?: (riskLevel: ReportRiskLevel) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * RiskBreakdownCard - Displays distribution of reports by risk level
 *
 * Features:
 * - Shows 4 risk levels with counts: NONE, LOW, MEDIUM, HIGH
 * - Each level is a clickable badge (optional)
 * - Grid layout: 2x2 on mobile, 4x1 on desktop
 * - Loading skeleton state
 * - Clicking a badge filters reports or navigates to filtered view
 */
export function RiskBreakdownCard({ breakdown, onRiskClick, isLoading = false, className }: RiskBreakdownCardProps) {
  if (isLoading) {
    return (
      <Card className={cn("col-span-full", className)}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskLevels: { level: ReportRiskLevel; count: number }[] = [
    { level: "NONE", count: breakdown.none },
    { level: "LOW", count: breakdown.low },
    { level: "MEDIUM", count: breakdown.medium },
    { level: "HIGH", count: breakdown.high },
  ];

  return (
    <Card className={cn("col-span-full", className)}>
      <CardHeader>
        <CardTitle className="text-base">Rozkład poziomów ryzyka</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Rozkład raportów według poziomu ryzyka">
          {riskLevels.map(({ level, count }) => (
            <button
              key={level}
              onClick={onRiskClick ? () => onRiskClick(level) : undefined}
              disabled={!onRiskClick}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-3 transition-all",
                onRiskClick
                  ? "cursor-pointer hover:bg-accent hover:shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  : "cursor-default"
              )}
              aria-label={`${count} raportów z poziomem ryzyka ${level}`}
            >
              <RiskBadge level={level} size="sm" showIcon={false} />
              <div className="text-2xl font-bold" aria-live="polite">
                {count}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
