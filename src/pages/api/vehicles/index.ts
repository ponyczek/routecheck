import type { APIRoute } from "astro";
import type { VehiclesListResponseDTO, CreateVehicleCommand } from "@/types";
import { jsonResponse } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/vehicles
 *
 * Lists vehicles with filtering, sorting, and pagination
 * Uses Supabase for persistent storage
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
    const q = url.searchParams.get("q") || "";
    const isActiveParam = url.searchParams.get("isActive");
    const includeDeleted = url.searchParams.get("includeDeleted") === "true";
    const sortBy = (url.searchParams.get("sortBy") || "registrationNumber") as "registrationNumber" | "createdAt";
    const sortDir = (url.searchParams.get("sortDir") || "asc") as "asc" | "desc";
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Build query
    let query = supabase
      .from("vehicles")
      .select("uuid, registration_number, vin, is_active, created_at, deleted_at")
      .eq("company_uuid", companyUuid);

    // Filter by search query (registration_number or VIN)
    if (q) {
      query = query.or(`registration_number.ilike.%${q}%,vin.ilike.%${q}%`);
    }

    // Filter by active status
    if (isActiveParam !== null) {
      const isActive = isActiveParam === "true";
      query = query.eq("is_active", isActive);
    }

    // Filter deleted
    if (!includeDeleted) {
      query = query.is("deleted_at", null);
    }

    // Sort
    const sortColumn = sortBy === "registrationNumber" ? "registration_number" : "created_at";
    query = query.order(sortColumn, { ascending: sortDir === "asc" });

    // Limit
    query = query.limit(limit);

    const { data: vehicles, error } = await query;

    if (error) {
      console.error("Error fetching vehicles:", error);
      return jsonResponse({ code: "INTERNAL_ERROR", message: "Failed to fetch vehicles" }, 500);
    }

    // Transform to camelCase (match DTO format)
    const items = (vehicles || []).map((vehicle) => ({
      uuid: vehicle.uuid,
      registrationNumber: vehicle.registration_number,
      vin: vehicle.vin,
      isActive: vehicle.is_active,
      createdAt: vehicle.created_at,
      deletedAt: vehicle.deleted_at,
    }));

    const response: VehiclesListResponseDTO = {
      items,
      nextCursor: items.length >= limit ? "has-more" : null, // Simplified pagination
    };

    return jsonResponse(response, 200);
  } catch (error) {
    console.error("Unexpected error in GET /api/vehicles:", error);
    return jsonResponse({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500);
  }
};

/**
 * POST /api/vehicles
 *
 * Creates a new vehicle
 * Uses Supabase for persistent storage
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
    const body = (await request.json()) as CreateVehicleCommand;

    // Validate required fields
    if (!body.registrationNumber) {
      return jsonResponse({ code: "VALIDATION_ERROR", message: "Missing required field: registrationNumber" }, 400);
    }

    // Check for duplicate registration number (only for active vehicles)
    const { data: existingVehicle } = await supabase
      .from("vehicles")
      .select("uuid")
      .eq("company_uuid", companyUuid)
      .eq("registration_number", body.registrationNumber.toUpperCase())
      .is("deleted_at", null)
      .eq("is_active", true)
      .maybeSingle();

    if (existingVehicle) {
      return jsonResponse({ code: "CONFLICT", message: "Pojazd o tym numerze rejestracyjnym już istnieje" }, 409);
    }

    // Insert new vehicle
    const { data: newVehicle, error: insertError } = await supabase
      .from("vehicles")
      .insert({
        company_uuid: companyUuid,
        registration_number: body.registrationNumber.toUpperCase(),
        vin: body.vin ? body.vin.toUpperCase() : null,
        is_active: body.isActive ?? true,
      })
      .select("uuid, registration_number, vin, is_active, created_at, deleted_at")
      .single();

    if (insertError) {
      console.error("Error creating vehicle:", insertError);

      // Check for unique constraint violation
      if (insertError.code === "23505") {
        return jsonResponse({ code: "CONFLICT", message: "Pojazd o tym numerze rejestracyjnym już istnieje" }, 409);
      }

      return jsonResponse({ code: "INTERNAL_ERROR", message: "Failed to create vehicle" }, 500);
    }

    // Transform to camelCase
    const responseVehicle = {
      uuid: newVehicle.uuid,
      registrationNumber: newVehicle.registration_number,
      vin: newVehicle.vin,
      isActive: newVehicle.is_active,
      createdAt: newVehicle.created_at,
      deletedAt: newVehicle.deleted_at,
    };

    return jsonResponse(responseVehicle, 201);
  } catch (error) {
    console.error("Unexpected error in POST /api/vehicles:", error);
    return jsonResponse({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500);
  }
};
