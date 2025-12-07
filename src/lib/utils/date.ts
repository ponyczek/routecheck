/**
 * Gets the current date in a specific timezone formatted as YYYY-MM-DD
 * @param timezone - IANA timezone identifier (e.g., "Europe/Warsaw")
 * @returns Date string in YYYY-MM-DD format
 */
export function getCurrentDateInTimezone(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // Format returns YYYY-MM-DD for en-CA locale
    return formatter.format(now);
  } catch {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
}

/**
 * Formats a date string in a specific format
 * @param date - ISO date string or Date object
 * @param format - Format string (e.g., "dd MMM yyyy", "yyyy-MM-dd")
 * @param locale - Locale for formatting (default: "pl")
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, format = "dd MMM yyyy", locale = "pl"): string {
  const target = typeof date === "string" ? new Date(date) : date;

  // Simple format implementation
  const day = target.getDate();
  const month = target.getMonth();
  const year = target.getFullYear();

  const monthNames =
    locale === "pl"
      ? ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (format === "dd MMM yyyy") {
    return `${day} ${monthNames[month]} ${year}`;
  }

  if (format === "yyyy-MM-dd") {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Default fallback
  return target.toLocaleDateString(locale === "pl" ? "pl-PL" : "en-US");
}

/**
 * Formats a date in long format (e.g., "12 stycznia 2024")
 * Used for displaying creation dates in settings
 * @param isoString - ISO date string
 * @returns Formatted date string in Polish long format
 */
export function formatLongDate(isoString: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoString));
}

/**
 * Formats a relative time string (e.g., "30 seconds ago", "2 minutes ago")
 * @param date - ISO date string or Date object
 * @param locale - Locale for formatting (default: "pl")
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: string | Date, locale = "pl"): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return locale === "pl" ? `${diffInSeconds} sekund temu` : `${diffInSeconds} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return locale === "pl" ? `${diffInMinutes} minut temu` : `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return locale === "pl" ? `${diffInHours} godzin temu` : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return locale === "pl" ? `${diffInDays} dni temu` : `${diffInDays} days ago`;
}
