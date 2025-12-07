import type {
  ReportsTodaySummaryDTO,
  ReportListItemDTO,
  DriverDTO,
  ReportRiskLevel,
  Uuid,
  IsoDateString,
} from "@/types";

/**
 * DashboardData – główny ViewModel dla widoku Dashboard.
 * Agreguje dane z wielu źródeł API.
 */
export interface DashboardData {
  summary: ReportsTodaySummaryDTO;
  todayReports: ReportListItemDTO[];
  pendingDrivers: PendingDriver[];
  lastUpdatedAt: IsoDateString;
}

/**
 * MetricsData – ViewModel dla siatki metryk na dashboardzie.
 */
export interface MetricsData {
  totalActiveDrivers: number;
  submittedCount: number;
  pendingCount: number;
  riskBreakdown: RiskBreakdown;
}

/**
 * RiskBreakdown – liczby raportów na poziom ryzyka.
 */
export interface RiskBreakdown {
  none: number;
  low: number;
  medium: number;
  high: number;
}

/**
 * PendingDriver – kierowca bez raportu na dzisiejszy dzień.
 * Zawiera dodatkowe informacje potrzebne w UI (np. czas od wysłania linku).
 */
export interface PendingDriver {
  uuid: Uuid;
  name: string;
  email: string;
  timezone: string;
  vehicleRegistration: string | null;
  linkSentAt: IsoDateString | null; // Czas wysłania linku (z tabeli report_links)
}

/**
 * DashboardFilters – opcjonalne filtry dla widoku (MVP: brak, ale struktura gotowa do rozbudowy).
 */
export interface DashboardFilters {
  date?: IsoDateString; // Domyślnie dzisiaj
  riskLevel?: ReportRiskLevel[];
}

/**
 * RefreshState – stan procesu odświeżania danych.
 */
export interface RefreshState {
  isRefreshing: boolean;
  lastRefreshAt: IsoDateString;
  error: string | null;
}
