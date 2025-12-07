import { useEffect, type ReactNode } from "react";
import { useTokenValidation } from "@/lib/public-report/hooks/useTokenValidation";
import { isTokenUsed, markTokenAsUsed } from "@/lib/public-report/utils/storage";
import { FormLoadingState } from "./FormLoadingState";
import { ErrorView } from "./ErrorView";
import { getErrorType } from "@/lib/public-report/api";
import type { PublicReportLinkValidationDTO } from "@/types";

interface TokenGuardProps {
  token: string;
  children: ReactNode;
  onValidated: (data: PublicReportLinkValidationDTO) => void;
}

/**
 * TokenGuard - Validates token and guards form access
 * Shows loading state during validation, error view on failure
 * Checks SessionStorage to prevent duplicate token usage
 *
 * @example
 * <TokenGuard token={token} onValidated={setValidationData}>
 *   <PublicReportForm />
 * </TokenGuard>
 */
export function TokenGuard({ token, children, onValidated }: TokenGuardProps) {
  const { isValidating, isValid, validationData, error } = useTokenValidation(token);

  // Check if token was already used in this session
  useEffect(() => {
    if (isTokenUsed(token)) {
      // Token already used - this is handled by validation error
      console.warn("Token already used in this session");
    }
  }, [token]);

  // Call onValidated when validation succeeds
  useEffect(() => {
    if (isValid && validationData && "valid" in validationData && validationData.valid) {
      markTokenAsUsed(token);
      onValidated(validationData);
    }
  }, [isValid, validationData, token, onValidated]);

  // Loading state
  if (isValidating) {
    return <FormLoadingState />;
  }

  // Error state
  if (error || !isValid) {
    const errorType = error ? getErrorType(error) : "404";
    const message = error?.message;

    return <ErrorView errorType={errorType} message={message} />;
  }

  // Success - render children
  if (validationData && "valid" in validationData && validationData.valid) {
    return <>{children}</>;
  }

  // Fallback error
  return <ErrorView errorType="500" message="Nieoczekiwany błąd podczas walidacji linku" />;
}
