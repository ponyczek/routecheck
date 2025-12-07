import { useState } from "react";
import { toast } from "sonner";
import { supabaseBrowserClient } from "@/db/supabase.client";
import type { ExportCsvQueryParams } from "./types";
import { generateCsvFilename, extractFilenameFromHeader } from "./utils";

/**
 * Gets the current Supabase session token for authenticated API requests
 * @throws {Error} if no session is available
 * @returns JWT access token
 */
async function getSupabaseToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabaseBrowserClient.auth.getSession();

  if (error || !session) {
    throw new Error("UNAUTHORIZED");
  }

  return session.access_token;
}

/**
 * Custom hook for exporting reports to CSV
 * Handles the full export flow including API call, file download, and error handling
 */
export function useExportCsv() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Exports reports to CSV and triggers browser download
   * @param params - Export query parameters (date range and options)
   * @param companyName - Optional company name for filename
   * @returns true if export succeeded, false otherwise
   */
  const exportCsv = async (params: ExportCsvQueryParams, companyName?: string): Promise<boolean> => {
    setIsExporting(true);
    setError(null);

    try {
      // Get authentication token
      const token = await getSupabaseToken();

      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.set("from", params.from);
      queryParams.set("to", params.to);
      if (params.includeAi) queryParams.set("includeAi", "true");
      if (params.includeTags) queryParams.set("includeTags", "true");

      // Call API endpoint
      const response = await fetch(`/api/reports/export?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/csv",
        },
      });

      // Handle error responses
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Nieprawidłowy zakres dat");
        } else if (response.status === 401) {
          throw new Error("UNAUTHORIZED");
        } else if (response.status === 413) {
          throw new Error("Zakres dat jest zbyt duży. Maksymalny zakres to 31 dni.");
        } else if (response.status === 429) {
          throw new Error("Przekroczono limit żądań. Spróbuj ponownie za chwilę.");
        } else if (response.status === 500) {
          throw new Error("Wystąpił błąd serwera. Spróbuj ponownie.");
        } else {
          throw new Error("Wystąpił błąd podczas eksportu");
        }
      }

      // Get blob data
      const blob = await response.blob();

      // Determine filename from header or generate default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = extractFilenameFromHeader(contentDisposition) || generateCsvFilename(companyName);

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success toast
      toast.success("Plik CSV został pobrany pomyślnie");

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nieznany błąd";

      // Handle unauthorized error with redirect
      if (message === "UNAUTHORIZED") {
        toast.error("Twoja sesja wygasła. Zaloguj się ponownie.");
        // Redirect to signin page after a short delay
        setTimeout(() => {
          window.location.href = "/signin";
        }, 1500);
        return false;
      }

      // Set error state and show toast
      setError(message);
      toast.error(message);

      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportCsv, isExporting, error };
}
