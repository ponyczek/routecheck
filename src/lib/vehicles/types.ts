import type { VehicleDTO } from "@/types";

/**
 * Stan filtrów w widoku listy pojazdów
 */
export interface VehiclesFiltersState {
  /** Tekst wyszukiwania (numer rejestracyjny, VIN) */
  q: string;
  /** Filtr aktywności: undefined = wszystkie, true = aktywni, false = nieaktywni */
  isActive?: boolean;
  /** Czy pokazywać usunięte pojazdy (soft delete) */
  includeDeleted: boolean;
  /** Pole sortowania */
  sortBy: "registrationNumber" | "createdAt";
  /** Kierunek sortowania */
  sortDir: "asc" | "desc";
  /** Cursor paginacji (opaque string z API) */
  cursor?: string;
}

/**
 * Domyślne wartości filtrów
 */
export const defaultFilters: VehiclesFiltersState = {
  q: "",
  isActive: undefined,
  includeDeleted: false,
  sortBy: "registrationNumber",
  sortDir: "asc",
};

/**
 * Stan modalu w widoku pojazdów
 */
export type ModalState =
  | { type: null }
  | { type: "add" }
  | { type: "edit"; vehicle: VehicleDTO }
  | { type: "delete"; vehicle: VehicleDTO };

/**
 * Dane formularza dodawania/edycji pojazdu
 */
export interface VehicleFormData {
  registrationNumber: string;
  vin: string | null;
  isActive: boolean;
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
 * Parametry query dla API /api/vehicles
 */
export interface VehiclesQueryParams {
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
  sortBy?: "registrationNumber" | "createdAt";
  /** Kierunek sortowania */
  sortDir?: "asc" | "desc";
}
