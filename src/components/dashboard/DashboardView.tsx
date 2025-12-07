import * as React from "react";
import { useDashboard } from "@/lib/dashboard/useDashboard";
import { getErrorMessage } from "@/lib/dashboard/api";
import type { ReportRiskLevel, Uuid } from "@/types";
import { DashboardHeader } from "./DashboardHeader";
import { MetricsCardsGrid } from "./MetricsCardsGrid";
import { RiskBreakdownCard } from "./RiskBreakdownCard";
import { TodayReportsSection } from "./TodayReportsSection";
import { PendingDriversSection } from "./PendingDriversSection";
import { ConnectionBadge } from "./ConnectionBadge";
import { LoadingSkeletons } from "./LoadingSkeletons";
import { ErrorState } from "./ErrorState";
import { useNetworkStatus } from "@/lib/layout/useNetworkStatus";
import { ReportDetailSheet } from "@/components/reports/ReportDetailSheet";

export interface DashboardViewProps {
  /** IANA timezone identifier (default: "Europe/Warsaw") */
  timezone?: string;
  /** Base URL for navigation (default: "") */
  baseUrl?: string;
}

/**
 * DashboardView - Main dashboard container component
 *
 * Features:
 * - Fetches and displays today's dashboard data
 * - Auto-refreshes every 60 seconds
 * - Manual refresh button
 * - Loading skeletons
 * - Error handling with retry
 * - Network status indicator
 * - Responsive layout
 * - Navigation to report details and driver profiles
 *
 * Layout sections:
 * 1. DashboardHeader (title, last update, refresh button)
 * 2. MetricsCardsGrid (4 metrics: drivers, submitted, pending, problems)
 * 3. RiskBreakdownCard (risk level distribution)
 * 4. TodayReportsSection (today's reports - table/cards)
 * 5. PendingDriversSection (drivers without reports)
 * 6. ConnectionBadge (online/offline status - fixed bottom-right)
 */
export function DashboardView({ timezone = "Europe/Warsaw", baseUrl = "" }: DashboardViewProps) {
  const { data, isLoading, isRefreshing, error, refetch } = useDashboard({ timezone });
  const isOnline = useNetworkStatus();

  // State for report detail sheet
  const [selectedReportId, setSelectedReportId] = React.useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = React.useState(false);

  // Handle navigation to report details (opens sheet instead of navigation)
  const handleReportClick = React.useCallback(
    (reportUuid: Uuid) => {
      setSelectedReportId(reportUuid);
      setIsDetailSheetOpen(true);
    },
    []
  );

  // Handle close detail sheet
  const handleCloseDetailSheet = React.useCallback(() => {
    setIsDetailSheetOpen(false);
    setTimeout(() => setSelectedReportId(null), 300); // Delay clearing to allow animation
  }, []);

  // Handle navigation to driver profile
  const handleDriverClick = React.useCallback(
    (driverUuid: Uuid) => {
      window.location.href = `${baseUrl}/drivers/${driverUuid}`;
    },
    [baseUrl]
  );

  // Handle click on active drivers metric (navigate to drivers list)
  const handleActiveDriversClick = React.useCallback(() => {
    window.location.href = `${baseUrl}/drivers`;
  }, [baseUrl]);

  // Handle click on submitted reports metric (navigate to today's reports)
  const handleSubmittedReportsClick = React.useCallback(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD
    window.location.href = `${baseUrl}/reports?from=${today}&to=${today}`;
  }, [baseUrl, timezone]);

  // Handle click on problems metric (navigate to reports with risk filter)
  const handleProblemsClick = React.useCallback(() => {
    window.location.href = `${baseUrl}/reports?riskLevel=LOW&riskLevel=MEDIUM&riskLevel=HIGH`;
  }, [baseUrl]);

  // Handle risk level filter (scroll to reports section or navigate to filtered view)
  const handleRiskClick = React.useCallback(
    (riskLevel: ReportRiskLevel) => {
      // Option A: Navigate to reports page with filter
      window.location.href = `${baseUrl}/reports?riskLevel=${riskLevel}`;

    },
    [baseUrl]
  );

  // Handle click on pending reports metric (scroll to pending section)
  const handlePendingMetricClick = React.useCallback(() => {
    const pendingSection = document.getElementById("pending-drivers-title");
    pendingSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Handle manual refresh
  const handleRefresh = React.useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return (
      <>
        <LoadingSkeletons />
        <ConnectionBadge isOnline={isOnline} refetchInterval={60_000} />
      </>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <>
        <ErrorState
          title="Nie udało się załadować danych"
          message={error ? getErrorMessage(error) : "Brak danych do wyświetlenia"}
          onRetry={handleRefresh}
        />
        <ConnectionBadge isOnline={isOnline} refetchInterval={60_000} />
      </>
    );
  }

  // Success state - display full dashboard
  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <DashboardHeader
        lastUpdatedAt={data.lastUpdatedAt}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Metrics Grid */}
      <MetricsCardsGrid
        metrics={{
          totalActiveDrivers: data.summary.totalActiveDrivers,
          submittedCount: data.summary.submittedCount,
          pendingCount: data.summary.pendingCount,
          riskBreakdown: data.summary.riskBreakdown,
        }}
        onActiveDriversClick={handleActiveDriversClick}
        onSubmittedClick={handleSubmittedReportsClick}
        onPendingClick={handlePendingMetricClick}
        onProblemsClick={handleProblemsClick}
      />

      {/* Risk Breakdown */}
      <RiskBreakdownCard breakdown={data.summary.riskBreakdown} onRiskClick={handleRiskClick} />

      {/* Today's Reports */}
      <TodayReportsSection reports={data.todayReports} onReportClick={handleReportClick} />

      {/* Pending Drivers */}
      <PendingDriversSection pendingDrivers={data.pendingDrivers} onDriverClick={handleDriverClick} />

      {/* Report Detail Sheet */}
      <ReportDetailSheet
        reportId={selectedReportId}
        isOpen={isDetailSheetOpen}
        onClose={handleCloseDetailSheet}
      />

      {/* Connection Badge (fixed bottom-right) */}
      <ConnectionBadge isOnline={isOnline} refetchInterval={60_000} />
    </div>
  );
}

