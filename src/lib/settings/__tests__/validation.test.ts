import { describe, it, expect } from "vitest";
import { editCompanyNameSchema } from "../validation";

describe("editCompanyNameSchema", () => {
  describe("valid company names", () => {
    it("validates correct company name with exactly 2 characters", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "AB",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("AB");
      }
    });

    it("validates correct company name with exactly 100 characters", () => {
      const longName = "A".repeat(100);
      const result = editCompanyNameSchema.safeParse({
        name: longName,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(longName);
      }
    });

    it("validates company name with typical length", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "Transport ABC Sp. z o.o.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Transport ABC Sp. z o.o.");
      }
    });

    it("validates company name with special characters", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "Firma-Transport & Logistyka (2024)",
      });

      expect(result.success).toBe(true);
    });

    it("validates company name with Polish characters", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "Przedsiębiorstwo Transportowe Śląsk",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("transformation", () => {
    it("trims whitespace from company name", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "  Test Company  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test Company");
      }
    });

    it("trims leading whitespace", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "   ABC Transport",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("ABC Transport");
      }
    });

    it("trims trailing whitespace", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "ABC Transport   ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("ABC Transport");
      }
    });
  });

  describe("validation errors", () => {
    it("rejects company name with only 1 character", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "A",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe("name");
        expect(result.error.issues[0].message).toBe("Nazwa firmy musi mieć co najmniej 2 znaki");
      }
    });

    it("rejects company name longer than 100 characters", () => {
      const longName = "A".repeat(101);
      const result = editCompanyNameSchema.safeParse({
        name: longName,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe("name");
        expect(result.error.issues[0].message).toBe("Nazwa firmy może mieć maksymalnie 100 znaków");
      }
    });

    it("rejects empty string", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // First error should be min length
        expect(result.error.issues[0].message).toBe("Nazwa firmy musi mieć co najmniej 2 znaki");
      }
    });

    it("rejects string with only whitespace", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "   ",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // After trim, it becomes empty, so the refine check should fail
        expect(result.error.issues.some((issue) => issue.message === "Nazwa firmy nie może być pusta")).toBe(true);
      }
    });

    it("rejects string with only tabs and spaces", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "\t\t  \t  ",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === "Nazwa firmy nie może być pusta")).toBe(true);
      }
    });

    it("rejects undefined", () => {
      const result = editCompanyNameSchema.safeParse({
        name: undefined,
      });

      expect(result.success).toBe(false);
    });

    it("rejects null", () => {
      const result = editCompanyNameSchema.safeParse({
        name: null,
      });

      expect(result.success).toBe(false);
    });

    it("rejects number", () => {
      const result = editCompanyNameSchema.safeParse({
        name: 12345,
      });

      expect(result.success).toBe(false);
    });

    it("rejects object", () => {
      const result = editCompanyNameSchema.safeParse({
        name: { value: "Test" },
      });

      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("accepts company name with multiple consecutive spaces (preserved after trim)", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "ABC  Transport  Logistyka",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Internal spaces should be preserved
        expect(result.data.name).toBe("ABC  Transport  Logistyka");
      }
    });

    it("accepts company name with newlines (within length limit)", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "ABC\nTransport",
      });

      expect(result.success).toBe(true);
    });

    it("rejects when trimmed length is below minimum", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "  A  ",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Nazwa firmy musi mieć co najmniej 2 znaki");
      }
    });

    it("accepts when trimmed length is exactly at minimum", () => {
      const result = editCompanyNameSchema.safeParse({
        name: "  AB  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("AB");
      }
    });

    it("accepts when trimmed length is exactly at maximum", () => {
      const longName = "A".repeat(100);
      const result = editCompanyNameSchema.safeParse({
        name: `  ${longName}  `,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe(longName);
      }
    });
  });
});
