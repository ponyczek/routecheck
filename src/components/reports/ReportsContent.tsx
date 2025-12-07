import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ReportsTable } from "./ReportsTable";
import { ReportsMobileList } from "./ReportsMobileList";
import { ReportsLoadingSkeletons } from "./ReportsLoadingSkeletons";
import { ReportsErrorState } from "./ReportsErrorState";
import { ReportsEmptyState } from "./ReportsEmptyState";
import type { ReportListItemDTO } from "@/types";

interface ReportsContentProps {
  reports: ReportListItemDTO[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onViewReport: (report: ReportListItemDTO) => void;
  onLoadMore: () => void;
  onRetry: () => void;
}

/**
 * Main content container for reports list
 * Handles responsive view switching (desktop table / mobile cards)
 * and loading/error/empty states
 */
export function ReportsContent({
  reports,
  isLoading,
  isError,
  errorMessage,
  hasNextPage,
  isFetchingNextPage,
  onViewReport,
  onLoadMore,
  onRetry,
}: ReportsContentProps) {
  // Error state
  if (isError) {
    return (
      <ReportsErrorState
        message={errorMessage || "Wystąpił nieoczekiwany błąd."}
        onRetry={onRetry}
      />
    );
  }

  // Initial loading state
  if (isLoading) {
    return (
      <>
        <div className="hidden md:block">
          <ReportsLoadingSkeletons view="desktop" />
        </div>
        <div className="md:hidden">
          <ReportsLoadingSkeletons view="mobile" />
        </div>
      </>
    );
  }

  // Empty state
  if (reports.length === 0) {
    return <ReportsEmptyState />;
  }

  // Data view
  return (
    <div className="space-y-4">
      {/* Desktop table view */}
      <div className="hidden md:block">
        <ReportsTable reports={reports} onViewReport={onViewReport} />
      </div>

      {/* Mobile cards view */}
      <div className="md:hidden">
        <ReportsMobileList reports={reports} onViewReport={onViewReport} />
      </div>

      {/* Load more button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="gap-2"
          >
            {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
            {isFetchingNextPage ? "Ładowanie..." : "Załaduj więcej"}
          </Button>
        </div>
      )}
    </div>
  );
}



