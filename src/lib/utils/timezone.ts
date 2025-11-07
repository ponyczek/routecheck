/**
 * Validates if a string is a valid IANA timezone identifier
 * @param timezone - Timezone string to validate
 * @returns true if valid, false otherwise
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // Try to create a date formatter with the timezone
    // This will throw if the timezone is invalid
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Common IANA timezone identifiers for quick reference
 * This is not exhaustive - the actual validation uses Intl.DateTimeFormat
 */
export const COMMON_TIMEZONES = [
  "Europe/Warsaw",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "UTC",
] as const;
