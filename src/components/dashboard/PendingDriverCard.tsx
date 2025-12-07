import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PendingDriver } from "@/lib/dashboard/types";
import type { Uuid } from "@/types";
import { User, Mail, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PendingDriverCardProps {
  driver: PendingDriver;
  onDriverClick?: (driverUuid: Uuid) => void;
  className?: string;
}

/**
 * PendingDriverCard - Card for a driver who hasn't submitted a report today
 *
 * Features:
 * - Driver avatar with initials
 * - Driver name and email
 * - Vehicle registration (if available)
 * - Time since link was sent (if available)
 * - Click to view driver profile or contact
 * - Accent border to draw attention
 */
export function PendingDriverCard({ driver, onDriverClick, className }: PendingDriverCardProps) {
  const handleClick = () => {
    if (onDriverClick) {
      onDriverClick(driver.uuid);
    }
  };

  // Generate initials from driver name
  const initials = driver.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className={cn(
        "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20",
        onDriverClick && "cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
      onClick={onDriverClick ? handleClick : undefined}
      role="article"
      aria-label={`Kierowca ${driver.name} - oczekuje na raport`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="size-12 shrink-0">
            <AvatarFallback className="bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Driver Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="font-semibold text-sm truncate">{driver.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{driver.email}</span>
              </div>
            </div>

            {/* Vehicle Registration */}
            {driver.vehicleRegistration && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Truck className="size-3 shrink-0" />
                <span>{driver.vehicleRegistration}</span>
              </div>
            )}

            {/* Link Sent Time */}
            {driver.linkSentAt && (
              <p className="text-xs text-muted-foreground">
                Link wysłany: {new Date(driver.linkSentAt).toLocaleTimeString("pl-PL")}
              </p>
            )}

            {/* Action Button */}
            {onDriverClick && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                <User className="size-4" />
                Zobacz profil
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
