/**
 * Dashboard components - public exports
 */

// Atomic components
export { RiskBadge } from "./RiskBadge";
export type { RiskBadgeProps } from "./RiskBadge";

export { MetricCard } from "./MetricCard";
export type { MetricCardProps } from "./MetricCard";

export { ConnectionBadge } from "./ConnectionBadge";
export type { ConnectionBadgeProps } from "./ConnectionBadge";

export { LastUpdateIndicator } from "./LastUpdateIndicator";
export type { LastUpdateIndicatorProps } from "./LastUpdateIndicator";

export { RefreshButton } from "./RefreshButton";
export type { RefreshButtonProps } from "./RefreshButton";

export { DashboardHeader } from "./DashboardHeader";
export type { DashboardHeaderProps } from "./DashboardHeader";

// Metrics components
export { MetricsCardsGrid } from "./MetricsCardsGrid";
export type { MetricsCardsGridProps } from "./MetricsCardsGrid";

export { RiskBreakdownCard } from "./RiskBreakdownCard";
export type { RiskBreakdownCardProps } from "./RiskBreakdownCard";

// Reports components
export { ReportRow } from "./ReportRow";
export type { ReportRowProps } from "./ReportRow";

export { ReportsTable } from "./ReportsTable";
export type { ReportsTableProps } from "./ReportsTable";

export { ReportCard } from "./ReportCard";
export type { ReportCardProps } from "./ReportCard";

export { ReportCards } from "./ReportCards";
export type { ReportCardsProps } from "./ReportCards";

export { TodayReportsSection } from "./TodayReportsSection";
export type { TodayReportsSectionProps } from "./TodayReportsSection";

// Pending drivers components
export { PendingDriverCard } from "./PendingDriverCard";
export type { PendingDriverCardProps } from "./PendingDriverCard";

export { PendingDriversList } from "./PendingDriversList";
export type { PendingDriversListProps } from "./PendingDriversList";

export { PendingDriversSection } from "./PendingDriversSection";
export type { PendingDriversSectionProps } from "./PendingDriversSection";

// Loading and error states
export { LoadingSkeletons } from "./LoadingSkeletons";
export type { LoadingSkeletonsProps } from "./LoadingSkeletons";

export { ErrorState } from "./ErrorState";
export type { ErrorStateProps } from "./ErrorState";

// Main dashboard view
export { DashboardView } from "./DashboardView";
export type { DashboardViewProps } from "./DashboardView";

// DashboardView with QueryProvider (for Astro islands)
export { DashboardViewWithProvider } from "./DashboardViewWithProvider";
