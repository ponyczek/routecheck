import type { DriversQueryParams } from './types';

/**
 * Query keys dla TanStack Query
 * Zapewnia spójne zarządzanie cache dla zapytań o kierowców
 */
export const driversKeys = {
  /** Bazowy klucz dla wszystkich zapytań o kierowców */
  all: ['drivers'] as const,
  
  /** Klucz dla wszystkich list kierowców */
  lists: () => [...driversKeys.all, 'list'] as const,
  
  /** Klucz dla konkretnej listy kierowców z parametrami filtrowania */
  list: (params: DriversQueryParams) => [...driversKeys.lists(), params] as const,
  
  /** Klucz dla wszystkich szczegółów kierowców */
  details: () => [...driversKeys.all, 'detail'] as const,
  
  /** Klucz dla szczegółów konkretnego kierowcy */
  detail: (uuid: string) => [...driversKeys.details(), uuid] as const,
};



