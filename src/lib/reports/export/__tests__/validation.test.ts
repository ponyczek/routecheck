import { describe, it, expect, beforeEach } from "vitest";
import { validateDateRange, validateForm } from "../validation";
import type { DateRange } from "../types";

describe("validateDateRange", () => {
  let today: Date;

  beforeEach(() => {
    // Set today to a fixed date for consistent tests
    today = new Date();
    today.setHours(0, 0, 0, 0);
  });

  describe("Required fields validation", () => {
    it("returns error when 'from' date is missing", () => {
      const range: DateRange = { from: undefined, to: new Date("2025-01-15") };
      const result = validateDateRange(range);
      expect(result).toBe("Zakres dat jest wymagany");
    });

    it("returns error when 'to' date is missing", () => {
      const range: DateRange = { from: new Date("2025-01-01"), to: undefined };
      const result = validateDateRange(range);
      expect(result).toBe("Zakres dat jest wymagany");
    });

    it("returns error when both dates are missing", () => {
      const range: DateRange = { from: undefined, to: undefined };
      const result = validateDateRange(range);
      expect(result).toBe("Zakres dat jest wymagany");
    });
  });

  describe("Date order validation", () => {
    it("returns error when 'from' is later than 'to'", () => {
      const range: DateRange = {
        from: new Date("2025-01-20"),
        to: new Date("2025-01-15"),
      };
      const result = validateDateRange(range);
      expect(result).toBe("Data początkowa musi być wcześniejsza lub równa dacie końcowej");
    });

    it("allows equal dates (same day)", () => {
      const date = new Date("2024-01-15");
      const range: DateRange = { from: date, to: date };
      const result = validateDateRange(range);
      expect(result).toBeUndefined();
    });

    it("allows correct date order", () => {
      const range: DateRange = {
        from: new Date("2024-01-01"),
        to: new Date("2024-01-15"),
      };
      const result = validateDateRange(range);
      expect(result).toBeUndefined();
    });
  });

  describe("31-day limit validation", () => {
    it("returns error when range exceeds 31 days", () => {
      const range: DateRange = {
        from: new Date("2024-01-01"),
        to: new Date("2024-02-02"), // 32 days between
      };
      const result = validateDateRange(range);
      expect(result).toBe("Zakres nie może przekraczać 31 dni");
    });

    it("allows exactly 31 days between dates", () => {
      const range: DateRange = {
        from: new Date("2024-01-01"),
        to: new Date("2024-02-01"), // Exactly 31 days
      };
      const result = validateDateRange(range);
      expect(result).toBeUndefined();
    });

    it("allows 30-day range", () => {
      const range: DateRange = {
        from: new Date("2024-01-01"),
        to: new Date("2024-01-31"), // 30 days
      };
      const result = validateDateRange(range);
      expect(result).toBeUndefined();
    });

    it("allows 20-day range", () => {
      const range: DateRange = {
        from: new Date("2024-01-01"),
        to: new Date("2024-01-20"), // 19 days
      };
      const result = validateDateRange(range);
      expect(result).toBeUndefined();
    });

    it("allows single day range", () => {
      const date = new Date("2024-01-15");
      const range: DateRange = { from: date, to: date };
      const result = validateDateRange(range);
      expect(result).toBeUndefined();
    });
  });

  describe("Future date validation", () => {
    it("returns error when 'from' is in the future", () => {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const range: DateRange = { from: tomorrow, to: nextWeek };
      const result = validateDateRange(range);
      expect(result).toBe("Nie możesz wybrać dat w przyszłości");
    });

    it("returns error when 'to' is in the future", () => {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const range: DateRange = { from: yesterday, to: tomorrow };
      const result = validateDateRange(range);
      expect(result).toBe("Nie możesz wybrać dat w przyszłości");
    });

    it("allows today as 'from' date", () => {
      const range: DateRange = { from: today, to: today };
      const result = validateDateRange(range);
      expect(result).toBeUndefined();
    });

    it("allows yesterday as 'to' date", () => {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      const range: DateRange = { from: lastWeek, to: yesterday };
      const result = validateDateRange(range);
      expect(result).toBeUndefined();
    });
  });

  describe("Complex scenarios", () => {
    it("handles leap year dates correctly", () => {
      const range: DateRange = {
        from: new Date("2024-02-20"),
        to: new Date("2024-02-29"), // Leap year
      };
      const result = validateDateRange(range);
      expect(result).toBeUndefined();
    });

    it("handles month boundary correctly", () => {
      const range: DateRange = {
        from: new Date("2024-01-25"),
        to: new Date("2024-02-05"),
      };
      const result = validateDateRange(range);
      expect(result).toBeUndefined();
    });

    it("handles year boundary correctly", () => {
      const range: DateRange = {
        from: new Date("2023-12-20"),
        to: new Date("2024-01-05"),
      };
      const result = validateDateRange(range);
      expect(result).toBeUndefined();
    });
  });
});

describe("validateForm", () => {
  it("returns no errors for valid date range", () => {
    const range: DateRange = {
      from: new Date("2024-01-01"),
      to: new Date("2024-01-15"),
    };
    const result = validateForm(range);
    expect(result).toEqual({});
  });

  it("returns dateRange error when validation fails", () => {
    const range: DateRange = { from: undefined, to: undefined };
    const result = validateForm(range);
    expect(result).toHaveProperty("dateRange");
    expect(result.dateRange).toBe("Zakres dat jest wymagany");
  });

  it("returns dateRange error when range exceeds 31 days", () => {
    const range: DateRange = {
      from: new Date("2024-01-01"),
      to: new Date("2024-02-15"),
    };
    const result = validateForm(range);
    expect(result).toHaveProperty("dateRange");
    expect(result.dateRange).toBe("Zakres nie może przekraczać 31 dni");
  });

  it("returns dateRange error when dates are in wrong order", () => {
    const range: DateRange = {
      from: new Date("2024-01-20"),
      to: new Date("2024-01-10"),
    };
    const result = validateForm(range);
    expect(result).toHaveProperty("dateRange");
    expect(result.dateRange).toBe("Data początkowa musi być wcześniejsza lub równa dacie końcowej");
  });
});
