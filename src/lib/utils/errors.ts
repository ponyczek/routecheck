import type { ProblemDetail } from "../../types";
import type { ZodError } from "zod";

/**
 * Creates a standardized error response following ProblemDetail format
 */
export function createProblemDetail(code: string, message: string, details?: Record<string, unknown>): ProblemDetail {
  return {
    code,
    message,
    ...(details && { details }),
  };
}

/**
 * Formats Zod validation errors into ProblemDetail format
 */
export function formatZodError(error: ZodError): ProblemDetail {
  const details: Record<string, unknown> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    details[path] = err.message;
  });

  return createProblemDetail("validation_error", "Invalid request data", details);
}

/**
 * Creates a JSON response with appropriate status code
 */
export function jsonResponse(body: unknown, status: number, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Creates an error response with ProblemDetail format
 */
export function errorResponse(code: string, message: string, status: number, details?: Record<string, unknown>) {
  return jsonResponse(createProblemDetail(code, message, details), status);
}
