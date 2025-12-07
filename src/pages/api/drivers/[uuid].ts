import type { APIRoute } from "astro";
import type { UpdateDriverCommand } from "@/types";
import { jsonResponse } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/drivers/:uuid
 * 
 * Gets a single driver by UUID
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

    // Get driver (with company check via RLS)
    const { data: driver, error } = await supabase
      .from('drivers')
      .select('uuid, name, email, timezone, is_active, created_at, deleted_at')
      .eq('uuid', uuid)
      .eq('company_uuid', userData.company_uuid)
      .single();

    if (error || !driver) {
      return jsonResponse(
        { code: 'NOT_FOUND', message: 'Kierowca nie został znaleziony' },
        404
      );
    }

    // Transform to camelCase
    const responseDriver = {
      uuid: driver.uuid,
      name: driver.name,
      email: driver.email,
      timezone: driver.timezone,
      isActive: driver.is_active,
      createdAt: driver.created_at,
      deletedAt: driver.deleted_at,
    };

    return jsonResponse(responseDriver, 200);
  } catch (error) {
    console.error('Unexpected error in GET /api/drivers/:uuid:', error);
    return jsonResponse(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      500
    );
  }
};

/**
 * PATCH /api/drivers/:uuid
 * 
 * Updates a driver
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

    // Check if driver exists and belongs to user's company
    const { data: existingDriver, error: fetchError } = await supabase
      .from('drivers')
      .select('uuid, email, deleted_at')
      .eq('uuid', uuid)
      .eq('company_uuid', companyUuid)
      .single();

    if (fetchError || !existingDriver) {
      return jsonResponse(
        { code: 'NOT_FOUND', message: 'Kierowca nie został znaleziony' },
        404
      );
    }

    // Check if driver is deleted
    if (existingDriver.deleted_at !== null) {
      return jsonResponse(
        { code: 'FORBIDDEN', message: 'Nie można edytować usuniętego kierowcy' },
        403
      );
    }

    // Parse request body
    const body = await request.json() as UpdateDriverCommand;

    // Check for duplicate email (if email is being changed)
    if (body.email && body.email.toLowerCase() !== existingDriver.email.toLowerCase()) {
      const { data: duplicateDriver } = await supabase
        .from('drivers')
        .select('uuid')
        .eq('company_uuid', companyUuid)
        .eq('email', body.email.toLowerCase())
        .neq('uuid', uuid)
        .is('deleted_at', null)
        .maybeSingle();

      if (duplicateDriver) {
        return jsonResponse(
          { code: 'CONFLICT', message: 'Kierowca z tym adresem e-mail już istnieje' },
          409
        );
      }
    }

    // Build update object (only include defined fields)
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email.toLowerCase();
    if (body.timezone !== undefined) updates.timezone = body.timezone;
    if (body.isActive !== undefined) updates.is_active = body.isActive;

    if (Object.keys(updates).length === 0) {
      return jsonResponse(
        { code: 'VALIDATION_ERROR', message: 'No fields to update' },
        400
      );
    }

    // Update driver
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update(updates)
      .eq('uuid', uuid)
      .eq('company_uuid', companyUuid)
      .select('uuid, name, email, timezone, is_active, created_at, deleted_at')
      .single();

    if (updateError) {
      console.error('Error updating driver:', updateError);

      // Check for unique constraint violation
      if (updateError.code === '23505') {
        return jsonResponse(
          { code: 'CONFLICT', message: 'Kierowca z tym adresem e-mail już istnieje' },
          409
        );
      }

      return jsonResponse(
        { code: 'INTERNAL_ERROR', message: 'Failed to update driver' },
        500
      );
    }

    // Transform to camelCase
    const responseDriver = {
      uuid: updatedDriver.uuid,
      name: updatedDriver.name,
      email: updatedDriver.email,
      timezone: updatedDriver.timezone,
      isActive: updatedDriver.is_active,
      createdAt: updatedDriver.created_at,
      deletedAt: updatedDriver.deleted_at,
    };

    return jsonResponse(responseDriver, 200);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/drivers/:uuid:', error);
    return jsonResponse(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      500
    );
  }
};

/**
 * DELETE /api/drivers/:uuid
 * 
 * Soft deletes a driver
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

    // Check if driver exists
    const { data: existingDriver, error: fetchError } = await supabase
      .from('drivers')
      .select('uuid')
      .eq('uuid', uuid)
      .eq('company_uuid', companyUuid)
      .single();

    if (fetchError || !existingDriver) {
      return jsonResponse(
        { code: 'NOT_FOUND', message: 'Kierowca nie został znaleziony' },
        404
      );
    }

    // Soft delete (set deleted_at and is_active=false)
    const { error: deleteError } = await supabase
      .from('drivers')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('uuid', uuid)
      .eq('company_uuid', companyUuid);

    if (deleteError) {
      console.error('Error deleting driver:', deleteError);
      return jsonResponse(
        { code: 'INTERNAL_ERROR', message: 'Failed to delete driver' },
        500
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/drivers/:uuid:', error);
    return jsonResponse(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      500
    );
  }
};
