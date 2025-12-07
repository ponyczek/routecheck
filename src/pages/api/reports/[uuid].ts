import type { APIRoute } from "astro";
import { z } from "zod";
import { jsonResponse, errorResponse, formatZodError } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Validation schema for UpdateReportCommand
 */
const updateReportSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timezone: z.string().min(1).optional(),
  routeStatus: z.enum(["COMPLETED", "PARTIALLY_COMPLETED", "CANCELLED"]).optional(),
  delayMinutes: z.number().min(0).int().optional(),
  delayReason: z.string().max(2000).nullable().optional(),
  cargoDamageDescription: z.string().max(2000).nullable().optional(),
  vehicleDamageDescription: z.string().max(2000).nullable().optional(),
  nextDayBlockers: z.string().max(2000).nullable().optional(),
  isProblem: z.boolean().optional(),
  riskLevel: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]).nullable().optional(),
});

/**
 * GET /api/reports/{uuid}
 * 
 * Fetches a single report with optional AI and tags
 */
export const GET: APIRoute = async ({ locals, params, request }) => {
  try {
    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Get user's company_uuid
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_uuid')
      .eq('uuid', session.data.session.user.id)
      .single();

    if (userError || !userData) {
      return errorResponse('FORBIDDEN', 'User not associated with a company', 403);
    }

    const companyUuid = userData.company_uuid;
    const reportUuid = params.uuid;

    // Parse query parameters
    const url = new URL(request.url);
    const includeAi = url.searchParams.get('includeAi') !== 'false';
    const includeTags = url.searchParams.get('includeTags') === 'true';

    // Fetch report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('uuid', reportUuid)
      .eq('company_uuid', companyUuid)
      .single();

    if (reportError || !report) {
      return errorResponse('NOT_FOUND', 'Report not found', 404);
    }

    // Fetch AI results if requested
    let aiResult = null;
    if (includeAi) {
      const { data: aiData } = await supabase
        .from('report_ai_results')
        .select('*')
        .eq('report_uuid', reportUuid)
        .eq('report_date', report.report_date)
        .single();

      if (aiData) {
        aiResult = {
          reportUuid: aiData.report_uuid,
          reportDate: aiData.report_date,
          aiSummary: aiData.ai_summary,
          riskLevel: aiData.risk_level,
          createdAt: aiData.created_at,
          updatedAt: aiData.updated_at,
        };
      }
    }

    // Fetch tags if requested
    let tags: string[] = [];
    if (includeTags) {
      const { data: tagData } = await supabase
        .from('report_risk_tags')
        .select('risk_tags(tag_name)')
        .eq('report_uuid', reportUuid)
        .eq('report_date', report.report_date);

      if (tagData) {
        tags = tagData.map((t: any) => t.risk_tags?.tag_name).filter(Boolean);
      }
    }

    // Transform to DTO
    const reportDto = {
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
      ai: aiResult,
      tags: includeTags ? tags : undefined,
    };

    return jsonResponse(reportDto, 200);
  } catch (error) {
    console.error('Error in GET /api/reports/[uuid]:', error);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
};

/**
 * PATCH /api/reports/{uuid}
 * 
 * Updates an existing report
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
  try {
    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Get user's company_uuid
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_uuid')
      .eq('uuid', session.data.session.user.id)
      .single();

    if (userError || !userData) {
      return errorResponse('FORBIDDEN', 'User not associated with a company', 403);
    }

    const companyUuid = userData.company_uuid;
    const reportUuid = params.uuid;

    // Verify report exists and belongs to company
    const { data: existingReport, error: checkError } = await supabase
      .from('reports')
      .select('uuid')
      .eq('uuid', reportUuid)
      .eq('company_uuid', companyUuid)
      .single();

    if (checkError || !existingReport) {
      return errorResponse('NOT_FOUND', 'Report not found', 404);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateReportSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid request body',
        400,
        { errors: formatZodError(validation.error) }
      );
    }

    const data = validation.data;

    // Build update object
    const updateData: any = {};
    if (data.reportDate !== undefined) updateData.report_date = data.reportDate;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.routeStatus !== undefined) updateData.route_status = data.routeStatus;
    if (data.delayMinutes !== undefined) updateData.delay_minutes = data.delayMinutes;
    if (data.delayReason !== undefined) updateData.delay_reason = data.delayReason;
    if (data.cargoDamageDescription !== undefined) updateData.cargo_damage_description = data.cargoDamageDescription;
    if (data.vehicleDamageDescription !== undefined) updateData.vehicle_damage_description = data.vehicleDamageDescription;
    if (data.nextDayBlockers !== undefined) updateData.next_day_blockers = data.nextDayBlockers;
    if (data.isProblem !== undefined) updateData.is_problem = data.isProblem;
    if (data.riskLevel !== undefined) updateData.risk_level = data.riskLevel;

    // Update report
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update(updateData)
      .eq('uuid', reportUuid)
      .eq('company_uuid', companyUuid)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating report:', updateError);
      return errorResponse('DATABASE_ERROR', updateError.message, 500);
    }

    // TODO: Schedule AI reprocessing if content changed

    // Transform to DTO
    const reportDto = {
      uuid: updatedReport.uuid,
      companyUuid: updatedReport.company_uuid,
      driverUuid: updatedReport.driver_uuid,
      reportDate: updatedReport.report_date,
      timezone: updatedReport.timezone,
      occurredAt: updatedReport.occurred_at,
      routeStatus: updatedReport.route_status,
      delayMinutes: updatedReport.delay_minutes,
      delayReason: updatedReport.delay_reason,
      cargoDamageDescription: updatedReport.cargo_damage_description,
      vehicleDamageDescription: updatedReport.vehicle_damage_description,
      nextDayBlockers: updatedReport.next_day_blockers,
      isProblem: updatedReport.is_problem,
      riskLevel: updatedReport.risk_level,
      createdAt: updatedReport.created_at,
      updatedAt: updatedReport.updated_at,
    };

    return jsonResponse(reportDto, 200);
  } catch (error) {
    console.error('Error in PATCH /api/reports/[uuid]:', error);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
};

/**
 * DELETE /api/reports/{uuid}
 * 
 * Deletes a report (admin only)
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    // Get user's company_uuid
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_uuid')
      .eq('uuid', session.data.session.user.id)
      .single();

    if (userError || !userData) {
      return errorResponse('FORBIDDEN', 'User not associated with a company', 403);
    }

    const companyUuid = userData.company_uuid;
    const reportUuid = params.uuid;

    // Delete report
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('uuid', reportUuid)
      .eq('company_uuid', companyUuid);

    if (deleteError) {
      console.error('Error deleting report:', deleteError);
      return errorResponse('DATABASE_ERROR', deleteError.message, 500);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/reports/[uuid]:', error);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
};



