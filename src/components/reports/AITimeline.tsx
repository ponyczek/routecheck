import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, AlertTriangle } from "lucide-react";
import type { ReportAiResultDTO } from "@/types";

interface AITimelineProps {
  aiResult: ReportAiResultDTO | null | undefined;
}

/**
 * Displays AI analysis results in a timeline format
 * Shows AI summary, risk assessment, and tags
 */
export function AITimeline({ aiResult }: AITimelineProps) {
  if (!aiResult) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <div className="text-sm text-muted-foreground">Analiza AI nie jest dostępna dla tego raportu</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Analysis Header */}
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary" />
        <h4 className="font-semibold">Analiza AI</h4>
      </div>

      {/* AI Summary */}
      {aiResult.aiSummary && (
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Podsumowanie
          </div>
          <p className="text-sm leading-relaxed">{aiResult.aiSummary}</p>
        </div>
      )}

      {/* Risk Level from AI */}
      {aiResult.riskLevel && (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ocena ryzyka AI:</span>
          <Badge
            variant="secondary"
            className={
              aiResult.riskLevel === "HIGH"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : aiResult.riskLevel === "MEDIUM"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : aiResult.riskLevel === "LOW"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
            }
          >
            {aiResult.riskLevel === "HIGH"
              ? "Wysokie"
              : aiResult.riskLevel === "MEDIUM"
                ? "Średnie"
                : aiResult.riskLevel === "LOW"
                  ? "Niskie"
                  : "Brak"}
          </Badge>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Utworzono: {new Date(aiResult.createdAt).toLocaleString("pl-PL")}</div>
        {aiResult.updatedAt && <div>Zaktualizowano: {new Date(aiResult.updatedAt).toLocaleString("pl-PL")}</div>}
      </div>
    </div>
  );
}
