import type { CompanyDTO, UserDTO, IsoDateString } from "@/types";

/**
 * ViewModel dla formularza edycji nazwy firmy
 * Używany w React Hook Form z walidacją Zod
 */
export interface EditCompanyNameFormValues {
  name: string;
}

/**
 * Opcje dla hooka useUpdateCompany
 */
export interface UseUpdateCompanyOptions {
  onSuccess?: (company: CompanyDTO) => void;
  onError?: (error: Error) => void;
}

/**
 * Rozszerzony typ błędu API z kodem i szczegółami
 */
export interface CompanyApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

/**
 * Status sesji użytkownika
 */
export type SessionStatus = "active" | "expiring_soon" | "expired";

/**
 * View Model dla sesji użytkownika
 * Rozszerza dane z Supabase Session o dane potrzebne w UI
 */
export interface SessionViewModel {
  /** Status sesji */
  status: SessionStatus;

  /** Data wygaśnięcia sesji (ISO 8601) */
  expiresAt: IsoDateString;

  /** Data ostatniej aktywności użytkownika (ISO 8601) */
  lastActivityAt: IsoDateString;

  /** Pozostały czas do wygaśnięcia w godzinach */
  remainingHours: number;

  /** Adres e-mail powiązany z sesją (z Supabase Auth) */
  email: string;

  /** UUID użytkownika Supabase Auth */
  authUserId: string;
}

/**
 * Props dla AccountSettingsView
 */
export interface AccountSettingsViewProps {
  /** Opcjonalne początkowe dane użytkownika (server-side) */
  initialUser?: UserDTO;

  /** Opcjonalne początkowe dane sesji (server-side) */
  initialSession?: SessionViewModel;
}

/**
 * Props dla SessionInfoCard
 */
export interface SessionInfoCardProps {
  /** Dane sesji do wyświetlenia */
  session: SessionViewModel;

  /** Flaga ładowania */
  isLoading?: boolean;
}

/**
 * Props dla SessionStatusIndicator
 */
export interface SessionStatusIndicatorProps {
  /** Status sesji */
  status: SessionStatus;

  /** Dodatkowe klasy CSS */
  className?: string;
}

/**
 * Props dla SessionExpiryWarning
 */
export interface SessionExpiryWarningProps {
  /** Data wygaśnięcia sesji */
  expiresAt: IsoDateString;

  /** Pozostałe godziny do wygaśnięcia */
  remainingHours?: number;
}

/**
 * Props dla UserInfoCard
 */
export interface UserInfoCardProps {
  /** Dane użytkownika */
  user: UserDTO;

  /** Dane firmy */
  company: CompanyDTO;

  /** Adres e-mail z Supabase Auth */
  email: string;

  /** Flaga ładowania */
  isLoading?: boolean;
}

/**
 * Props dla UserEmailDisplay
 */
export interface UserEmailDisplayProps {
  /** Adres e-mail do wyświetlenia */
  email: string;
}

/**
 * Props dla SecurityTipsCard
 */
export interface SecurityTipsCardProps {
  /** Nazwa firmy dla kontekstu */
  companyName: string;

  /** Dodatkowe klasy CSS */
  className?: string;
}

/**
 * Props dla SecurityTipsList
 */
export interface SecurityTipsListProps {
  // Brak propsów - statyczna zawartość
}

/**
 * Props dla AccountActionsCard
 */
export interface AccountActionsCardProps {
  /** Callback wylogowania */
  onSignOut: () => Promise<void>;

  /** Flaga procesu wylogowania */
  isSigningOut: boolean;
}

/**
 * Props dla LogoutButton
 */
export interface LogoutButtonProps {
  /** Funkcja wylogowania */
  onSignOut: () => Promise<void>;

  /** Flaga stanu wylogowania */
  isLoading: boolean;

  /** Wariant wizualny przycisku */
  variant?: "default" | "destructive";
}
