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

  // Handle navigation to report details
  const handleReportClick = React.useCallback(
    (reportUuid: Uuid) => {
      window.location.href = `${baseUrl}/reports/${reportUuid}`;
    },
    [baseUrl]
  );

  // Handle navigation to driver profile
  const handleDriverClick = React.useCallback(
    (driverUuid: Uuid) => {
      window.location.href = `${baseUrl}/drivers/${driverUuid}`;
    },
    [baseUrl]
  );

  // Handle risk level filter (scroll to reports section or navigate to filtered view)
  const handleRiskClick = React.useCallback(
    (riskLevel: ReportRiskLevel) => {
      // Option A: Navigate to reports page with filter
      window.location.href = `${baseUrl}/reports?riskLevel=${riskLevel}`;

      // Option B: Scroll to reports section (would need local state for filtering)
      // const reportsSection = document.getElementById('today-reports-title');
      // reportsSection?.scrollIntoView({ behavior: 'smooth' });
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
        onPendingClick={handlePendingMetricClick}
      />

      {/* Risk Breakdown */}
      <RiskBreakdownCard breakdown={data.summary.riskBreakdown} onRiskClick={handleRiskClick} />

      {/* Today's Reports */}
      <TodayReportsSection reports={data.todayReports} onReportClick={handleReportClick} />

      {/* Pending Drivers */}
      <PendingDriversSection pendingDrivers={data.pendingDrivers} onDriverClick={handleDriverClick} />

      {/* Connection Badge (fixed bottom-right) */}
      <ConnectionBadge isOnline={isOnline} refetchInterval={60_000} />
    </div>
  );
}

