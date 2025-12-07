import type { VehiclesQueryParams } from './types';

/**
 * Query keys dla TanStack Query
 * Zapewnia spójne zarządzanie cache dla zapytań o pojazdy
 */
export const vehiclesKeys = {
  /** Bazowy klucz dla wszystkich zapytań o pojazdy */
  all: ['vehicles'] as const,
  
  /** Klucz dla wszystkich list pojazdów */
  lists: () => [...vehiclesKeys.all, 'list'] as const,
  
  /** Klucz dla konkretnej listy pojazdów z parametrami filtrowania */
  list: (params: VehiclesQueryParams) => [...vehiclesKeys.lists(), params] as const,
  
  /** Klucz dla wszystkich szczegółów pojazdów */
  details: () => [...vehiclesKeys.all, 'detail'] as const,
  
  /** Klucz dla szczegółów konkretnego pojazdu */
  detail: (uuid: string) => [...vehiclesKeys.details(), uuid] as const,
};


