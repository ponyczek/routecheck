import type { APIRoute } from "astro";
import { fetchCurrentCompany, createCompanyErrorResponse } from "@/lib/services/companiesService";
import { jsonResponse } from "@/lib/utils/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/companies/me
 *
 * Fetches the current authenticated user's company data.
 *
 * Flow:
 * 1. Verify authentication via Supabase session
 * 2. Fetch user's company_uuid
 * 3. Fetch company data from database
 * 4. Return CompanyDTO
 *
 * @param context - Astro API context
 * @returns 200 with CompanyDTO on success
 * @throws 401 for unauthorized requests (no session or expired token)
 * @throws 404 if company doesn't exist in database
 * @throws 500 for server errors
 */
export const GET: APIRoute = async () => {
  try {
    const company = await fetchCurrentCompany();

    return jsonResponse(company, 200);
  } catch (error) {
    const errorResponse = createCompanyErrorResponse(error);
    return jsonResponse(errorResponse.body, errorResponse.status);
  }
};

