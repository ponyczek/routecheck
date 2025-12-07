import type { APIRoute } from "astro";
import type { UpdateAssignmentCommand } from "@/types";
import { jsonResponse } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * PATCH /api/assignments/{uuid}
 * 
 * Updates an existing assignment
 * Validates for overlapping assignments
 */
export const PATCH: APIRoute = async ({ locals, request, params }) => {
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
    const assignmentUuid = params.uuid;

    if (!assignmentUuid) {
      return jsonResponse(
        { code: 'VALIDATION_ERROR', message: 'Assignment UUID is required' },
        400
      );
    }

    // Check if assignment exists and belongs to company
    const { data: existingAssignment, error: fetchError } = await supabase
      .from('driver_vehicle_assignments')
      .select('uuid, driver_uuid, vehicle_uuid, start_date, end_date')
      .eq('uuid', assignmentUuid)
      .eq('company_uuid', companyUuid)
      .single();

    if (fetchError || !existingAssignment) {
      return jsonResponse(
        { code: 'NOT_FOUND', message: 'Assignment not found' },
        404
      );
    }

    // Parse request body
    const body = await request.json() as UpdateAssignmentCommand;

    // Prepare update data (merge with existing)
    const updateData = {
      driver_uuid: body.driverUuid ?? existingAssignment.driver_uuid,
      vehicle_uuid: body.vehicleUuid ?? existingAssignment.vehicle_uuid,
      start_date: body.startDate ?? existingAssignment.start_date,
      end_date: body.endDate !== undefined ? body.endDate : existingAssignment.end_date,
    };

    // Validate date range
    if (updateData.end_date && updateData.end_date < updateData.start_date) {
      return jsonResponse(
        { code: 'INVALID_DATE_RANGE', message: 'Data zakończenia musi być późniejsza lub równa dacie rozpoczęcia' },
        400
      );
    }

    // Check for overlapping assignments for driver (exclude current assignment)
    const driverOverlapQuery = supabase
      .from('driver_vehicle_assignments')
      .select('uuid, start_date, end_date')
      .eq('company_uuid', companyUuid)
      .eq('driver_uuid', updateData.driver_uuid)
      .neq('uuid', assignmentUuid);

    if (updateData.end_date) {
      driverOverlapQuery.or(`end_date.gte.${updateData.start_date},end_date.is.null`);
      driverOverlapQuery.lte('start_date', updateData.end_date);
    } else {
      driverOverlapQuery.or(`end_date.gte.${updateData.start_date},end_date.is.null`);
    }

    const { data: driverOverlaps } = await driverOverlapQuery;

    if (driverOverlaps && driverOverlaps.length > 0) {
      return jsonResponse(
        {
          code: 'ASSIGNMENT_OVERLAP',
          message: 'Ten kierowca jest już przypisany do innego pojazdu w tym okresie',
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

    // Check for overlapping assignments for vehicle (exclude current assignment)
    const vehicleOverlapQuery = supabase
      .from('driver_vehicle_assignments')
      .select('uuid, start_date, end_date')
      .eq('company_uuid', companyUuid)
      .eq('vehicle_uuid', updateData.vehicle_uuid)
      .neq('uuid', assignmentUuid);

    if (updateData.end_date) {
      vehicleOverlapQuery.or(`end_date.gte.${updateData.start_date},end_date.is.null`);
      vehicleOverlapQuery.lte('start_date', updateData.end_date);
    } else {
      vehicleOverlapQuery.or(`end_date.gte.${updateData.start_date},end_date.is.null`);
    }

    const { data: vehicleOverlaps } = await vehicleOverlapQuery;

    if (vehicleOverlaps && vehicleOverlaps.length > 0) {
      return jsonResponse(
        {
          code: 'ASSIGNMENT_OVERLAP',
          message: 'Ten pojazd jest już przypisany do innego kierowcy w tym okresie',
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

    // Update assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('driver_vehicle_assignments')
      .update(updateData)
      .eq('uuid', assignmentUuid)
      .eq('company_uuid', companyUuid)
      .select('uuid, driver_uuid, vehicle_uuid, company_uuid, start_date, end_date')
      .single();

    if (updateError) {
      console.error('Error updating assignment:', updateError);
      return jsonResponse(
        { code: 'INTERNAL_ERROR', message: 'Failed to update assignment' },
        500
      );
    }

    // Transform to camelCase
    const responseAssignment = {
      uuid: updatedAssignment.uuid,
      driverUuid: updatedAssignment.driver_uuid,
      vehicleUuid: updatedAssignment.vehicle_uuid,
      companyUuid: updatedAssignment.company_uuid,
      startDate: updatedAssignment.start_date,
      endDate: updatedAssignment.end_date,
    };

    return jsonResponse(responseAssignment, 200);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/assignments/{uuid}:', error);
    return jsonResponse(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      500
    );
  }
};

/**
 * DELETE /api/assignments/{uuid}
 * 
 * Deletes an assignment (hard delete)
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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
    const assignmentUuid = params.uuid;

    if (!assignmentUuid) {
      return jsonResponse(
        { code: 'VALIDATION_ERROR', message: 'Assignment UUID is required' },
        400
      );
    }

    // Delete assignment
    const { error: deleteError, count } = await supabase
      .from('driver_vehicle_assignments')
      .delete({ count: 'exact' })
      .eq('uuid', assignmentUuid)
      .eq('company_uuid', companyUuid);

    if (deleteError) {
      console.error('Error deleting assignment:', deleteError);
      return jsonResponse(
        { code: 'INTERNAL_ERROR', message: 'Failed to delete assignment' },
        500
      );
    }

    if (count === 0) {
      return jsonResponse(
        { code: 'NOT_FOUND', message: 'Assignment not found' },
        404
      );
    }

    // Return 204 No Content for successful deletion
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/assignments/{uuid}:', error);
    return jsonResponse(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      500
    );
  }
};


