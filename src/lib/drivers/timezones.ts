import type { TimezoneOption } from "./types";

/**
 * Pobiera offset UTC dla danej strefy czasowej
 */
function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((part) => part.type === "timeZoneName");

    if (offsetPart?.value && offsetPart.value.startsWith("GMT")) {
      const offset = offsetPart.value.replace("GMT", "");
      return offset || "+00:00";
    }

    // Fallback: oblicz offset ręcznie
    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const offsetMinutes = (tzDate.getTime() - utcDate.getTime()) / 60000;
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? "+" : "-";
    return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  } catch {
    return "+00:00";
  }
}

/**
 * Zwraca listę dostępnych stref czasowych jako opcje dla combobox
 */
export function getTimezoneOptions(): TimezoneOption[] {
  try {
    // Używamy Intl API do pobrania listy wspieranych stref czasowych
    const timezones = Intl.supportedValuesOf("timeZone");

    return timezones.map((tz) => {
      const offset = getTimezoneOffset(tz);
      return {
        value: tz,
        label: `${tz} (UTC${offset})`,
        offset,
      };
    });
  } catch {
    // Fallback: podstawowa lista popularnych stref czasowych
    const fallbackTimezones = [
      "Europe/Warsaw",
      "Europe/London",
      "Europe/Berlin",
      "Europe/Paris",
      "Europe/Rome",
      "Europe/Madrid",
      "America/New_York",
      "America/Chicago",
      "America/Los_Angeles",
      "America/Toronto",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Dubai",
      "Australia/Sydney",
      "Pacific/Auckland",
    ];

    return fallbackTimezones.map((tz) => {
      const offset = getTimezoneOffset(tz);
      return {
        value: tz,
        label: `${tz} (UTC${offset})`,
        offset,
      };
    });
  }
}

/**
 * Wyszukuje opcje stref czasowych na podstawie query
 */
export function searchTimezones(query: string, options: TimezoneOption[]): TimezoneOption[] {
  if (!query) return options;

  const lowerQuery = query.toLowerCase();
  return options.filter((option) => option.value.toLowerCase().includes(lowerQuery) || option.offset.includes(query));
}

/**
 * Sprawdza czy strefa czasowa jest prawidłowa
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
