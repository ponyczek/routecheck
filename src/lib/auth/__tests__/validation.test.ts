import { describe, it, expect } from "vitest";
import { signInFormSchema, validateReturnTo, parseExpiredParam } from "../validation";

describe("signInFormSchema", () => {
  it("validates correct email and password", () => {
    const result = signInFormSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = signInFormSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe("email");
      expect(result.error.issues[0].message).toContain("poprawny adres e-mail");
    }
  });

  it("rejects empty email", () => {
    const result = signInFormSchema.safeParse({
      email: "",
      password: "password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe("email");
      expect(result.error.issues[0].message).toContain("Podaj adres e-mail");
    }
  });

  it("rejects email that is too long", () => {
    const longEmail = "a".repeat(150) + "@example.com";
    const result = signInFormSchema.safeParse({
      email: longEmail,
      password: "password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe("email");
      expect(result.error.issues[0].message).toContain("za długi");
    }
  });

  it("rejects password that is too short", () => {
    const result = signInFormSchema.safeParse({
      email: "test@example.com",
      password: "12345",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe("password");
      expect(result.error.issues[0].message).toContain("min. 6 znaków");
    }
  });

  it("rejects password that is too long", () => {
    const longPassword = "a".repeat(129);
    const result = signInFormSchema.safeParse({
      email: "test@example.com",
      password: longPassword,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe("password");
      expect(result.error.issues[0].message).toContain("za długie");
    }
  });

  it("accepts password with exactly 6 characters", () => {
    const result = signInFormSchema.safeParse({
      email: "test@example.com",
      password: "123456",
    });

    expect(result.success).toBe(true);
  });

  it("accepts password with exactly 128 characters", () => {
    const result = signInFormSchema.safeParse({
      email: "test@example.com",
      password: "a".repeat(128),
    });

    expect(result.success).toBe(true);
  });
});

describe("validateReturnTo", () => {
  it("returns /dashboard for undefined", () => {
    expect(validateReturnTo(undefined)).toBe("/dashboard");
  });

  it("returns /dashboard for null", () => {
    expect(validateReturnTo(null)).toBe("/dashboard");
  });

  it("returns /dashboard for empty string", () => {
    expect(validateReturnTo("")).toBe("/dashboard");
  });

  it("accepts valid internal path", () => {
    expect(validateReturnTo("/reports")).toBe("/reports");
  });

  it("rejects path without leading slash", () => {
    expect(validateReturnTo("reports")).toBe("/dashboard");
  });

  it("rejects absolute URL with protocol", () => {
    expect(validateReturnTo("https://evil.com/hack")).toBe("/dashboard");
  });

  it("rejects path with protocol injection", () => {
    expect(validateReturnTo("/path://evil.com")).toBe("/dashboard");
  });

  it("accepts paths with query parameters", () => {
    expect(validateReturnTo("/reports?status=active")).toBe("/reports?status=active");
  });

  it("accepts paths with hash", () => {
    expect(validateReturnTo("/reports#section")).toBe("/reports#section");
  });

  it("accepts nested paths", () => {
    expect(validateReturnTo("/admin/users/123")).toBe("/admin/users/123");
  });
});

describe("parseExpiredParam", () => {
  it("returns true for 'true'", () => {
    expect(parseExpiredParam("true")).toBe(true);
  });

  it("returns true for '1'", () => {
    expect(parseExpiredParam("1")).toBe(true);
  });

  it("returns false for 'false'", () => {
    expect(parseExpiredParam("false")).toBe(false);
  });

  it("returns false for '0'", () => {
    expect(parseExpiredParam("0")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(parseExpiredParam(undefined)).toBe(false);
  });

  it("returns false for null", () => {
    expect(parseExpiredParam(null)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(parseExpiredParam("")).toBe(false);
  });

  it("returns false for random string", () => {
    expect(parseExpiredParam("random")).toBe(false);
  });
});

