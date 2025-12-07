import { ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TelemetryMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  className?: string;
}

/**
 * Karta pojedynczej metryki telemetrycznej
 * Wyświetla agregowaną wartość (np. "Mediana czasu wypełnienia: 85s")
 * Opcjonalnie pokazuje trend (np. "↑ 5% vs poprzedni tydzień")
 */
export function TelemetryMetricCard({ label, value, unit, trend, className }: TelemetryMetricCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {value}
              {unit && <span className="text-xl ml-1">{unit}</span>}
            </span>
            {trend && (
              <Badge variant={trend.direction === "up" ? "default" : "secondary"} className="gap-1">
                {trend.direction === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {trend.value}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
