import type { APIRoute } from "astro";
import type { AssignmentsListResponseDTO, CreateAssignmentCommand } from "@/types";
import { jsonResponse } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/assignments
 *
 * Lists driver-vehicle assignments with filtering, sorting, and pagination
 * Supports filtering by driver, vehicle, and active date
 */
export const GET: APIRoute = async ({ locals, request }) => {
  try {
    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return jsonResponse({ code: "UNAUTHORIZED", message: "Authentication required" }, 401);
    }

    // Get user's company_uuid
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("company_uuid")
      .eq("uuid", session.data.session.user.id)
      .single();

    if (userError || !userData) {
      return jsonResponse({ code: "FORBIDDEN", message: "User not associated with a company" }, 403);
    }

    const companyUuid = userData.company_uuid;

    // Parse query parameters
    const url = new URL(request.url);
    const driverUuid = url.searchParams.get("driverUuid");
    const vehicleUuid = url.searchParams.get("vehicleUuid");
    const activeOn = url.searchParams.get("activeOn"); // YYYY-MM-DD format
    const sortBy = (url.searchParams.get("sortBy") || "start_date") as "start_date" | "end_date" | "created_at";
    const sortDir = (url.searchParams.get("sortDir") || "asc") as "asc" | "desc";
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    // Build query
    let query = supabase
      .from("driver_vehicle_assignments")
      .select("uuid, driver_uuid, vehicle_uuid, company_uuid, start_date, end_date")
      .eq("company_uuid", companyUuid);

    // Filter by driver
    if (driverUuid) {
      query = query.eq("driver_uuid", driverUuid);
    }

    // Filter by vehicle
    if (vehicleUuid) {
      query = query.eq("vehicle_uuid", vehicleUuid);
    }

    // Filter by active date (assignments active on specific date)
    if (activeOn) {
      // Assignment is active on date if: start_date <= activeOn AND (end_date >= activeOn OR end_date IS NULL)
      query = query.lte("start_date", activeOn).or(`end_date.gte.${activeOn},end_date.is.null`);
    }

    // Sort
    const sortColumn = sortBy === "end_date" ? "end_date" : sortBy === "created_at" ? "created_at" : "start_date";
    query = query.order(sortColumn, { ascending: sortDir === "asc" });

    // Limit
    query = query.limit(limit);

    const { data: assignments, error } = await query;

    if (error) {
      console.error("Error fetching assignments:", error);
      return jsonResponse({ code: "INTERNAL_ERROR", message: "Failed to fetch assignments" }, 500);
    }

    // Transform to camelCase (match DTO format)
    const items = (assignments || []).map((assignment) => ({
      uuid: assignment.uuid,
      driverUuid: assignment.driver_uuid,
      vehicleUuid: assignment.vehicle_uuid,
      companyUuid: assignment.company_uuid,
      startDate: assignment.start_date,
      endDate: assignment.end_date,
    }));

    const response: AssignmentsListResponseDTO = {
      items,
      nextCursor: items.length >= limit ? "has-more" : null,
    };

    return jsonResponse(response, 200);
  } catch (error) {
    console.error("Unexpected error in GET /api/assignments:", error);
    return jsonResponse({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500);
  }
};

/**
 * POST /api/assignments
 *
 * Creates a new driver-vehicle assignment
 * Validates for overlapping assignments (same driver or vehicle in same period)
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return jsonResponse({ code: "UNAUTHORIZED", message: "Authentication required" }, 401);
    }

    // Get user's company_uuid
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("company_uuid")
      .eq("uuid", session.data.session.user.id)
      .single();

    if (userError || !userData) {
      return jsonResponse({ code: "FORBIDDEN", message: "User not associated with a company" }, 403);
    }

    const companyUuid = userData.company_uuid;

    // Parse request body
    const body = (await request.json()) as CreateAssignmentCommand;

    // Validate required fields
    if (!body.driverUuid || !body.vehicleUuid || !body.startDate) {
      return jsonResponse(
        { code: "VALIDATION_ERROR", message: "Missing required fields: driverUuid, vehicleUuid, startDate" },
        400
      );
    }

    // Validate date range (endDate >= startDate if provided)
    if (body.endDate && body.endDate < body.startDate) {
      return jsonResponse(
        { code: "INVALID_DATE_RANGE", message: "Data zakończenia musi być późniejsza lub równa dacie rozpoczęcia" },
        400
      );
    }

    // Check for overlapping assignments for this driver
    const driverOverlapQuery = supabase
      .from("driver_vehicle_assignments")
      .select("uuid, start_date, end_date")
      .eq("company_uuid", companyUuid)
      .eq("driver_uuid", body.driverUuid);

    // Overlap condition: new assignment overlaps if:
    // (new.start_date <= existing.end_date OR existing.end_date IS NULL) AND
    // (new.end_date >= existing.start_date OR new.end_date IS NULL)
    if (body.endDate) {
      driverOverlapQuery.or(`end_date.gte.${body.startDate},end_date.is.null`);
      driverOverlapQuery.lte("start_date", body.endDate);
    } else {
      driverOverlapQuery.or(`end_date.gte.${body.startDate},end_date.is.null`);
    }

    const { data: driverOverlaps } = await driverOverlapQuery;

    if (driverOverlaps && driverOverlaps.length > 0) {
      return jsonResponse(
        {
          code: "ASSIGNMENT_OVERLAP",
          message: "Ten kierowca jest już przypisany do innego pojazdu w tym okresie",
          details: {
            conflictingAssignment: {
              uuid: driverOverlaps[0].uuid,
              startDate: driverOverlaps[0].start_date,
              endDate: driverOverlaps[0].end_date,
            },
          },
        },
        409
      );
    }

    // Check for overlapping assignments for this vehicle
    const vehicleOverlapQuery = supabase
      .from("driver_vehicle_assignments")
      .select("uuid, start_date, end_date")
      .eq("company_uuid", companyUuid)
      .eq("vehicle_uuid", body.vehicleUuid);

    if (body.endDate) {
      vehicleOverlapQuery.or(`end_date.gte.${body.startDate},end_date.is.null`);
      vehicleOverlapQuery.lte("start_date", body.endDate);
    } else {
      vehicleOverlapQuery.or(`end_date.gte.${body.startDate},end_date.is.null`);
    }

    const { data: vehicleOverlaps } = await vehicleOverlapQuery;

    if (vehicleOverlaps && vehicleOverlaps.length > 0) {
      return jsonResponse(
        {
          code: "ASSIGNMENT_OVERLAP",
          message: "Ten pojazd jest już przypisany do innego kierowcy w tym okresie",
          details: {
            conflictingAssignment: {
              uuid: vehicleOverlaps[0].uuid,
              startDate: vehicleOverlaps[0].start_date,
              endDate: vehicleOverlaps[0].end_date,
            },
          },
        },
        409
      );
    }

    // Insert new assignment
    const { data: newAssignment, error: insertError } = await supabase
      .from("driver_vehicle_assignments")
      .insert({
        company_uuid: companyUuid,
        driver_uuid: body.driverUuid,
        vehicle_uuid: body.vehicleUuid,
        start_date: body.startDate,
        end_date: body.endDate || null,
      })
      .select("uuid, driver_uuid, vehicle_uuid, company_uuid, start_date, end_date")
      .single();

    if (insertError) {
      console.error("Error creating assignment:", insertError);
      return jsonResponse({ code: "INTERNAL_ERROR", message: "Failed to create assignment" }, 500);
    }

    // Transform to camelCase
    const responseAssignment = {
      uuid: newAssignment.uuid,
      driverUuid: newAssignment.driver_uuid,
      vehicleUuid: newAssignment.vehicle_uuid,
      companyUuid: newAssignment.company_uuid,
      startDate: newAssignment.start_date,
      endDate: newAssignment.end_date,
    };

    return jsonResponse(responseAssignment, 201);
  } catch (error) {
    console.error("Unexpected error in POST /api/assignments:", error);
    return jsonResponse({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500);
  }
};
