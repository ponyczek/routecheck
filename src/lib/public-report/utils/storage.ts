import type { Uuid } from '@/types';

/**
 * Storage keys for SessionStorage
 */
const STORAGE_KEYS = {
  token: (token: string) => `routelog:token:${token}`,
  report: (reportUuid: Uuid) => `routelog:report:${reportUuid}`,
} as const;

/**
 * Checks if a token has been used in the current session
 * @param token - The report link token
 * @returns True if token was already used
 */
export function isTokenUsed(token: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const key = STORAGE_KEYS.token(token);
  return sessionStorage.getItem(key) !== null;
}

/**
 * Marks a token as used in the current session
 * @param token - The report link token
 */
export function markTokenAsUsed(token: string): void {
  if (typeof window === 'undefined') return;
  
  const key = STORAGE_KEYS.token(token);
  sessionStorage.setItem(key, new Date().toISOString());
}

/**
 * Stores the association between a report UUID and its token
 * Used for edit functionality
 * @param reportUuid - UUID of the created report
 * @param token - The original report link token
 */
export function storeReportToken(reportUuid: Uuid, token: string): void {
  if (typeof window === 'undefined') return;
  
  const key = STORAGE_KEYS.report(reportUuid);
  sessionStorage.setItem(key, token);
}

/**
 * Retrieves the token associated with a report UUID
 * @param reportUuid - UUID of the report
 * @returns Token if found, null otherwise
 */
export function getReportToken(reportUuid: Uuid): string | null {
  if (typeof window === 'undefined') return null;
  
  const key = STORAGE_KEYS.report(reportUuid);
  return sessionStorage.getItem(key);
}

/**
 * Clears all report-related data from SessionStorage
 */
export function clearReportStorage(): void {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith('routelog:')) {
      sessionStorage.removeItem(key);
    }
  });
}


