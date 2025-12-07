import { useState, useEffect } from "react";
import { validateToken } from "../api";
import type { TokenValidationState } from "../validation";
import type { ProblemDetail } from "@/types";

/**
 * Hook to validate a public report link token
 * Runs validation on mount and manages the validation state
 *
 * @param token - The report link token from URL
 * @returns TokenValidationState with validation status and data
 *
 * @example
 * const { isValidating, isValid, validationData, error } = useTokenValidation(token);
 */
export function useTokenValidation(token: string): TokenValidationState {
  const [state, setState] = useState<TokenValidationState>({
    isValidating: true,
    isValid: false,
    validationData: null,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function validate() {
      try {
        const data = await validateToken(token);

        if (isMounted) {
          setState({
            isValidating: false,
            isValid: true,
            validationData: data,
            error: null,
          });
        }
      } catch (err) {
        if (isMounted) {
          setState({
            isValidating: false,
            isValid: false,
            validationData: null,
            error: err as ProblemDetail,
          });
        }
      }
    }

    validate();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return state;
}
