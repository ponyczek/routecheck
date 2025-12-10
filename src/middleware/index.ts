import { defineMiddleware } from "astro:middleware";

import { createServerSupabaseClient } from "../db/supabase.client";

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

/**
 * Check if the request is for a protected (authenticated) route
 */
function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = ["/dashboard", "/drivers", "/reports", "/settings", "/vehicles", "/assignments"];

  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Create server-side Supabase client with access to cookies
  // This client can read/write session from/to cookies
  const supabase = createServerSupabaseClient(context.cookies);
  context.locals.supabase = supabase;

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

  // Authentication guard for protected routes
  if (isProtectedRoute(context.url.pathname)) {
    // IMPORTANT: Use context.locals.supabase (request-specific) instead of global supabaseClient
    // This ensures we have access to cookies from the current request
    const {
      data: { session },
      error: sessionError,
    } = await context.locals.supabase.auth.getSession();

    // Redirect to sign in if no valid session
    if (sessionError || !session?.user) {
      const returnTo = encodeURIComponent(context.url.pathname);
      return context.redirect(`/signin?returnTo=${returnTo}&expired=true`);
    }
  }

  // For non-protected endpoints, proceed normally
  return next();
});
