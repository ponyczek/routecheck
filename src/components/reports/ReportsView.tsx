import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReportsParams, useReports } from "@/lib/reports";
import { getErrorMessage } from "@/lib/reports/api";
import { useAuthContext } from "@/lib/layout/useAuthContext";
import { ReportsHeader } from "./ReportsHeader";
import { ReportsFilterBar } from "./ReportsFilterBar";
import { ReportsContent } from "./ReportsContent";
import { ReportDetailSheet } from "./ReportDetailSheet";
import { ReportFormDialog } from "./ReportFormDialog";
import { ExportCsvModal } from "./export";
import type { ReportListItemDTO, ReportDetailDTO } from "@/types";

// Create a client instance (outside component to avoid recreation)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Main Reports View Component (with Provider)
 * Top-level React island for reports page
 */
export function ReportsViewWithProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReportsView />
    </QueryClientProvider>
  );
}

/**
 * Inner Reports View Component
 * Manages state, filters, and data fetching
 */
function ReportsView() {
  // Auth context for company name
  const { company } = useAuthContext();

  // URL-based filters
  const { filters, setFilters, resetFilters } = useReportsParams();

  // Fetch reports with infinite scrolling
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useReports(filters);

  // State for detail sheet
  const [selectedReportId, setSelectedReportId] = React.useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = React.useState(false);

  // State for form dialog
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingReport, setEditingReport] = React.useState<ReportDetailDTO | null>(null);

  // State for export dialog
  const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false);

  // Flatten paginated data
  const reports = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.items) || [];
  }, [data]);

  // Handler to view report details
  const handleViewReport = React.useCallback((report: ReportListItemDTO) => {
    setSelectedReportId(report.uuid);
    setIsDetailSheetOpen(true);
  }, []);

  // Handler to close detail sheet
  const handleCloseDetailSheet = React.useCallback(() => {
    setIsDetailSheetOpen(false);
    setTimeout(() => setSelectedReportId(null), 300); // Delay clearing to allow animation
  }, []);

  // Handler to edit report (from detail sheet)
  const handleEditReport = React.useCallback((report: ReportDetailDTO) => {
    setEditingReport(report);
    setIsDetailSheetOpen(false);
    setIsFormDialogOpen(true);
  }, []);

  // Handler to add new report
  const handleAddReport = React.useCallback(() => {
    setEditingReport(null);
    setIsFormDialogOpen(true);
  }, []);

  // Handler to export reports
  const handleExport = React.useCallback(() => {
    setIsExportDialogOpen(true);
  }, []);

  // Handler for form success
  const handleFormSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  // Error message
  const errorMessage = React.useMemo(() => {
    return error ? getErrorMessage(error) : undefined;
  }, [error]);

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <ReportsHeader onAddReport={handleAddReport} onExport={handleExport} />

      {/* Filter Bar */}
      <ReportsFilterBar
        filters={filters}
        onFilterChange={(newFilters) => setFilters(newFilters)}
        onResetFilters={resetFilters}
      />

      {/* Reports List */}
      <ReportsContent
        reports={reports}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        hasNextPage={!!hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onViewReport={handleViewReport}
        onLoadMore={() => fetchNextPage()}
        onRetry={() => refetch()}
      />

      {/* Detail Sheet */}
      <ReportDetailSheet
        reportId={selectedReportId}
        isOpen={isDetailSheetOpen}
        onClose={handleCloseDetailSheet}
        onEdit={handleEditReport}
      />

      {/* Form Dialog */}
      <ReportFormDialog
        open={isFormDialogOpen}
        initialData={editingReport}
        onOpenChange={setIsFormDialogOpen}
        onSuccess={handleFormSuccess}
      />

      {/* Export Modal */}
      <ExportCsvModal open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen} companyName={company?.name} />
    </div>
  );
}
