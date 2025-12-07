import type { AssignmentDTO, DriverDTO, VehicleDTO, IsoDateOnlyString, Uuid } from "@/types";

/**
 * ViewModel dla przypisania z dodatkowymi polami do prezentacji
 */
export interface AssignmentViewModel {
  /** Oryginalne dane z API */
  assignment: AssignmentDTO;

  /** Nazwa kierowcy (z join do drivers) */
  driverName: string;

  /** Numer rejestracyjny pojazdu (z join do vehicles) */
  vehicleRegistration: string;

  /** Czy przypisanie jest aktywne na dzisiejszą datę */
  isActive: boolean;

  /** Status przypisania dla badge */
  status: "active" | "completed" | "upcoming";

  /** Liczba dni do zakończenia (null jeśli endDate jest null lub przeszłe) */
  daysRemaining: number | null;
}

/**
 * Stan filtrów listy przypisań
 */
export interface AssignmentFilters {
  /** UUID kierowcy - filtrowanie po kierowcy */
  driverUuid?: string;

  /** UUID pojazdu - filtrowanie po pojeździe */
  vehicleUuid?: string;

  /** Data aktywności - pokaż tylko przypisania aktywne na tę datę */
  activeOn?: IsoDateOnlyString; // "YYYY-MM-DD"

  /** Pole sortowania */
  sortBy?: "startDate" | "endDate" | "createdAt";

  /** Kierunek sortowania */
  sortDir?: "asc" | "desc";

  /** Limit wyników (dla paginacji) */
  limit?: number;

  /** Kursor dla paginacji */
  cursor?: string;
}

/**
 * Dane formularza przypisania (wewnętrzna reprezentacja)
 */
export interface AssignmentFormData {
  driverUuid: string;
  vehicleUuid: string;
  startDate: string; // YYYY-MM-DD, będzie przekonwertowane do IsoDateOnlyString
  endDate: string; // YYYY-MM-DD or empty string (null w API)
}

/**
 * Błąd konfliktu przypisań (409 response)
 */
export interface AssignmentConflictError {
  code: string; // np. "ASSIGNMENT_OVERLAP"
  message: string; // komunikat dla użytkownika
  details?: {
    conflictingAssignment?: {
      uuid: string;
      driverName?: string;
      vehicleRegistration?: string;
      startDate: string;
      endDate: string | null;
    };
  };
}

/**
 * Parametry URL dla widoku przypisań (synchronizacja z query params)
 */
export interface AssignmentsSearchParams {
  driverUuid?: string;
  vehicleUuid?: string;
  activeOn?: string;
  sortBy?: string;
  sortDir?: string;
  view?: "table" | "timeline";
}
