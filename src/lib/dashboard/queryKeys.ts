/**
 * Query keys dla TanStack Query w widoku Dashboard.
 * Używane do cachowania i invalidacji danych.
 */
export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  summary: (date: string) => ["dashboard", "summary", date] as const,
  todayReports: (date: string) => ["dashboard", "reports", date] as const,
  pendingDrivers: (date: string) => ["dashboard", "pending", date] as const,
};
