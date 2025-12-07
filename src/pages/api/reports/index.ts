import type { APIRoute } from "astro";
import { z } from "zod";
import type { ReportListItemDTO, ReportsListResponseDTO } from "@/types";
import { jsonResponse, errorResponse, formatZodError } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Validation schema for CreateReportCommand
 */
const createReportSchema = z.object({
  driverUuid: z.string().uuid(),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1),
  routeStatus: z.enum(["COMPLETED", "PARTIALLY_COMPLETED", "CANCELLED"]),
  delayMinutes: z.number().min(0).int().default(0),
  delayReason: z.string().max(2000).nullable().optional(),
  cargoDamageDescription: z.string().max(2000).nullable().optional(),
  vehicleDamageDescription: z.string().max(2000).nullable().optional(),
  nextDayBlockers: z.string().max(2000).nullable().optional(),
  isProblem: z.boolean().default(false),
  riskLevel: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).nullable().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/reports
 *
 * Lists reports with filtering
 */
export const GET: APIRoute = async ({ locals, request }) => {
  try {
    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Get user's company_uuid
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("company_uuid")
      .eq("uuid", session.data.session.user.id)
      .single();

    if (userError || !userData) {
      return errorResponse("FORBIDDEN", "User not associated with a company", 403);
    }

    const companyUuid = userData.company_uuid;

    // Parse query parameters
    const url = new URL(request.url);
    const from = url.searchParams.get("from") || new Date().toISOString().split("T")[0];
    const to = url.searchParams.get("to") || new Date().toISOString().split("T")[0];
    const includeAi = url.searchParams.get("includeAi") !== "false";
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const sortBy = url.searchParams.get("sortBy") || "reportDate";
    const sortDir = (url.searchParams.get("sortDir") || "desc") as "asc" | "desc";

    // Build query
    let query = supabase
      .from("reports")
      .select(
        includeAi
          ? "uuid, company_uuid, driver_uuid, report_date, timezone, occurred_at, route_status, delay_minutes, delay_reason, cargo_damage_description, vehicle_damage_description, next_day_blockers, is_problem, risk_level, created_at, updated_at, report_ai_results(report_uuid, report_date, ai_summary, risk_level, created_at, updated_at)"
          : "uuid, company_uuid, driver_uuid, report_date, timezone, occurred_at, route_status, delay_minutes, delay_reason, cargo_damage_description, vehicle_damage_description, next_day_blockers, is_problem, risk_level, created_at, updated_at"
      )
      .eq("company_uuid", companyUuid)
      .gte("report_date", from)
      .lte("report_date", to);

    // Filter by driver
    const driverUuids = url.searchParams.getAll("driverUuid");
    if (driverUuids.length > 0) {
      query = query.in("driver_uuid", driverUuids);
    }

    // Filter by risk level
    const riskLevels = url.searchParams.getAll("riskLevel");
    if (riskLevels.length > 0) {
      query = query.in("risk_level", riskLevels);
    }

    // Filter by route status
    const routeStatuses = url.searchParams.getAll("routeStatus");
    if (routeStatuses.length > 0) {
      query = query.in("route_status", routeStatuses);
    }

    // Search query (full-text search on driver names would need JOIN - simplified for now)
    const q = url.searchParams.get("q");
    if (q) {
      // This is a simplified search - in production you'd want to use PostgreSQL full-text search
      query = query.or(
        `delay_reason.ilike.%${q}%,cargo_damage_description.ilike.%${q}%,vehicle_damage_description.ilike.%${q}%,next_day_blockers.ilike.%${q}%`
      );
    }

    // Sort
    const sortColumn = sortBy === "occurredAt" ? "occurred_at" : "report_date";
    query = query.order(sortColumn, { ascending: sortDir === "asc" });

    // Limit
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching reports:", error);
      return errorResponse("DATABASE_ERROR", error.message, 500);
    }

    // Transform to camelCase DTOs
    const items: ReportListItemDTO[] = (data || []).map((report: any) => ({
      uuid: report.uuid,
      companyUuid: report.company_uuid,
      driverUuid: report.driver_uuid,
      reportDate: report.report_date,
      timezone: report.timezone,
      occurredAt: report.occurred_at,
      routeStatus: report.route_status,
      delayMinutes: report.delay_minutes,
      delayReason: report.delay_reason,
      cargoDamageDescription: report.cargo_damage_description,
      vehicleDamageDescription: report.vehicle_damage_description,
      nextDayBlockers: report.next_day_blockers,
      isProblem: report.is_problem,
      riskLevel: report.risk_level,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      ai: report.report_ai_results?.[0]
        ? {
            reportUuid: report.report_ai_results[0].report_uuid,
            reportDate: report.report_ai_results[0].report_date,
            aiSummary: report.report_ai_results[0].ai_summary,
            riskLevel: report.report_ai_results[0].risk_level,
            createdAt: report.report_ai_results[0].created_at,
            updatedAt: report.report_ai_results[0].updated_at,
          }
        : null,
    }));

    const response: ReportsListResponseDTO = {
      items,
      nextCursor: null, // TODO: Implement cursor-based pagination
    };

    return jsonResponse(response, 200);
  } catch (error) {
    console.error("Error in GET /api/reports:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};

/**
 * POST /api/reports
 *
 * Creates a new report (admin/dispatcher action)
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Get user's company_uuid
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("company_uuid")
      .eq("uuid", session.data.session.user.id)
      .single();

    if (userError || !userData) {
      return errorResponse("FORBIDDEN", "User not associated with a company", 403);
    }

    const companyUuid = userData.company_uuid;

    // Parse and validate request body
    const body = await request.json();
    const validation = createReportSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request body", 400, {
        errors: formatZodError(validation.error),
      });
    }

    const data = validation.data;

    // Check if report already exists for this driver and date
    const { data: existingReport } = await supabase
      .from("reports")
      .select("uuid")
      .eq("company_uuid", companyUuid)
      .eq("driver_uuid", data.driverUuid)
      .eq("report_date", data.reportDate)
      .single();

    if (existingReport) {
      return errorResponse("DUPLICATE_REPORT", "A report for this driver and date already exists", 409, {
        existingReportUuid: existingReport.uuid,
      });
    }

    // Verify driver belongs to company
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("uuid")
      .eq("uuid", data.driverUuid)
      .eq("company_uuid", companyUuid)
      .single();

    if (driverError || !driver) {
      return errorResponse("NOT_FOUND", "Driver not found or does not belong to your company", 404);
    }

    // Create report
    const { data: newReport, error: createError } = await supabase
      .from("reports")
      .insert({
        company_uuid: companyUuid,
        driver_uuid: data.driverUuid,
        report_date: data.reportDate,
        timezone: data.timezone,
        occurred_at: new Date().toISOString(),
        route_status: data.routeStatus,
        delay_minutes: data.delayMinutes,
        delay_reason: data.delayReason || null,
        cargo_damage_description: data.cargoDamageDescription || null,
        vehicle_damage_description: data.vehicleDamageDescription || null,
        next_day_blockers: data.nextDayBlockers || null,
        is_problem: data.isProblem,
        risk_level: data.riskLevel || null,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating report:", createError);
      return errorResponse("DATABASE_ERROR", createError.message, 500);
    }

    // TODO: Handle tags if provided
    // TODO: Schedule AI processing

    // Transform to DTO
    const reportDto = {
      uuid: newReport.uuid,
      companyUuid: newReport.company_uuid,
      driverUuid: newReport.driver_uuid,
      reportDate: newReport.report_date,
      timezone: newReport.timezone,
      occurredAt: newReport.occurred_at,
      routeStatus: newReport.route_status,
      delayMinutes: newReport.delay_minutes,
      delayReason: newReport.delay_reason,
      cargoDamageDescription: newReport.cargo_damage_description,
      vehicleDamageDescription: newReport.vehicle_damage_description,
      nextDayBlockers: newReport.next_day_blockers,
      isProblem: newReport.is_problem,
      riskLevel: newReport.risk_level,
      createdAt: newReport.created_at,
      updatedAt: newReport.updated_at,
    };

    return jsonResponse(reportDto, 201);
  } catch (error) {
    console.error("Error in POST /api/reports:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
