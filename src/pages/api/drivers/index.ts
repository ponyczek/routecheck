import type { APIRoute } from "astro";
import type { DriversListResponseDTO, CreateDriverCommand } from "@/types";
import { jsonResponse } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/drivers
 * 
 * Lists drivers with filtering, sorting, and pagination
 * Uses Supabase for persistent storage
 */
export const GET: APIRoute = async ({ locals, request }) => {
  try {
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

    // Parse query parameters
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const isActiveParam = url.searchParams.get('isActive');
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
    const sortBy = (url.searchParams.get('sortBy') || 'name') as 'name' | 'created_at';
    const sortDir = (url.searchParams.get('sortDir') || 'asc') as 'asc' | 'desc';
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    // Build query
    let query = supabase
      .from('drivers')
      .select('uuid, name, email, timezone, is_active, created_at, deleted_at')
      .eq('company_uuid', companyUuid);

    // Filter by search query
    if (q) {
      query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    // Filter by active status
    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true';
      query = query.eq('is_active', isActive);
    }

    // Filter deleted
    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    // Sort
    const sortColumn = sortBy === 'name' ? 'name' : 'created_at';
    query = query.order(sortColumn, { ascending: sortDir === 'asc' });

    // Limit
    query = query.limit(limit);

    const { data: drivers, error } = await query;

    if (error) {
      console.error('Error fetching drivers:', error);
      return jsonResponse(
        { code: 'INTERNAL_ERROR', message: 'Failed to fetch drivers' },
        500
      );
    }

    // Transform to camelCase (match DTO format)
    const items = (drivers || []).map(driver => ({
      uuid: driver.uuid,
      name: driver.name,
      email: driver.email,
      timezone: driver.timezone,
      isActive: driver.is_active,
      createdAt: driver.created_at,
      deletedAt: driver.deleted_at,
    }));

    const response: DriversListResponseDTO = {
      items,
      nextCursor: items.length >= limit ? 'has-more' : null, // Simplified pagination
    };

    return jsonResponse(response, 200);
  } catch (error) {
    console.error('Unexpected error in GET /api/drivers:', error);
    return jsonResponse(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      500
    );
  }
};

/**
 * POST /api/drivers
 * 
 * Creates a new driver
 * Uses Supabase for persistent storage
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
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

    // Parse request body
    const body = await request.json() as CreateDriverCommand;

    // Validate required fields
    if (!body.name || !body.email || !body.timezone) {
      return jsonResponse(
        { code: 'VALIDATION_ERROR', message: 'Missing required fields: name, email, timezone' },
        400
      );
    }

    // Check for duplicate email (Supabase constraint will also catch this)
    const { data: existingDriver } = await supabase
      .from('drivers')
      .select('uuid')
      .eq('company_uuid', companyUuid)
      .eq('email', body.email.toLowerCase())
      .is('deleted_at', null)
      .maybeSingle();

    if (existingDriver) {
      return jsonResponse(
        { code: 'CONFLICT', message: 'Kierowca z tym adresem e-mail już istnieje' },
        409
      );
    }

    // Insert new driver
    const { data: newDriver, error: insertError } = await supabase
      .from('drivers')
      .insert({
        company_uuid: companyUuid,
        name: body.name,
        email: body.email.toLowerCase(),
        timezone: body.timezone,
        is_active: body.isActive ?? true,
      })
      .select('uuid, name, email, timezone, is_active, created_at, deleted_at')
      .single();

    if (insertError) {
      console.error('Error creating driver:', insertError);
      
      // Check for unique constraint violation
      if (insertError.code === '23505') {
        return jsonResponse(
          { code: 'CONFLICT', message: 'Kierowca z tym adresem e-mail już istnieje' },
          409
        );
      }

      return jsonResponse(
        { code: 'INTERNAL_ERROR', message: 'Failed to create driver' },
        500
      );
    }

    // Transform to camelCase
    const responseDriver = {
      uuid: newDriver.uuid,
      name: newDriver.name,
      email: newDriver.email,
      timezone: newDriver.timezone,
      isActive: newDriver.is_active,
      createdAt: newDriver.created_at,
      deletedAt: newDriver.deleted_at,
    };

    return jsonResponse(responseDriver, 201);
  } catch (error) {
    console.error('Unexpected error in POST /api/drivers:', error);
    return jsonResponse(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      500
    );
  }
};
