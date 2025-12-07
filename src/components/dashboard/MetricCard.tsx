import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface MetricCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  description?: string;
  onClick?: () => void;
  variant?: "default" | "accent";
  isLoading?: boolean;
  className?: string;
}

/**
 * MetricCard - Displays a single metric with icon, title, and large value
 *
 * Features:
 * - Optional icon
 * - Large prominent value display
 * - Optional description text
 * - Optional click handler (makes card interactive)
 * - Loading skeleton state
 * - Two visual variants: default and accent
 */
export function MetricCard({
  title,
  value,
  icon,
  description,
  onClick,
  variant = "default",
  isLoading = false,
  className,
}: MetricCardProps) {
  const isInteractive = !!onClick;

  if (isLoading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-16" />
          {description && <Skeleton className="h-3 w-full" />}
        </div>
      </Card>
    );
  }

  const CardWrapper = isInteractive ? "button" : "div";

  return (
    <CardWrapper
      onClick={onClick}
      className={cn(
        "text-left w-full",
        isInteractive &&
          "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
      )}
      aria-label={onClick ? `${title}: ${value}. Kliknij aby zobaczyć szczegóły` : undefined}
    >
      <Card
        className={cn("h-full transition-colors", variant === "accent" && "border-primary/20 bg-primary/5", className)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={cn(
                  "flex items-center justify-center size-10 rounded-lg",
                  variant === "accent" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
                aria-hidden="true"
              >
                {icon}
              </div>
            )}
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-3xl font-bold tracking-tight" aria-live="polite">
            {value.toLocaleString("pl-PL")}
          </div>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </CardContent>
      </Card>
    </CardWrapper>
  );
}
