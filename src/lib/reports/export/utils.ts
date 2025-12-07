import type { IsoDateOnlyString } from "@/types";

/**
 * Formats a Date object to ISO date-only string (YYYY-MM-DD)
 * @param date - The date to format
 * @returns ISO date-only string in YYYY-MM-DD format
 */
export function formatDateToIsoDateOnly(date: Date): IsoDateOnlyString {
  return date.toISOString().split("T")[0];
}

/**
 * Calculates the number of days between two dates (inclusive)
 * @param from - Start date
 * @param to - End date
 * @returns Number of days between the dates (inclusive)
 */
export function getDaysDifference(from: Date, to: Date): number {
  const diffTime = Math.abs(to.getTime() - from.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generates a CSV filename with company name and current date
 * @param companyName - Optional company name to include in filename
 * @returns Generated filename in format: reports_CompanyName_YYYYMMDD.csv
 */
export function generateCsvFilename(companyName?: string): string {
  const today = formatDateToIsoDateOnly(new Date()).replace(/-/g, "");
  const company = companyName ? companyName.replace(/[^a-zA-Z0-9]/g, "_") : "export";
  return `reports_${company}_${today}.csv`;
}

/**
 * Extracts filename from Content-Disposition header
 * @param contentDisposition - Content-Disposition header value
 * @returns Extracted filename or null if not found
 */
export function extractFilenameFromHeader(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
  return filenameMatch ? filenameMatch[1] : null;
}
