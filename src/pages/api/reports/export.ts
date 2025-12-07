import type { APIRoute } from "astro";
import { z } from "zod";
import { errorResponse, formatZodError } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Validation schema for export query parameters
 */
const exportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  includeAi: z.string().optional().transform((val) => val !== "false"),
  includeTags: z.string().optional().transform((val) => val !== "false"),
});

/**
 * GET /api/reports/export
 * 
 * Exports reports as CSV file
 */
export const GET: APIRoute = async ({ locals, request }) => {
  try {
    const supabase = locals.supabase;
    
    // Get session first (before any response is sent)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Get user's company_uuid and company name using existing client
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("company_uuid, companies!inner(name)")
      .eq("uuid", session.user.id)
      .single();

    if (userError || !userData) {
      return errorResponse("FORBIDDEN", "User not associated with a company", 403);
    }

    const companyUuid = userData.company_uuid;
    const companyName = (userData.companies as any)?.name || "export";

    // Parse and validate query parameters
    const url = new URL(request.url);
    const params = {
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
      includeAi: url.searchParams.get("includeAi"),
      includeTags: url.searchParams.get("includeTags"),
    };

    const validation = exportQuerySchema.safeParse(params);

    if (!validation.success) {
      return errorResponse(
        "INVALID_DATE_RANGE",
        "Invalid or missing query parameters",
        400,
        { errors: formatZodError(validation.error) }
      );
    }

    const { from, to, includeAi, includeTags } = validation.data;

    // Validate date range doesn't exceed 31 days
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 31) {
      return errorResponse(
        "DATE_RANGE_TOO_LARGE",
        "Zakres dat przekracza maksymalny limit 31 dni",
        413
      );
    }

    if (fromDate > toDate) {
      return errorResponse(
        "INVALID_DATE_RANGE",
        "Data początkowa musi być wcześniejsza niż końcowa",
        400
      );
    }

    // Fetch reports with optional AI results and tags
    let selectQuery = `
      uuid,
      driver_uuid,
      drivers(name, email),
      report_date,
      timezone,
      occurred_at,
      route_status,
      delay_minutes,
      delay_reason,
      cargo_damage_description,
      vehicle_damage_description,
      next_day_blockers,
      is_problem,
      risk_level,
      created_at
    `;

    if (includeAi) {
      selectQuery += `,
        report_ai_results(ai_summary, risk_level)
      `;
    }

    const { data: reports, error } = await supabase
      .from("reports")
      .select(selectQuery)
      .eq("company_uuid", companyUuid)
      .gte("report_date", from)
      .lte("report_date", to)
      .order("report_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching reports for export:", error);
      return errorResponse("DATABASE_ERROR", error.message, 500);
    }


    // Fetch tags if requested
    let reportTags: Map<string, string[]> = new Map();
    if (includeTags && reports && reports.length > 0) {
      const reportUuids = reports.map((r: any) => r.uuid);
      const { data: tagsData } = await supabase
        .from("report_risk_tags")
        .select("report_uuid, risk_tags(tag_name)")
        .in("report_uuid", reportUuids);


      if (tagsData) {
        tagsData.forEach((tag: any) => {
          if (!reportTags.has(tag.report_uuid)) {
            reportTags.set(tag.report_uuid, []);
          }
          reportTags.get(tag.report_uuid)!.push(tag.risk_tags?.tag_name);
        });
      }
    }

    // Build CSV
    const headers = [
      "Data raportu",
      "Imię i nazwisko kierowcy",
      "Email kierowcy",
      "Status trasy",
      "Opóźnienie (min)",
      "Powód opóźnienia",
      "Opis uszkodzenia ładunku",
      "Opis uszkodzenia pojazdu",
      "Blokery na następny dzień",
      "Problem",
      "Poziom ryzyka",
    ];

    if (includeAi) {
      headers.push("Podsumowanie AI", "Ocena ryzyka AI");
    }

    if (includeTags) {
      headers.push("Tagi ryzyka");
    }

    const rows: string[][] = [headers];

    reports?.forEach((report: any) => {
      const row = [
        report.report_date,
        report.drivers?.name || "",
        report.drivers?.email || "",
        report.route_status,
        report.delay_minutes?.toString() || "0",
        escapeCsvField(report.delay_reason),
        escapeCsvField(report.cargo_damage_description),
        escapeCsvField(report.vehicle_damage_description),
        escapeCsvField(report.next_day_blockers),
        report.is_problem ? "Tak" : "Nie",
        report.risk_level || "NONE",
      ];

      if (includeAi) {
        const aiResult = report.report_ai_results?.[0];
        row.push(
          escapeCsvField(aiResult?.ai_summary),
          aiResult?.risk_level || ""
        );
      }

      if (includeTags) {
        const tags = reportTags.get(report.uuid) || [];
        row.push(tags.join(", "));
      }

      rows.push(row);
    });

    // Convert to CSV string
    const csv = rows.map((row) => row.join(",")).join("\n");

    // Generate filename
    const todayStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const safeCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `reports_${safeCompanyName}_${todayStr}.csv`;

    // Return CSV response
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/reports/export:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};

/**
 * Escapes a field for CSV format
 * Handles nulls, quotes, and newlines
 */
function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

