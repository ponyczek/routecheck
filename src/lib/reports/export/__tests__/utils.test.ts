import { describe, it, expect } from "vitest";
import {
  formatDateToIsoDateOnly,
  getDaysDifference,
  generateCsvFilename,
  extractFilenameFromHeader,
} from "../utils";

describe("formatDateToIsoDateOnly", () => {
  it("formats date to YYYY-MM-DD format", () => {
    const date = new Date("2025-01-15T10:30:00Z");
    const result = formatDateToIsoDateOnly(date);
    expect(result).toBe("2025-01-15");
  });

  it("handles dates with single-digit month and day", () => {
    const date = new Date("2025-03-05T00:00:00Z");
    const result = formatDateToIsoDateOnly(date);
    expect(result).toBe("2025-03-05");
  });

  it("handles end of year dates", () => {
    const date = new Date("2024-12-31T23:59:59Z");
    const result = formatDateToIsoDateOnly(date);
    expect(result).toBe("2024-12-31");
  });

  it("handles leap year dates", () => {
    const date = new Date("2024-02-29T12:00:00Z");
    const result = formatDateToIsoDateOnly(date);
    expect(result).toBe("2024-02-29");
  });
});

describe("getDaysDifference", () => {
  it("calculates difference between same dates as 0 days", () => {
    const date = new Date("2025-01-15");
    const result = getDaysDifference(date, date);
    expect(result).toBe(0);
  });

  it("calculates difference between consecutive dates as 1 day", () => {
    const from = new Date("2025-01-15");
    const to = new Date("2025-01-16");
    const result = getDaysDifference(from, to);
    expect(result).toBe(1);
  });

  it("calculates difference for a week (6 days between)", () => {
    const from = new Date("2025-01-01");
    const to = new Date("2025-01-07");
    const result = getDaysDifference(from, to);
    expect(result).toBe(6);
  });

  it("calculates difference for 31-day range (30 days between)", () => {
    const from = new Date("2025-01-01");
    const to = new Date("2025-01-31");
    const result = getDaysDifference(from, to);
    expect(result).toBe(30);
  });

  it("handles dates in reverse order (absolute difference)", () => {
    const from = new Date("2025-01-20");
    const to = new Date("2025-01-15");
    const result = getDaysDifference(from, to);
    expect(result).toBe(5);
  });

  it("calculates difference across month boundaries", () => {
    const from = new Date("2025-01-28");
    const to = new Date("2025-02-02");
    const result = getDaysDifference(from, to);
    expect(result).toBe(5); // 5 days between
  });

  it("calculates difference across year boundaries", () => {
    const from = new Date("2024-12-30");
    const to = new Date("2025-01-02");
    const result = getDaysDifference(from, to);
    expect(result).toBe(3); // 3 days between
  });
});

describe("generateCsvFilename", () => {
  it("generates filename with company name and date", () => {
    const result = generateCsvFilename("TestCompany");
    expect(result).toMatch(/^reports_TestCompany_\d{8}\.csv$/);
  });

  it("replaces special characters in company name with underscores", () => {
    const result = generateCsvFilename("Test Company & Co.");
    expect(result).toMatch(/^reports_Test_Company___Co__\d{8}\.csv$/);
  });

  it("generates filename with 'export' when no company name provided", () => {
    const result = generateCsvFilename();
    expect(result).toMatch(/^reports_export_\d{8}\.csv$/);
  });

  it("generates filename with 'export' when empty company name provided", () => {
    const result = generateCsvFilename("");
    expect(result).toMatch(/^reports_export_\d{8}\.csv$/);
  });

  it("includes current date in YYYYMMDD format", () => {
    const result = generateCsvFilename("Company");
    const datePattern = /\d{8}/;
    const match = result.match(datePattern);
    expect(match).not.toBeNull();
    expect(match![0]).toHaveLength(8);
  });

  it("handles Polish characters in company name", () => {
    const result = generateCsvFilename("Firma Łódź Ś.A.");
    // Polish characters and special chars will be replaced with underscores
    expect(result).toMatch(/^reports_Firma___d____A__\d{8}\.csv$/);
  });
});

describe("extractFilenameFromHeader", () => {
  it("extracts filename from Content-Disposition header with quotes", () => {
    const header = 'attachment; filename="reports_Company_20250115.csv"';
    const result = extractFilenameFromHeader(header);
    expect(result).toBe("reports_Company_20250115.csv");
  });

  it("extracts filename from Content-Disposition header without quotes", () => {
    const header = "attachment; filename=reports_Company_20250115.csv";
    const result = extractFilenameFromHeader(header);
    expect(result).toBe("reports_Company_20250115.csv");
  });

  it("returns null when Content-Disposition is null", () => {
    const result = extractFilenameFromHeader(null);
    expect(result).toBeNull();
  });

  it("returns null when Content-Disposition has no filename", () => {
    const header = "attachment";
    const result = extractFilenameFromHeader(header);
    expect(result).toBeNull();
  });

  it("handles Content-Disposition with multiple parameters", () => {
    const header =
      'attachment; filename="report.csv"; creation-date="Mon, 15 Jan 2025 10:00:00 GMT"';
    const result = extractFilenameFromHeader(header);
    expect(result).toBe("report.csv");
  });

  it("handles Content-Disposition with UTF-8 filenames", () => {
    const header = 'attachment; filename="raporty_Łódź_20250115.csv"';
    const result = extractFilenameFromHeader(header);
    expect(result).toBe("raporty_Łódź_20250115.csv");
  });
});

