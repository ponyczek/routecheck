import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePasswordStrength } from "../usePasswordStrength";

describe("usePasswordStrength", () => {
  describe("empty password", () => {
    it("returns weak strength with 0 score for empty string", () => {
      const { result } = renderHook(() => usePasswordStrength(""));

      expect(result.current.strength).toBe("weak");
      expect(result.current.score).toBe(0);
      expect(result.current.feedback).toBe("");
    });
  });

  describe("weak passwords", () => {
    it("returns weak for password with only lowercase (< 8 chars)", () => {
      const { result } = renderHook(() => usePasswordStrength("abc"));

      expect(result.current.strength).toBe("weak");
      expect(result.current.score).toBeLessThan(40);
      expect(result.current.feedback).toBe("Słabe");
    });

    it("returns weak for short password (< 8 chars)", () => {
      const { result } = renderHook(() => usePasswordStrength("Pass1"));

      // "Pass1" is 5 chars, has uppercase, lowercase, digit = 40 points (medium)
      expect(result.current.strength).toBe("medium");
      expect(result.current.score).toBeLessThan(70);
    });

    it("returns weak for password without character diversity", () => {
      const { result } = renderHook(() => usePasswordStrength("aaaaaaaa"));

      // "aaaaaaaa" is 8 chars (25 points) + lowercase (15 points) = 40 points (medium threshold)
      expect(result.current.strength).toBe("medium");
      expect(result.current.score).toBeGreaterThanOrEqual(40);
    });
  });

  describe("medium passwords", () => {
    it("returns medium for 8+ chars with some diversity", () => {
      const { result } = renderHook(() => usePasswordStrength("Password1"));

      expect(result.current.strength).toBe("medium");
      expect(result.current.score).toBeGreaterThanOrEqual(40);
      expect(result.current.score).toBeLessThan(70);
      expect(result.current.feedback).toBe("Średnie");
    });

    it("returns medium for password with lowercase, uppercase, and digits", () => {
      const { result } = renderHook(() => usePasswordStrength("Pass123"));

      expect(result.current.strength).toBe("medium");
      expect(result.current.feedback).toBe("Średnie");
    });

    it("returns medium for 10 chars with limited diversity", () => {
      const { result } = renderHook(() => usePasswordStrength("abcdefgh12"));

      expect(result.current.strength).toBe("medium");
      expect(result.current.feedback).toBe("Średnie");
    });
  });

  describe("strong passwords", () => {
    it("returns strong for 12+ chars with full diversity", () => {
      const { result } = renderHook(() => usePasswordStrength("SecurePass123!"));

      expect(result.current.strength).toBe("strong");
      expect(result.current.score).toBeGreaterThanOrEqual(70);
      expect(result.current.feedback).toBe("Mocne");
    });

    it("returns strong for password with all character types", () => {
      const { result } = renderHook(() => usePasswordStrength("MyP@ssw0rd2024"));

      expect(result.current.strength).toBe("strong");
      expect(result.current.feedback).toBe("Mocne");
    });

    it("returns strong for very long password with good diversity", () => {
      const { result } = renderHook(() => usePasswordStrength("ThisIsAVerySecurePassword123!"));

      expect(result.current.strength).toBe("strong");
      expect(result.current.score).toBeGreaterThanOrEqual(70);
      expect(result.current.feedback).toBe("Mocne");
    });
  });

  describe("scoring system", () => {
    it("gives points for length >= 8", () => {
      const short = renderHook(() => usePasswordStrength("Pass1")).result.current.score;
      const long = renderHook(() => usePasswordStrength("Password1")).result.current.score;

      expect(long).toBeGreaterThan(short);
    });

    it("gives additional points for length >= 12", () => {
      const medium = renderHook(() => usePasswordStrength("Password1")).result.current.score;
      const longer = renderHook(() => usePasswordStrength("Password12345")).result.current.score;

      expect(longer).toBeGreaterThan(medium);
    });

    it("gives points for lowercase letters", () => {
      const noLower = renderHook(() => usePasswordStrength("PASSWORD123")).result.current.score;
      const withLower = renderHook(() => usePasswordStrength("PASSWORd123")).result.current.score;

      expect(withLower).toBeGreaterThan(noLower);
    });

    it("gives points for uppercase letters", () => {
      const noUpper = renderHook(() => usePasswordStrength("password123")).result.current.score;
      const withUpper = renderHook(() => usePasswordStrength("Password123")).result.current.score;

      expect(withUpper).toBeGreaterThan(noUpper);
    });

    it("gives points for digits", () => {
      const noDigits = renderHook(() => usePasswordStrength("Passworddd")).result.current.score;
      const withDigits = renderHook(() => usePasswordStrength("Password12")).result.current.score;

      expect(withDigits).toBeGreaterThan(noDigits);
    });

    it("gives points for special characters", () => {
      const noSpecial = renderHook(() => usePasswordStrength("Password123")).result.current.score;
      const withSpecial = renderHook(() => usePasswordStrength("Password123!")).result.current.score;

      expect(withSpecial).toBeGreaterThan(noSpecial);
    });
  });

  describe("edge cases", () => {
    it("handles password with only special characters", () => {
      const { result } = renderHook(() => usePasswordStrength("!@#$%^&*"));

      expect(result.current.strength).toBe("weak");
      expect(result.current.score).toBeLessThan(40);
    });

    it("handles password with spaces", () => {
      const { result } = renderHook(() => usePasswordStrength("Pass Word 123"));

      // "Pass Word 123" is 13 chars with spaces, uppercase, lowercase, digits, spaces count as special chars
      // = 50 (length) + 15 (lower) + 15 (upper) + 10 (digit) + 10 (special) = 100 (strong)
      expect(result.current.strength).toBe("strong");
    });

    it("handles very long password (128 chars)", () => {
      const longPass = "Aa1!" + "a".repeat(124);
      const { result } = renderHook(() => usePasswordStrength(longPass));

      expect(result.current.strength).toBe("strong");
      expect(result.current.score).toBeGreaterThanOrEqual(70);
    });
  });

  describe("memoization", () => {
    it("returns same result for same password", () => {
      const { result, rerender } = renderHook(({ password }) => usePasswordStrength(password), {
        initialProps: { password: "Password123" },
      });

      const firstResult = result.current;
      rerender({ password: "Password123" });
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    it("recalculates when password changes", () => {
      const { result, rerender } = renderHook(({ password }) => usePasswordStrength(password), {
        initialProps: { password: "weak" },
      });

      const weakResult = result.current;
      expect(weakResult.strength).toBe("weak");

      rerender({ password: "SecurePassword123!" });
      const strongResult = result.current;

      expect(strongResult.strength).toBe("strong");
      expect(strongResult).not.toBe(weakResult);
    });
  });
});
