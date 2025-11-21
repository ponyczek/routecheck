import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * RefreshButton - Manual data refresh button with debouncing
 *
 * Features:
 * - Spinning icon when refreshing
 * - 2-second debounce to prevent spam
 * - Disabled state during refresh
 * - Accessible with keyboard (Enter/Space)
 * - Tooltip-ready aria-label
 *
 * Example usage:
 * ```tsx
 * <RefreshButton
 *   onRefresh={handleRefresh}
 *   isRefreshing={isLoading}
 * />
 * ```
 */
export function RefreshButton({ onRefresh, isRefreshing, disabled = false, className }: RefreshButtonProps) {
  const [isDebouncing, setIsDebouncing] = React.useState(false);
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleClick = React.useCallback(() => {
    if (isDebouncing || isRefreshing || disabled) {
      return;
    }

    // Trigger refresh
    onRefresh();

    // Start debounce timer (2s)
    setIsDebouncing(true);
    debounceTimeoutRef.current = setTimeout(() => {
      setIsDebouncing(false);
    }, 2000);
  }, [onRefresh, isDebouncing, isRefreshing, disabled]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const isDisabled = isRefreshing || isDebouncing || disabled;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isDisabled}
      className={cn("gap-2", className)}
      aria-label="Odśwież dane dashboardu"
      title="Odśwież dane"
    >
      <RefreshCw
        className={cn("size-4 transition-transform", isRefreshing && "animate-spin")}
        aria-hidden="true"
      />
      <span className="hidden sm:inline">Odśwież</span>
    </Button>
  );
}

