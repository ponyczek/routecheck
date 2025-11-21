import { useMemo } from "react";
import type { PasswordStrength } from "./types";

interface UsePasswordStrengthReturn {
  strength: PasswordStrength;
  score: number;
  feedback: string;
}

/**
 * Hook for calculating password strength in real-time
 * 
 * Scoring system:
 * - Length (8+ chars): 25 points
 * - Length (12+ chars): 25 points
 * - Lowercase letters: 15 points
 * - Uppercase letters: 15 points
 * - Numbers: 10 points
 * - Special characters: 10 points
 * 
 * Strength levels:
 * - Weak: < 40 points
 * - Medium: 40-69 points
 * - Strong: 70+ points
 */
export function usePasswordStrength(password: string): UsePasswordStrengthReturn {
  return useMemo(() => {
    if (password.length === 0) {
      return { strength: "weak" as PasswordStrength, score: 0, feedback: "" };
    }

    let score = 0;

    // Length scoring
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;

    // Character diversity scoring
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 10;

    let strength: PasswordStrength;
    let feedback: string;

    if (score < 40) {
      strength = "weak";
      feedback = "Słabe";
    } else if (score < 70) {
      strength = "medium";
      feedback = "Średnie";
    } else {
      strength = "strong";
      feedback = "Mocne";
    }

    return { strength, score, feedback };
  }, [password]);
}

