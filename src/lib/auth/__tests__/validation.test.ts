import { describe, it, expect } from "vitest";
import { signInFormSchema, signUpFormSchema, validateReturnTo, parseExpiredParam } from "../validation";

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

describe("signUpFormSchema", () => {
  it("validates correct sign up data", () => {
    const result = signUpFormSchema.safeParse({
      companyName: "Test Company",
      email: "test@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.companyName).toBe("Test Company");
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("transforms company name by trimming whitespace", () => {
    const result = signUpFormSchema.safeParse({
      companyName: "  Test Company  ",
      email: "test@example.com",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.companyName).toBe("Test Company");
    }
  });

  it("transforms email to lowercase and trims whitespace", () => {
    const result = signUpFormSchema.safeParse({
      companyName: "Test Company",
      email: "TEST@EXAMPLE.COM",
      password: "SecurePass123",
      confirmPassword: "SecurePass123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  describe("companyName validation", () => {
    it("rejects empty company name", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "",
        email: "test@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe("companyName");
        expect(result.error.issues[0].message).toContain("Podaj nazwę firmy");
      }
    });

    it("rejects company name with only 1 character", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "T",
        email: "test@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const companyNameError = result.error.issues.find((i) => i.path[0] === "companyName");
        expect(companyNameError?.message).toContain("co najmniej 2 znaki");
      }
    });

    it("accepts company name with exactly 2 characters", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "AB",
        email: "test@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });

      expect(result.success).toBe(true);
    });

    it("rejects company name longer than 100 characters", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "A".repeat(101),
        email: "test@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const companyNameError = result.error.issues.find((i) => i.path[0] === "companyName");
        expect(companyNameError?.message).toContain("za długa");
      }
    });

    it("accepts company name with exactly 100 characters", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "A".repeat(100),
        email: "test@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("rejects invalid email format", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: "invalid-email",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((i) => i.path[0] === "email");
        expect(emailError?.message).toContain("poprawny adres e-mail");
      }
    });

    it("rejects empty email", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: "",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((i) => i.path[0] === "email");
        expect(emailError?.message).toContain("Podaj adres e-mail");
      }
    });

    it("rejects email longer than 150 characters", () => {
      const longEmail = "a".repeat(150) + "@example.com";
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: longEmail,
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((i) => i.path[0] === "email");
        expect(emailError?.message).toContain("za długi");
      }
    });
  });

  describe("password validation", () => {
    it("rejects password shorter than 8 characters", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: "test@example.com",
        password: "Pass123",
        confirmPassword: "Pass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path[0] === "password");
        expect(passwordError?.message).toContain("min. 8 znaków");
      }
    });

    it("accepts password with exactly 8 characters", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: "test@example.com",
        password: "Pass1234",
        confirmPassword: "Pass1234",
      });

      expect(result.success).toBe(true);
    });

    it("rejects password longer than 128 characters", () => {
      const longPassword = "A1a" + "a".repeat(126);
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: "test@example.com",
        password: longPassword,
        confirmPassword: longPassword,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path[0] === "password");
        expect(passwordError?.message).toContain("za długie");
      }
    });

    it("rejects password without uppercase letter", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path[0] === "password");
        expect(passwordError?.message).toContain("małe i wielkie litery oraz cyfry");
      }
    });

    it("rejects password without lowercase letter", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: "test@example.com",
        password: "PASSWORD123",
        confirmPassword: "PASSWORD123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path[0] === "password");
        expect(passwordError?.message).toContain("małe i wielkie litery oraz cyfry");
      }
    });

    it("rejects password without digit", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: "test@example.com",
        password: "PasswordOnly",
        confirmPassword: "PasswordOnly",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path[0] === "password");
        expect(passwordError?.message).toContain("małe i wielkie litery oraz cyfry");
      }
    });

    it("accepts password with special characters", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: "test@example.com",
        password: "SecureP@ss123!",
        confirmPassword: "SecureP@ss123!",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("confirmPassword validation", () => {
    it("rejects when passwords don't match", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: "test@example.com",
        password: "SecurePass123",
        confirmPassword: "DifferentPass456",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.issues.find((i) => i.path[0] === "confirmPassword");
        expect(confirmError?.message).toContain("Hasła muszą być takie same");
      }
    });

    it("rejects empty confirm password", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: "test@example.com",
        password: "SecurePass123",
        confirmPassword: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.issues.find((i) => i.path[0] === "confirmPassword");
        expect(confirmError?.message).toContain("Potwierdź hasło");
      }
    });

    it("accepts when passwords match exactly", () => {
      const result = signUpFormSchema.safeParse({
        companyName: "Test Company",
        email: "test@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });

      expect(result.success).toBe(true);
    });
  });
});

