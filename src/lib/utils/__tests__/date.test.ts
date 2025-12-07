import { describe, it, expect } from "vitest";
import { getCurrentDateInTimezone, formatRelativeTime } from "../date";

describe("getCurrentDateInTimezone", () => {
  it("returns date in YYYY-MM-DD format", () => {
    const result = getCurrentDateInTimezone("Europe/Warsaw");

    // Should match YYYY-MM-DD format
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("handles different timezones", () => {
    const warsawDate = getCurrentDateInTimezone("Europe/Warsaw");
    const tokyoDate = getCurrentDateInTimezone("Asia/Tokyo");

    // Both should be valid dates
    expect(warsawDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tokyoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("throws error for invalid timezone", () => {
    expect(() => getCurrentDateInTimezone("Invalid/Timezone")).toThrow("Invalid timezone");
  });

  it("returns consistent format for UTC", () => {
    const result = getCurrentDateInTimezone("UTC");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formatRelativeTime", () => {
  it("formats seconds ago in Polish", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 1000); // 30 seconds ago

    const result = formatRelativeTime(past, "pl");
    expect(result).toBe("30 sekund temu");
  });

  it("formats minutes ago in Polish", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago

    const result = formatRelativeTime(past, "pl");
    expect(result).toBe("5 minut temu");
  });

  it("formats hours ago in Polish", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

    const result = formatRelativeTime(past, "pl");
    expect(result).toBe("2 godzin temu");
  });

  it("formats days ago in Polish", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

    const result = formatRelativeTime(past, "pl");
    expect(result).toBe("3 dni temu");
  });

  it("handles ISO date strings", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 90 * 1000); // 90 seconds = 1 minute ago

    const result = formatRelativeTime(past.toISOString(), "pl");
    expect(result).toBe("1 minut temu");
  });

  it("handles Date objects", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 45 * 1000); // 45 seconds ago

    const result = formatRelativeTime(past, "pl");
    expect(result).toBe("45 sekund temu");
  });

  it("formats seconds ago in English", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 20 * 1000); // 20 seconds ago

    const result = formatRelativeTime(past, "en");
    expect(result).toBe("20 seconds ago");
  });

  it("formats minutes ago in English", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

    const result = formatRelativeTime(past, "en");
    expect(result).toBe("10 minutes ago");
  });

  it("defaults to Polish locale", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 15 * 1000); // 15 seconds ago

    const result = formatRelativeTime(past); // No locale specified
    expect(result).toBe("15 sekund temu");
  });

  it("handles very recent times (< 1 second)", () => {
    const now = new Date();

    const result = formatRelativeTime(now, "pl");
    expect(result).toMatch(/\d+ sekund temu/);
  });
});
