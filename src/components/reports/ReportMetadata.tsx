import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, AlertCircle, ArrowRight, Tag } from "lucide-react";
import type { ReportDetailDTO } from "@/types";

interface ReportMetadataProps {
  report: ReportDetailDTO;
}

/**
 * Displays additional metadata and details about the report
 * Includes cargo damage, vehicle damage, next day blockers, and tags
 */
export function ReportMetadata({ report }: ReportMetadataProps) {
  return (
    <div className="space-y-6">
      {/* Problem Indicator */}
      {report.isProblem && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <AlertCircle className="h-5 w-5" />
            <span>Zgłoszono problem</span>
          </div>
        </div>
      )}

      {/* Cargo Damage */}
      {report.cargoDamageDescription && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-muted-foreground" />
            Uszkodzenie ładunku
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-sm">{report.cargoDamageDescription}</div>
        </div>
      )}

      {/* Vehicle Damage */}
      {report.vehicleDamageDescription && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Truck className="h-4 w-4 text-muted-foreground" />
            Uszkodzenie pojazdu
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-sm">{report.vehicleDamageDescription}</div>
        </div>
      )}

      {/* Next Day Blockers */}
      {report.nextDayBlockers && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            Blokery na kolejny dzień
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-sm">{report.nextDayBlockers}</div>
        </div>
      )}

      {/* Risk Tags */}
      {report.tags && report.tags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Tagi ryzyka
          </div>
          <div className="flex flex-wrap gap-2">
            {report.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* System Info */}
      <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>UUID:</span>
          <span className="font-mono">{report.uuid}</span>
        </div>
        <div className="flex justify-between">
          <span>Utworzono:</span>
          <span>{new Date(report.createdAt).toLocaleString("pl-PL")}</span>
        </div>
        {report.updatedAt && (
          <div className="flex justify-between">
            <span>Zaktualizowano:</span>
            <span>{new Date(report.updatedAt).toLocaleString("pl-PL")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
