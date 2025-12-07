import type { APIRoute } from "astro";
import type { UpdateVehicleCommand } from "@/types";
import { jsonResponse } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/vehicles/:uuid
 * 
 * Gets a single vehicle by UUID
 * Uses Supabase for persistent storage
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const { uuid } = params;

    if (!uuid) {
      return jsonResponse(
        { code: 'VALIDATION_ERROR', message: 'Missing uuid parameter' },
        400
      );
    }

    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return jsonResponse(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        401
      );
    }

    // Get user's company_uuid
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_uuid')
      .eq('uuid', session.data.session.user.id)
      .single();

    if (userError || !userData) {
      return jsonResponse(
        { code: 'FORBIDDEN', message: 'User not associated with a company' },
        403
      );
    }

    // Get vehicle (with company check via RLS)
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('uuid, registration_number, vin, is_active, created_at, deleted_at')
      .eq('uuid', uuid)
      .eq('company_uuid', userData.company_uuid)
      .single();

    if (error || !vehicle) {
      return jsonResponse(
        { code: 'NOT_FOUND', message: 'Pojazd nie został znaleziony' },
        404
      );
    }

    // Transform to camelCase
    const responseVehicle = {
      uuid: vehicle.uuid,
      registrationNumber: vehicle.registration_number,
      vin: vehicle.vin,
      isActive: vehicle.is_active,
      createdAt: vehicle.created_at,
      deletedAt: vehicle.deleted_at,
    };

    return jsonResponse(responseVehicle, 200);
  } catch (error) {
    console.error('Unexpected error in GET /api/vehicles/:uuid:', error);
    return jsonResponse(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      500
    );
  }
};

/**
 * PATCH /api/vehicles/:uuid
 * 
 * Updates a vehicle
 * Uses Supabase for persistent storage
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
  try {
    const { uuid } = params;

    if (!uuid) {
      return jsonResponse(
        { code: 'VALIDATION_ERROR', message: 'Missing uuid parameter' },
        400
      );
    }

    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return jsonResponse(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        401
      );
    }

    // Get user's company_uuid
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_uuid')
      .eq('uuid', session.data.session.user.id)
      .single();

    if (userError || !userData) {
      return jsonResponse(
        { code: 'FORBIDDEN', message: 'User not associated with a company' },
        403
      );
    }

    const companyUuid = userData.company_uuid;

    // Check if vehicle exists and belongs to user's company
    const { data: existingVehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('uuid, registration_number, deleted_at')
      .eq('uuid', uuid)
      .eq('company_uuid', companyUuid)
      .single();

    if (fetchError || !existingVehicle) {
      return jsonResponse(
        { code: 'NOT_FOUND', message: 'Pojazd nie został znaleziony' },
        404
      );
    }

    // Check if vehicle is deleted
    if (existingVehicle.deleted_at !== null) {
      return jsonResponse(
        { code: 'FORBIDDEN', message: 'Nie można edytować usuniętego pojazdu' },
        403
      );
    }

    // Parse request body
    const body = await request.json() as UpdateVehicleCommand;

    // Check for duplicate registration number (if registration number is being changed)
    if (body.registrationNumber && body.registrationNumber.toUpperCase() !== existingVehicle.registration_number.toUpperCase()) {
      const { data: duplicateVehicle } = await supabase
        .from('vehicles')
        .select('uuid')
        .eq('company_uuid', companyUuid)
        .eq('registration_number', body.registrationNumber.toUpperCase())
        .neq('uuid', uuid)
        .is('deleted_at', null)
        .eq('is_active', true)
        .maybeSingle();

      if (duplicateVehicle) {
        return jsonResponse(
          { code: 'CONFLICT', message: 'Pojazd o tym numerze rejestracyjnym już istnieje' },
          409
        );
      }
    }

    // Build update object (only include defined fields)
    const updates: any = {};
    if (body.registrationNumber !== undefined) updates.registration_number = body.registrationNumber.toUpperCase();
    if (body.vin !== undefined) updates.vin = body.vin ? body.vin.toUpperCase() : null;
    if (body.isActive !== undefined) updates.is_active = body.isActive;

    if (Object.keys(updates).length === 0) {
      return jsonResponse(
        { code: 'VALIDATION_ERROR', message: 'No fields to update' },
        400
      );
    }

    // Update vehicle
    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('uuid', uuid)
      .eq('company_uuid', companyUuid)
      .select('uuid, registration_number, vin, is_active, created_at, deleted_at')
      .single();

    if (updateError) {
      console.error('Error updating vehicle:', updateError);

      // Check for unique constraint violation
      if (updateError.code === '23505') {
        return jsonResponse(
          { code: 'CONFLICT', message: 'Pojazd o tym numerze rejestracyjnym już istnieje' },
          409
        );
      }

      return jsonResponse(
        { code: 'INTERNAL_ERROR', message: 'Failed to update vehicle' },
        500
      );
    }

    // Transform to camelCase
    const responseVehicle = {
      uuid: updatedVehicle.uuid,
      registrationNumber: updatedVehicle.registration_number,
      vin: updatedVehicle.vin,
      isActive: updatedVehicle.is_active,
      createdAt: updatedVehicle.created_at,
      deletedAt: updatedVehicle.deleted_at,
    };

    return jsonResponse(responseVehicle, 200);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/vehicles/:uuid:', error);
    return jsonResponse(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      500
    );
  }
};

/**
 * DELETE /api/vehicles/:uuid
 * 
 * Soft deletes a vehicle
 * Uses Supabase for persistent storage
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    const { uuid } = params;

    if (!uuid) {
      return jsonResponse(
        { code: 'VALIDATION_ERROR', message: 'Missing uuid parameter' },
        400
      );
    }

    const supabase = locals.supabase;
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return jsonResponse(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        401
      );
    }

    // Get user's company_uuid
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_uuid')
      .eq('uuid', session.data.session.user.id)
      .single();

    if (userError || !userData) {
      return jsonResponse(
        { code: 'FORBIDDEN', message: 'User not associated with a company' },
        403
      );
    }

    const companyUuid = userData.company_uuid;

    // Check if vehicle exists
    const { data: existingVehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('uuid')
      .eq('uuid', uuid)
      .eq('company_uuid', companyUuid)
      .single();

    if (fetchError || !existingVehicle) {
      return jsonResponse(
        { code: 'NOT_FOUND', message: 'Pojazd nie został znaleziony' },
        404
      );
    }

    // Soft delete (set deleted_at and is_active=false)
    const { error: deleteError } = await supabase
      .from('vehicles')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('uuid', uuid)
      .eq('company_uuid', companyUuid);

    if (deleteError) {
      console.error('Error deleting vehicle:', deleteError);
      return jsonResponse(
        { code: 'INTERNAL_ERROR', message: 'Failed to delete vehicle' },
        500
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/vehicles/:uuid:', error);
    return jsonResponse(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      500
    );
  }
};


