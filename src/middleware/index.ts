import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client";

/**
 * CORS configuration for public API endpoints
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // TODO: Restrict to specific domain in production
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400", // 24 hours
};

/**
 * Check if the request is for a public API endpoint
 */
function isPublicApiEndpoint(pathname: string): boolean {
  return pathname.startsWith("/api/public/");
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Add Supabase client to context
  context.locals.supabase = supabaseClient;

  // Handle CORS for public API endpoints
  if (isPublicApiEndpoint(context.url.pathname)) {
    // Handle preflight OPTIONS request
    if (context.request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Continue with request and add CORS headers to response
    const response = await next();

    // Clone response and add CORS headers
    const headers = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // For non-public endpoints, proceed normally
  return next();
});
