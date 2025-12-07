import type { DriverDTO } from "@/types";

/**
 * Stan filtrów w widoku listy kierowców
 */
export interface DriversFiltersState {
  /** Tekst wyszukiwania (imię, email) */
  q: string;
  /** Filtr aktywności: undefined = wszystkie, true = aktywni, false = nieaktywni */
  isActive?: boolean;
  /** Czy pokazywać usuniętych kierowców (soft delete) */
  includeDeleted: boolean;
  /** Pole sortowania */
  sortBy: "name" | "createdAt";
  /** Kierunek sortowania */
  sortDir: "asc" | "desc";
  /** Cursor paginacji (opaque string z API) */
  cursor?: string;
}

/**
 * Domyślne wartości filtrów
 */
export const defaultFilters: DriversFiltersState = {
  q: "",
  isActive: undefined,
  includeDeleted: false,
  sortBy: "name",
  sortDir: "asc",
};

/**
 * Stan modalu w widoku kierowców
 */
export type ModalState =
  | { type: null }
  | { type: "add" }
  | { type: "edit"; driver: DriverDTO }
  | { type: "delete"; driver: DriverDTO };

/**
 * Dane formularza dodawania/edycji kierowcy
 */
export interface DriverFormData {
  name: string;
  email: string;
  timezone: string;
  isActive: boolean;
}

/**
 * Opcja strefy czasowej dla combobox
 */
export interface TimezoneOption {
  /** Wartość IANA timezone (np. "Europe/Warsaw") */
  value: string;
  /** Label do wyświetlenia (np. "Europe/Warsaw (UTC+01:00)") */
  label: string;
  /** Offset UTC (np. "+01:00") */
  offset: string;
}

/**
 * Stan paginacji cursorowej
 */
export interface PaginationState {
  /** Czy istnieje następna strona */
  hasNext: boolean;
  /** Czy istnieje poprzednia strona */
  hasPrev: boolean;
  /** Aktualny cursor */
  currentCursor?: string;
  /** Następny cursor (z API response) */
  nextCursor?: string;
  /** Stack kursorów poprzednich stron (do nawigacji wstecz) */
  prevCursors: string[];
}

/**
 * Parametry query dla API /api/drivers
 */
export interface DriversQueryParams {
  /** Wyszukiwarka tekstowa */
  q?: string;
  /** Filtr aktywności */
  isActive?: boolean;
  /** Czy zawierać usuniętych */
  includeDeleted?: boolean;
  /** Limit wyników na stronę */
  limit?: number;
  /** Cursor paginacji */
  cursor?: string;
  /** Pole sortowania */
  sortBy?: "name" | "createdAt";
  /** Kierunek sortowania */
  sortDir?: "asc" | "desc";
}
