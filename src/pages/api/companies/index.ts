import type { APIRoute } from "astro";
import { z } from "zod";
import { supabaseServiceClient } from "@/db/supabase.client";
import { errorResponse, jsonResponse, formatZodError } from "@/lib/utils/errors";
import type { CompanyDTO } from "@/types";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Request body validation schema
 */
const createCompanySchema = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters")
    .transform((val) => val.trim()),
  userUuid: z.string().uuid("Invalid user UUID"),
});

/**
 * POST /api/companies
 *
 * Creates a new company and associates it with the authenticated user.
 *
 * Flow:
 * 1. Verify authentication (JWT token)
 * 2. Validate request body
 * 3. Check if user already has a company (409 if exists)
 * 4. Create company record
 * 5. Create user record linking user to company
 *
 * @param context - Astro API context
 * @returns 201 with CompanyDTO on success
 * @throws 400 for invalid input data
 * @throws 401 for unauthorized requests
 * @throws 403 for forbidden operations (e.g., creating company for another user)
 * @throws 409 for duplicate company (user already has one)
 * @throws 500 for server errors
 */
export const POST: APIRoute = async (context) => {
  try {
    // Step 1: Extract and verify JWT from Authorization header
    const authHeader = context.request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("unauthorized", "Missing or invalid authorization token", 401);
    }

    const token = authHeader.substring(7);

    // Verify user token using service client (bypasses RLS for verification)
    const {
      data: { user },
      error: authError,
    } = await supabaseServiceClient.auth.getUser(token);

    if (authError || !user) {
      return errorResponse("unauthorized", "Invalid authentication token", 401);
    }

    // Step 2: Parse and validate request body
    const body = await context.request.json().catch(() => null);

    if (!body) {
      return errorResponse("validation_error", "Invalid JSON in request body", 400);
    }

    const validation = createCompanySchema.safeParse(body);

    if (!validation.success) {
      return jsonResponse(formatZodError(validation.error), 400);
    }

    const { name, userUuid } = validation.data;

    // Step 3: Verify user is creating company for themselves
    if (userUuid !== user.id) {
      return errorResponse("forbidden", "Cannot create company for another user", 403);
    }

    // Step 4: Check if user already has a company
    const { data: existingUser, error: userCheckError } = await supabaseServiceClient
      .from("users")
      .select("company_uuid")
      .eq("uuid", user.id)
      .maybeSingle();

    if (userCheckError) {
      console.error("Error checking existing user:", userCheckError);
      return errorResponse("internal_error", "Failed to verify user status", 500);
    }

    if (existingUser) {
      return errorResponse("company_already_exists", "User already has a company", 409);
    }

    // Step 5: Create company record using service client (bypasses RLS)
    const { data: company, error: companyError } = await supabaseServiceClient
      .from("companies")
      .insert({
        name,
      })
      .select("uuid, name, created_at")
      .single();

    if (companyError || !company) {
      console.error("Error creating company:", companyError);
      return errorResponse("internal_error", "Failed to create company", 500);
    }

    // Step 6: Create user record linking to company using service client (bypasses RLS)
    const { error: userInsertError } = await supabaseServiceClient.from("users").insert({
      uuid: user.id,
      company_uuid: company.uuid,
    });

    if (userInsertError) {
      console.error("Error creating user record:", userInsertError);

      // Attempt to clean up created company (best effort) using service client
      const cleanupResult = await supabaseServiceClient.from("companies").delete().eq("uuid", company.uuid);

      if (cleanupResult.error) {
        console.error("Failed to clean up company:", cleanupResult.error);
      }

      return errorResponse("internal_error", "Failed to associate user with company", 500);
    }

    // Step 7: Return success response with CompanyDTO
    const response: CompanyDTO = {
      uuid: company.uuid,
      name: company.name,
      createdAt: company.created_at,
    };

    return jsonResponse(response, 201);
  } catch (error) {
    console.error("Unexpected error in POST /api/companies:", error);
    return errorResponse("internal_error", "An unexpected error occurred", 500);
  }
};
