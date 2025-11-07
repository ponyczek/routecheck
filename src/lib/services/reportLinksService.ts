import { createHash } from "node:crypto";

import type { SupabaseClient } from "../../db/supabase.client";
import type { Uuid } from "../../types";

/**
 * Hashes a raw token with a pepper for secure storage and comparison
 * @param rawToken - The unprocessed token from the URL
 * @param pepper - Secret pepper from environment variables
 * @returns SHA-256 hash of the token + pepper
 */
export function hashToken(rawToken: string, pepper: string): string {
  return createHash("sha256")
    .update(rawToken + pepper)
    .digest("hex");
}

/**
 * Represents a valid report link retrieved from the database
 */
export interface ValidReportLink {
  uuid: Uuid;
  driverUuid: Uuid;
  companyUuid: Uuid;
  expiresAt: string;
  usedAt: string | null;
}

/**
 * Error thrown when report link validation fails
 */
export class ReportLinkError extends Error {
  constructor(
    message: string,
    public readonly code: "not_found" | "gone" | "conflict",
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ReportLinkError";
  }
}

/**
 * Retrieves and validates a report link by its hashed token
 *
 * @throws {ReportLinkError} 404 if link not found
 * @throws {ReportLinkError} 410 if link has expired
 * @throws {ReportLinkError} 409 if link has already been used
 */
export async function getValidLinkOrThrow(
  supabase: SupabaseClient,
  hashedToken: string,
  now: Date
): Promise<ValidReportLink> {
  const { data: link, error } = await supabase
    .from("report_links")
    .select("uuid, driver_uuid, company_uuid, expires_at, used_at")
    .eq("hashed_token", hashedToken)
    .single();

  // Link not found
  if (error || !link) {
    throw new ReportLinkError("Report link not found", "not_found", 404);
  }

  // Check if link has expired
  const expiresAt = new Date(link.expires_at);
  if (expiresAt < now) {
    throw new ReportLinkError("Report link has expired", "gone", 410);
  }

  // Check if link has already been used
  if (link.used_at !== null) {
    throw new ReportLinkError("Report link has already been used", "conflict", 409);
  }

  return {
    uuid: link.uuid,
    driverUuid: link.driver_uuid,
    companyUuid: link.company_uuid,
    expiresAt: link.expires_at,
    usedAt: link.used_at,
  };
}

/**
 * Marks a report link as used at the specified time
 * @param supabase - Supabase client
 * @param linkUuid - UUID of the report link
 * @param at - Time when the link was used
 */
export async function markLinkUsed(supabase: SupabaseClient, linkUuid: Uuid, at: Date): Promise<void> {
  const { error } = await supabase.from("report_links").update({ used_at: at.toISOString() }).eq("uuid", linkUuid);

  if (error) {
    throw new Error(`Failed to mark link as used: ${error.message}`);
  }
}
