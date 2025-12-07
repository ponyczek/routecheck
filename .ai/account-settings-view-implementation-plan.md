# Plan implementacji widoku Ustawienia – konto i sesja

## 1. Przegląd

Widok "Ustawienia – konto i sesja" umożliwia spedytorowi zarządzanie swoją sesją Supabase oraz bezpieczeństwem konta. Jest to prosta strona informacyjna z funkcją wylogowania, która wyświetla dane użytkownika, status sesji oraz ostrzeżenia bezpieczeństwa. Widok jest częścią sekcji ustawień aplikacji RouteLog i spełnia wymagania US-002 dotyczące zarządzania sesją użytkownika.

Główne cele widoku:
- Wyświetlenie informacji o aktualnie zalogowanym użytkowniku (e-mail z Supabase Auth)
- Pokazanie statusu sesji i informacji o automatycznym wygasaniu po 24h braku aktywności
- Umożliwienie bezpiecznego wylogowania z aplikacji
- Dostarczenie użytkownikowi wskazówek bezpieczeństwa i informacji o logach audytowych

## 2. Routing widoku

Widok dostępny pod ścieżką: `/settings/account`

Widok jest chroniony przez middleware Astro (zdefiniowane w `src/middleware/index.ts`), które weryfikuje sesję Supabase. Użytkownicy niezalogowani są przekierowywani na `/signin?returnTo=/settings/account&expired=true`.

Widok jest częścią sekcji ustawień wraz z:
- `/settings/profile` - Profil firmy (domyślny widok ustawień)
- `/settings/alerts` - Alerty i telemetria
- `/settings/account` - Konto i sesja (ten widok)

## 3. Struktura komponentów

```
account.astro (Astro page)
└── AuthenticatedLayout
    └── Container
        ├── SettingsNavigationTabs (wspólny dla wszystkich /settings/*)
        └── AccountSettingsViewWithProvider (React island - client:load)
            └── AccountSettingsView (główny komponent widoku)
                ├── SessionInfoCard
                │   ├── SessionStatusIndicator
                │   └── SessionExpiryWarning
                ├── UserInfoCard
                │   └── UserEmailDisplay
                ├── SecurityTipsCard
                │   └── SecurityTipsList
                └── AccountActionsCard
                    └── LogoutButton (z potwierdzeniem)
```

## 4. Szczegóły komponentów

### AccountSettingsViewWithProvider

- **Opis komponentu**: Wrapper dla `AccountSettingsView` dostarczający `QueryClientProvider`. Ten komponent jest niezbędny, gdy widok jest używany jako React island w Astro (client:load), ponieważ tworzy osobne drzewo React wymagające własnego kontekstu React Query.

- **Główne elementy**:
  - `QueryProvider` - dostawca kontekstu React Query
  - `AccountSettingsView` - główny komponent widoku

- **Obsługiwane zdarzenia**: Brak (komponent opakowujący)

- **Warunki walidacji**: Brak

- **Typy**:
  - `AccountSettingsViewProps` (przekazywane do AccountSettingsView)

- **Propsy**:
  - `initialUser?: UserDTO` - opcjonalne dane użytkownika pobrane server-side do optymistycznego renderowania
  - `initialSession?: SessionViewModel` - opcjonalne dane sesji z serwera

### AccountSettingsView

- **Opis komponentu**: Główny komponent widoku ustawień konta. Zarządza stanem sesji użytkownika, wyświetla informacje o koncie oraz umożliwia wylogowanie. Wykorzystuje hook `useAuthContext` do pobierania danych użytkownika i firmy oraz funkcji wylogowania.

- **Główne elementy**:
  - `div.space-y-6` - kontener główny z odstępami
  - Nagłówek strony (`h1`, `p.text-muted-foreground`)
  - `SessionInfoCard` - karta z informacjami o sesji
  - `UserInfoCard` - karta z danymi użytkownika
  - `SecurityTipsCard` - karta z poradami bezpieczeństwa
  - `AccountActionsCard` - karta z akcjami (wylogowanie)

- **Obsługiwane zdarzenia**:
  - Ładowanie danych użytkownika przy montowaniu komponentu
  - Automatyczne odświeżanie danych co 5 minut (przez useAuthContext)
  - Obsługa kliknięcia przycisku wylogowania

- **Warunki walidacji**:
  - Weryfikacja obecności danych użytkownika przed renderowaniem
  - Obsługa stanu ładowania podczas pobierania danych
  - Obsługa błędów przy pobieraniu danych użytkownika

- **Typy**:
  - `AccountSettingsViewProps`
  - `UserDTO` (z `@/types`)
  - `SessionViewModel`
  - `AuthContextValue` (z `@/lib/layout/types`)

- **Propsy**:
  - `initialUser?: UserDTO` - opcjonalne początkowe dane użytkownika do optymistycznego renderowania
  - `initialSession?: SessionViewModel` - opcjonalne początkowe dane sesji

### SessionInfoCard

- **Opis komponentu**: Karta wyświetlająca informacje o aktualnej sesji użytkownika. Pokazuje status sesji (aktywna/nieaktywna), datę wygaśnięcia oraz ostrzeżenie o automatycznym wylogowaniu po 24h braku aktywności. Wykorzystuje komponenty Shadcn/ui: Card, CardHeader, CardContent.

- **Główne elementy**:
  - `Card` - kontener karty
  - `CardHeader` - nagłówek z ikoną `ShieldCheck` i tytułem
  - `CardContent` - treść karty
    - `SessionStatusIndicator` - wskaźnik statusu sesji
    - `SessionExpiryWarning` - ostrzeżenie o wygaśnięciu
    - Informacje o dacie ostatniej aktywności
    - Link do dokumentacji o bezpieczeństwie sesji

- **Obsługiwane zdarzenia**: Brak (komponent prezentacyjny)

- **Warunki walidacji**: Brak

- **Typy**:
  - `SessionInfoCardProps`
  - `SessionViewModel`

- **Propsy**:
  - `session: SessionViewModel` - dane sesji do wyświetlenia
  - `isLoading?: boolean` - flaga ładowania

### SessionStatusIndicator

- **Opis komponentu**: Mały komponent wyświetlający wizualny wskaźnik statusu sesji (aktywna/wygasła). Używa badge'a z odpowiednią kolorystyką i ikoną.

- **Główne elementy**:
  - `Badge` - badge z Shadcn/ui
  - Ikona `Check` lub `X` w zależności od statusu
  - Tekst statusu

- **Obsługiwane zdarzenia**: Brak

- **Warunki walidacji**:
  - Status sesji musi być jednym z: 'active', 'expired', 'inactive'

- **Typy**:
  - `SessionStatusIndicatorProps`
  - `SessionStatus` (union type: 'active' | 'expired' | 'inactive')

- **Propsy**:
  - `status: SessionStatus` - status sesji
  - `className?: string` - dodatkowe klasy CSS

### SessionExpiryWarning

- **Opis komponentu**: Komponent wyświetlający ostrzeżenie o automatycznym wygaśnięciu sesji po 24h braku aktywności. Używa Alert z Shadcn/ui z wariantem "warning".

- **Główne elementy**:
  - `Alert` - komponent alertu z Shadcn/ui
  - `AlertCircle` - ikona ostrzeżenia
  - `AlertTitle` - tytuł alertu
  - `AlertDescription` - opis z informacją o czasie wygaśnięcia

- **Obsługiwane zdarzenia**: Brak

- **Warunki walidacji**: Brak

- **Typy**:
  - `SessionExpiryWarningProps`

- **Propsy**:
  - `expiresAt: IsoDateString` - data wygaśnięcia sesji
  - `remainingHours?: number` - opcjonalnie obliczone pozostałe godziny do wygaśnięcia

### UserInfoCard

- **Opis komponentu**: Karta wyświetlająca podstawowe informacje o zalogowanym użytkowniku. Pokazuje adres e-mail powiązany z kontem Supabase Auth, UUID użytkownika oraz datę utworzenia konta.

- **Główne elementy**:
  - `Card` - kontener karty
  - `CardHeader` - nagłówek z ikoną `User` i tytułem
  - `CardContent` - treść karty
    - `UserEmailDisplay` - wyświetlacz e-mail użytkownika
    - Lista informacyjna (UUID, data utworzenia)
    - Informacja o UUID firmy

- **Obsługiwane zdarzenia**: Brak (komponent prezentacyjny)

- **Warunki walidacji**: Brak

- **Typy**:
  - `UserInfoCardProps`
  - `UserDTO`
  - `CompanyDTO`

- **Propsy**:
  - `user: UserDTO` - dane użytkownika
  - `company: CompanyDTO` - dane firmy użytkownika
  - `email: string` - adres e-mail z Supabase Auth
  - `isLoading?: boolean` - flaga ładowania

### UserEmailDisplay

- **Opis komponentu**: Komponent wyświetlający adres e-mail użytkownika z możliwością kopiowania do schowka. Zawiera przycisk kopiowania i toast potwierdzający skopiowanie.

- **Główne elementy**:
  - `div` - kontener z flex layout
  - `span` - tekst e-mail
  - `Button` - przycisk kopiowania z ikoną `Copy`
  - Toast notification (przez Sonner)

- **Obsługiwane zdarzenia**:
  - `onClick` na przycisku kopiowania - kopiuje e-mail do schowka i pokazuje toast

- **Warunki walidacji**: Brak

- **Typy**:
  - `UserEmailDisplayProps`

- **Propsy**:
  - `email: string` - adres e-mail do wyświetlenia

### SecurityTipsCard

- **Opis komponentu**: Karta z poradami bezpieczeństwa i informacjami o logach audytowych. Edukuje użytkownika o najlepszych praktykach bezpieczeństwa i informuje o monitorowaniu aktywności konta.

- **Główne elementy**:
  - `Card` - kontener karty
  - `CardHeader` - nagłówek z ikoną `Info` i tytułem
  - `CardContent` - treść karty
    - `SecurityTipsList` - lista wskazówek bezpieczeństwa
    - Informacja o logach audytowych
    - Link do dokumentacji bezpieczeństwa

- **Obsługiwane zdarzenia**: Brak (komponent prezentacyjny)

- **Warunki walidacji**: Brak

- **Typy**:
  - `SecurityTipsCardProps`

- **Propsy**:
  - `companyName: string` - nazwa firmy dla kontekstu
  - `className?: string` - dodatkowe klasy CSS

### SecurityTipsList

- **Opis komponentu**: Lista najlepszych praktyk bezpieczeństwa związanych z zarządzaniem sesją i kontem. Formatowana jako punktowana lista z ikonami.

- **Główne elementy**:
  - `ul` - lista nienumerowana
  - Elementy `li` z ikonami `CheckCircle` i tekstem wskazówki

- **Obsługiwane zdarzenia**: Brak

- **Warunki walidacji**: Brak

- **Typy**:
  - `SecurityTipsListProps`

- **Propsy**: Brak (statyczna zawartość)

### AccountActionsCard

- **Opis komponentu**: Karta z akcjami związanymi z kontem, głównie przycisk wylogowania. Może w przyszłości zawierać dodatkowe akcje jak zmiana hasła czy usunięcie konta.

- **Główne elementy**:
  - `Card` - kontener karty
  - `CardHeader` - nagłówek z tytułem
  - `CardContent` - treść karty
    - `LogoutButton` - przycisk wylogowania
    - Opcjonalnie inne akcje w przyszłości

- **Obsługiwane zdarzenia**:
  - Delegowanie zdarzenia wylogowania do rodzica

- **Warunki walidacji**: Brak

- **Typy**:
  - `AccountActionsCardProps`

- **Propsy**:
  - `onSignOut: () => Promise<void>` - callback wylogowania
  - `isSigningOut: boolean` - flaga procesu wylogowania

### LogoutButton

- **Opis komponentu**: Przycisk wylogowania z potwierdzeniem w formie AlertDialog. Zapewnia bezpieczne wylogowanie użytkownika z aplikacji z wymogiem potwierdzenia akcji. Używa komponentów Shadcn/ui: AlertDialog, Button.

- **Główne elementy**:
  - `AlertDialog` - dialog potwierdzenia
  - `AlertDialogTrigger` - przycisk inicjujący
  - `AlertDialogContent` - zawartość dialogu
    - `AlertDialogHeader` - nagłówek z tytułem i opisem
    - `AlertDialogFooter` - stopka z przyciskami
      - `AlertDialogCancel` - przycisk anulowania
      - `AlertDialogAction` - przycisk potwierdzenia

- **Obsługiwane zdarzenia**:
  - `onClick` na AlertDialogAction - wywołuje funkcję wylogowania
  - Automatyczne zamykanie dialogu po anulowaniu
  - Obsługa stanu ładowania podczas wylogowania

- **Warunki walidacji**:
  - Przycisk wylogowania jest wyłączony podczas procesu wylogowania
  - Dialog wymaga jawnego potwierdzenia przed wykonaniem akcji

- **Typy**:
  - `LogoutButtonProps`

- **Propsy**:
  - `onSignOut: () => Promise<void>` - funkcja wylogowania
  - `isLoading: boolean` - flaga stanu wylogowania
  - `variant?: 'default' | 'destructive'` - wariant wizualny przycisku (domyślnie 'destructive')

## 5. Typy

### Typy podstawowe (istniejące w `src/types.ts`)

```typescript
// Z src/types.ts - już zdefiniowane
export type UserDTO = {
  uuid: string;
  companyUuid: string;
  createdAt: string; // ISO 8601
};

export type CompanyDTO = {
  uuid: string;
  name: string;
  createdAt: string; // ISO 8601
};

export type IsoDateString = string;
```

### Nowe typy dla widoku (do utworzenia w `src/lib/settings/types.ts`)

```typescript
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
 * Status sesji użytkownika
 */
export type SessionStatus = 'active' | 'expiring_soon' | 'expired';

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
  variant?: 'default' | 'destructive';
}
```

## 6. Zarządzanie stanem

### Stan globalny (przez useAuthContext)

Widok wykorzystuje istniejący hook `useAuthContext` (z `src/lib/layout/useAuthContext.ts`) do zarządzania danymi użytkownika i firmy:

```typescript
const { user, company, isLoading, error, signOut, refresh } = useAuthContext();
```

Hook `useAuthContext`:
- Pobiera dane użytkownika z `/api/users/me` (wykorzystuje `fetchCurrentUser`)
- Pobiera dane firmy z `/api/companies/me` (wykorzystuje `fetchCurrentCompany`)
- Wykorzystuje TanStack Query z strategią stale-while-revalidate
- Automatycznie odświeża dane co 5 minut
- Przekierowuje na `/signin` przy błędzie 401 (UNAUTHORIZED)
- Dostarcza funkcję `signOut()` do wylogowania

### Stan lokalny komponentów

#### AccountSettingsView

```typescript
const [sessionData, setSessionData] = useState<SessionViewModel | null>(initialSession || null);
const [isSigningOut, setIsSigningOut] = useState(false);
```

- `sessionData` - dane sesji użytkownika (pobierane z Supabase Auth client)
- `isSigningOut` - flaga procesu wylogowania

#### UserEmailDisplay

```typescript
const [isCopied, setIsCopied] = useState(false);
```

- `isCopied` - flaga stanu po skopiowaniu e-mail do schowka

#### LogoutButton

```typescript
const [isDialogOpen, setIsDialogOpen] = useState(false);
```

- `isDialogOpen` - stan otwarcia dialogu potwierdzenia wylogowania

### Custom hook: useSessionData

Należy utworzyć dedykowany hook `useSessionData` w `src/lib/settings/useSessionData.ts` do pobierania i transformacji danych sesji z Supabase Auth:

```typescript
/**
 * Hook do pobierania i transformacji danych sesji użytkownika
 * 
 * @returns SessionViewModel z danymi sesji lub null jeśli brak sesji
 */
export function useSessionData(initialSession?: SessionViewModel): {
  session: SessionViewModel | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [session, setSession] = useState<SessionViewModel | null>(initialSession || null);
  const [isLoading, setIsLoading] = useState(!initialSession);
  const [error, setError] = useState<Error | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { session: supabaseSession }, error: sessionError } = 
        await supabaseBrowserClient.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!supabaseSession) {
        setSession(null);
        return;
      }
      
      // Transform Supabase session to SessionViewModel
      const viewModel = transformSupabaseSession(supabaseSession);
      setSession(viewModel);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (!initialSession) {
      fetchSession();
    }
  }, [fetchSession, initialSession]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  return { session, isLoading, error, refresh };
}
```

### Funkcje pomocnicze transformacji

W pliku `src/lib/settings/sessionTransformers.ts`:

```typescript
import type { Session } from '@supabase/supabase-js';
import type { SessionViewModel, SessionStatus } from './types';

/**
 * Transformuje sesję Supabase do SessionViewModel
 */
export function transformSupabaseSession(session: Session): SessionViewModel {
  const expiresAt = new Date(session.expires_at! * 1000).toISOString();
  const now = new Date();
  const expiresDate = new Date(expiresAt);
  const remainingMs = expiresDate.getTime() - now.getTime();
  const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
  
  // Określ status sesji
  let status: SessionStatus = 'active';
  if (remainingHours === 0) {
    status = 'expired';
  } else if (remainingHours < 2) {
    status = 'expiring_soon';
  }
  
  return {
    status,
    expiresAt,
    lastActivityAt: new Date(session.user.last_sign_in_at || session.user.created_at).toISOString(),
    remainingHours,
    email: session.user.email!,
    authUserId: session.user.id,
  };
}

/**
 * Formatuje datę ISO do czytelnego formatu dla użytkownika polskiego
 */
export function formatSessionDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Zwraca tekst statusu sesji w języku polskim
 */
export function getSessionStatusText(status: SessionStatus): string {
  const statusMap: Record<SessionStatus, string> = {
    active: 'Aktywna',
    expiring_soon: 'Wygasa wkrótce',
    expired: 'Wygasła',
  };
  return statusMap[status];
}

/**
 * Zwraca wariant koloru dla badge statusu sesji
 */
export function getSessionStatusVariant(status: SessionStatus): 'default' | 'destructive' | 'secondary' {
  const variantMap: Record<SessionStatus, 'default' | 'destructive' | 'secondary'> = {
    active: 'default',
    expiring_soon: 'secondary',
    expired: 'destructive',
  };
  return variantMap[status];
}
```

## 7. Integracja API

### Wykorzystywane endpointy

Widok nie wymaga nowych endpointów API. Wykorzystuje istniejące:

#### 1. GET `/api/users/me`

**Cel**: Pobranie danych aktualnie zalogowanego użytkownika.

**Request**:
- Method: GET
- Headers: Cookie (sesja Supabase)

**Response**:
- Status 200: `UserDTO`
  ```typescript
  {
    uuid: string;        // UUID użytkownika w bazie
    companyUuid: string; // UUID firmy użytkownika
    createdAt: string;   // Data utworzenia konta (ISO 8601)
  }
  ```
- Status 401: `ProblemDetail` - brak autoryzacji
- Status 404: `ProblemDetail` - użytkownik nie istnieje w bazie
- Status 500: `ProblemDetail` - błąd serwera

**Wykorzystanie**: Hook `useAuthContext` używa tego endpointu przez funkcję `fetchCurrentUser()` z `src/lib/services/usersService.ts`.

#### 2. GET `/api/companies/me`

**Cel**: Pobranie danych firmy aktualnie zalogowanego użytkownika.

**Request**:
- Method: GET
- Headers: Cookie (sesja Supabase)

**Response**:
- Status 200: `CompanyDTO`
  ```typescript
  {
    uuid: string;      // UUID firmy
    name: string;      // Nazwa firmy
    createdAt: string; // Data utworzenia firmy (ISO 8601)
  }
  ```
- Status 401: `ProblemDetail` - brak autoryzacji
- Status 404: `ProblemDetail` - firma nie istnieje
- Status 500: `ProblemDetail` - błąd serwera

**Wykorzystanie**: Hook `useAuthContext` używa tego endpointu przez funkcję `fetchCurrentCompany()` z `src/lib/services/companiesService.ts`.

#### 3. Supabase Auth - `auth.getSession()`

**Cel**: Pobranie aktualnej sesji użytkownika z Supabase Auth (client-side).

**Request**: Wywołanie metody SDK
```typescript
const { data: { session }, error } = await supabaseBrowserClient.auth.getSession();
```

**Response**:
```typescript
{
  data: {
    session: Session | null
  };
  error: AuthError | null;
}

// Session type (z Supabase)
interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  refresh_token: string;
  user: User;
}
```

**Wykorzystanie**: Hook `useSessionData` używa tej metody do pobrania danych sesji, które następnie transformuje do `SessionViewModel`.

#### 4. Supabase Auth - `auth.signOut()`

**Cel**: Wylogowanie użytkownika i wyczyszczenie sesji.

**Request**: Wywołanie metody SDK
```typescript
const { error } = await supabaseBrowserClient.auth.signOut();
```

**Response**:
```typescript
{
  error: AuthError | null;
}
```

**Wykorzystanie**: 
- Hook `useAuthContext` dostarcza funkcję `signOut()`, która wywołuje `auth.signOut()` i przekierowuje na `/signin`
- `LogoutButton` wywołuje tę funkcję po potwierdzeniu przez użytkownika

### Strategie cache i refetch

**TanStack Query (dla `/api/users/me` i `/api/companies/me`)**:
- `staleTime: 5 * 60 * 1000` (5 minut) - dane uznawane za świeże przez 5 minut
- `refetchInterval: 5 * 60 * 1000` (5 minut) - automatyczne odświeżanie w tle
- `refetchOnWindowFocus: true` - odświeżenie przy powrocie do zakładki
- `refetchOnReconnect: true` - odświeżenie po odzyskaniu połączenia
- `retry: 1` - jedna próba ponowienia przy błędzie

**Supabase Session (local state)**:
- Brak automatycznego odświeżania w widoku ustawień
- Odświeżanie tylko przez manualny refresh lub reload strony
- Supabase automatycznie odświeża tokeny w tle (autoRefreshToken: true)

### Obsługa błędów API

**401 Unauthorized**:
- Hook `useAuthContext` automatycznie przekierowuje na `/signin?returnTo=/settings/account&expired=true&reason=timeout`
- Użytkownik jest informowany o wygaśnięciu sesji

**404 Not Found**:
- Wyświetlenie komunikatu błędu w UI
- Możliwość odświeżenia strony
- Nie powoduje przekierowania (może być przejściowy błąd)

**500 Internal Server Error**:
- Wyświetlenie komunikatu błędu w UI
- Możliwość ponownego pobrania danych
- Logowanie błędu do konsoli

## 8. Interakcje użytkownika

### 1. Przeglądanie informacji o sesji

**Flow**:
1. Użytkownik nawiguje do `/settings/account`
2. Strona ładuje się z danymi server-side (jeśli dostępne)
3. `AccountSettingsView` montuje się i uruchamia hooki
4. `useAuthContext` pobiera dane użytkownika i firmy (jeśli nie w cache)
5. `useSessionData` pobiera dane sesji z Supabase Auth
6. Komponenty wyświetlają dane w kartach

**Rezultat**:
- Użytkownik widzi swój adres e-mail
- Użytkownik widzi status sesji (aktywna/wygasająca/wygasła)
- Użytkownik widzi pozostały czas do wygaśnięcia sesji
- Użytkownik widzi datę ostatniej aktywności

### 2. Przeglądanie informacji o koncie

**Flow**:
1. Użytkownik przegląda kartę `UserInfoCard`
2. Widzi swój UUID, UUID firmy, datę utworzenia konta
3. Może skopiować adres e-mail do schowka klikając przycisk kopiowania

**Rezultat**:
- Użytkownik ma dostęp do swoich danych identyfikacyjnych
- Użytkownik może łatwo skopiować e-mail (np. do zgłoszenia wsparcia)

### 3. Kopiowanie adresu e-mail

**Flow**:
1. Użytkownik klika przycisk kopiowania przy adresie e-mail
2. `navigator.clipboard.writeText(email)` kopiuje e-mail
3. Toast notification pokazuje potwierdzenie "E-mail skopiowany do schowka"
4. Ikona przycisku zmienia się na `Check` na 2 sekundy

**Rezultat**:
- E-mail jest w schowku użytkownika
- Użytkownik otrzymuje wizualne potwierdzenie akcji

### 4. Czytanie porad bezpieczeństwa

**Flow**:
1. Użytkownik przegląda kartę `SecurityTipsCard`
2. Czyta listę porad dotyczących bezpieczeństwa sesji
3. Może kliknąć link do dokumentacji (jeśli dostępny)

**Rezultat**:
- Użytkownik jest edukowany o bezpieczeństwie
- Użytkownik rozumie konsekwencje wygaśnięcia sesji

### 5. Wylogowanie z aplikacji

**Flow**:
1. Użytkownik klika przycisk "Wyloguj" w karcie `AccountActionsCard`
2. Otwiera się `AlertDialog` z pytaniem potwierdzającym
3. Dialog wyświetla:
   - Tytuł: "Czy na pewno chcesz się wylogować?"
   - Opis: "Zostaniesz przekierowany na stronę logowania. Aktualna sesja zostanie zakończona."
4. Użytkownik ma dwie opcje:
   - "Anuluj" - zamyka dialog, nic się nie dzieje
   - "Wyloguj" - rozpoczyna proces wylogowania
5. Po kliknięciu "Wyloguj":
   - Przycisk pokazuje stan ładowania ("Wylogowywanie...")
   - `signOut()` z `useAuthContext` wywołuje `supabaseBrowserClient.auth.signOut()`
   - Sesja jest czyszczona z localStorage i cookies
   - Użytkownik jest przekierowywany na `/signin?reason=signed-out`

**Rezultat**:
- Użytkownik jest bezpiecznie wylogowany
- Sesja jest zakończona
- Użytkownik jest przekierowany na stronę logowania z informacją o powodzie

### 6. Automatyczne przekierowanie przy wygaśnięciu sesji

**Flow**:
1. Sesja użytkownika wygasa (po 24h braku aktywności)
2. `useAuthContext` wykonuje zapytanie do `/api/users/me`
3. API zwraca 401 Unauthorized
4. Hook wykrywa błąd i uruchamia przekierowanie
5. Użytkownik jest przekierowywany na `/signin?returnTo=/settings/account&expired=true&reason=timeout`

**Rezultat**:
- Użytkownik jest poinformowany o wygaśnięciu sesji
- Po ponownym zalogowaniu wraca na stronę ustawień

### 7. Odświeżanie danych

**Flow automatyczny**:
1. Co 5 minut `useAuthContext` automatycznie odświeża dane w tle
2. Dane są aktualizowane bez zakłócania UI (stale-while-revalidate)
3. Użytkownik nie zauważa odświeżania (jeśli nie ma zmian)

**Flow manualny**:
1. Użytkownik może odświeżyć całą stronę (F5)
2. Server-side rendering zapewnia świeże dane przy każdym załadowaniu strony
3. React islands montują się z aktualnymi danymi

**Rezultat**:
- Dane są zawsze aktualne
- Użytkownik nie musi ręcznie odświeżać strony

### 8. Obsługa stanu offline

**Flow**:
1. Użytkownik traci połączenie z internetem
2. TanStack Query wykrywa brak połączenia
3. Wyświetlane są ostatnie dane z cache (jeśli dostępne)
4. Przy próbie wylogowania pojawia się błąd
5. Toast pokazuje komunikat "Brak połączenia z internetem"

**Rezultat**:
- Użytkownik może przeglądać dane (cache)
- Użytkownik jest informowany o braku możliwości wylogowania offline
- Po przywróceniu połączenia dane są automatycznie odświeżane

## 9. Warunki i walidacja

### Warunki dostępu do widoku

**Warunek**: Użytkownik musi być zalogowany (posiadać aktywną sesję Supabase).

**Weryfikacja**: Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję przed renderowaniem strony:
```typescript
const { data: { session }, error: sessionError } = await context.locals.supabase.auth.getSession();

if (sessionError || !session?.user) {
  const returnTo = encodeURIComponent(context.url.pathname);
  return context.redirect(`/signin?returnTo=${returnTo}&expired=true`);
}
```

**Wpływ na UI**: 
- Niezalogowani użytkownicy nie mają dostępu do widoku
- Są automatycznie przekierowywani na stronę logowania
- Po zalogowaniu wracają na stronę ustawień (parametr `returnTo`)

### Warunki wyświetlania stanu sesji

**Warunek 1**: Sesja aktywna (pozostało > 2 godziny).

**Weryfikacja**: 
```typescript
const remainingHours = Math.floor(
  (new Date(session.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)
);
const status = remainingHours > 2 ? 'active' : remainingHours > 0 ? 'expiring_soon' : 'expired';
```

**Wpływ na UI**:
- Badge z zielonym kolorem i tekstem "Aktywna"
- Brak ostrzeżenia o wygaśnięciu
- Normalny stan interfejsu

**Warunek 2**: Sesja wygasająca wkrótce (pozostało ≤ 2 godziny).

**Weryfikacja**: `status === 'expiring_soon'`

**Wpływ na UI**:
- Badge z żółtym/pomarańczowym kolorem i tekstem "Wygasa wkrótce"
- Wyświetlenie ostrzeżenia w `SessionExpiryWarning` z dokładnym czasem
- Alert z ikoną ostrzeżenia i kolorystyką warning

**Warunek 3**: Sesja wygasła (pozostało 0 godzin).

**Weryfikacja**: `status === 'expired'`

**Wpływ na UI**:
- Badge z czerwonym kolorem i tekstem "Wygasła"
- Komunikat o konieczności ponownego zalogowania
- Użytkownik prawdopodobnie zostanie przekierowany przez `useAuthContext` przy następnym zapytaniu API

### Warunki kopiowania e-mail

**Warunek**: Przeglądarka obsługuje Clipboard API.

**Weryfikacja**:
```typescript
if (!navigator.clipboard) {
  toast.error("Kopiowanie nie jest obsługiwane w tej przeglądarce");
  return;
}
```

**Wpływ na UI**:
- Jeśli API jest dostępne: przycisk kopiowania jest aktywny
- Jeśli API nie jest dostępne: pokazuje się toast z błędem
- Alternatywnie: przycisk może być ukryty lub wyłączony

### Warunki potwierdzenia wylogowania

**Warunek**: Użytkownik musi jawnie potwierdzić chęć wylogowania.

**Weryfikacja**: AlertDialog wymaga kliknięcia przycisku "Wyloguj" w dialogu.

**Wpływ na UI**:
- Pierwszy klik otwiera dialog potwierdzenia
- Dopiero drugi klik w dialogu wykonuje akcję
- Kliknięcie "Anuluj" lub poza dialogiem zamyka dialog bez akcji
- Zapobiega przypadkowemu wylogowaniu

### Warunki wyłączenia przycisków

**Warunek 1**: Proces wylogowania w toku.

**Weryfikacja**: `isSigningOut === true`

**Wpływ na UI**:
- Przycisk "Wyloguj" jest wyłączony (`disabled`)
- Tekst przycisku zmienia się na "Wylogowywanie..."
- Pokazywany jest spinner/ikona ładowania
- Dialog nie może być zamknięty podczas procesu

**Warunek 2**: Ładowanie danych użytkownika.

**Weryfikacja**: `isLoading === true` (z `useAuthContext`)

**Wpływ na UI**:
- Szkielety (skeletons) zamiast rzeczywistych danych
- Przyciski mogą być wyłączone lub pokazywać stan ładowania
- Użytkownik wie, że dane są pobierane

### Warunki wyświetlania błędów

**Warunek**: Błąd podczas pobierania danych użytkownika lub sesji.

**Weryfikacja**: 
```typescript
if (error && !user) {
  // Wyświetl komunikat błędu
}
```

**Wpływ na UI**:
- Wyświetlenie karty błędu z komunikatem
- Przycisk "Spróbuj ponownie" do odświeżenia danych
- Możliwość odświeżenia całej strony
- Logowanie szczegółów błędu do konsoli

### Walidacja danych sesji

**Warunek**: Dane sesji muszą być kompletne i poprawne.

**Weryfikacja**: W `transformSupabaseSession`:
```typescript
if (!session.expires_at || !session.user.email) {
  throw new Error('Niepełne dane sesji');
}
```

**Wpływ na UI**:
- Jeśli walidacja przechodzi: normalne wyświetlanie danych
- Jeśli walidacja nie przechodzi: wyświetlenie stanu błędu
- Fallback na bezpieczne wartości domyślne

## 10. Obsługa błędów

### Błędy związane z autoryzacją

#### 401 Unauthorized przy pobieraniu danych użytkownika

**Scenariusz**: Sesja wygasła lub jest nieprawidłowa podczas pobierania `/api/users/me` lub `/api/companies/me`.

**Obsługa**:
1. Hook `useAuthContext` wykrywa błąd UNAUTHORIZED
2. Automatyczne przekierowanie na `/signin?returnTo=/settings/account&expired=true&reason=timeout`
3. Użytkownik zostaje poinformowany o wygaśnięciu sesji na stronie logowania

**Kod**:
```typescript
useEffect(() => {
  const isUnauthorized =
    userQuery.error?.message === "UNAUTHORIZED" || 
    companyQuery.error?.message === "UNAUTHORIZED";

  if (isUnauthorized) {
    const currentPath = window.location.pathname;
    window.location.href = `/signin?returnTo=${encodeURIComponent(currentPath)}&expired=true&reason=timeout`;
  }
}, [userQuery.error, companyQuery.error]);
```

**UI**: Brak widocznego komunikatu w widoku - przekierowanie jest natychmiastowe.

#### Błąd podczas wylogowania

**Scenariusz**: Wywołanie `supabaseBrowserClient.auth.signOut()` kończy się błędem (np. brak połączenia).

**Obsługa**:
1. Złapanie błędu w try-catch w funkcji `signOut`
2. Logowanie błędu do konsoli
3. Mimo błędu, wymuszenie przekierowania na `/signin` (sesja lokalnie jest uznawana za zakończoną)
4. Wyświetlenie toast notification z informacją o błędzie

**Kod**:
```typescript
const signOut = useCallback(async () => {
  try {
    await supabaseBrowserClient.auth.signOut();
    window.location.href = "/signin?reason=signed-out";
  } catch (error) {
    console.error("Sign out error:", error);
    toast.error("Wystąpił błąd podczas wylogowania, ale sesja zostanie zakończona.");
    // Force redirect even if sign out fails
    window.location.href = "/signin?reason=signed-out";
  }
}, []);
```

**UI**: Toast z komunikatem błędu + przekierowanie na stronę logowania.

### Błędy związane z pobieraniem danych

#### 404 Not Found - użytkownik nie istnieje

**Scenariusz**: Użytkownik ma aktywną sesję Supabase Auth, ale nie istnieje w tabeli `users` w bazie danych.

**Obsługa**:
1. Funkcja `fetchCurrentUser` rzuca błąd NOT_FOUND
2. `useAuthContext` ustawia error state
3. Wyświetlenie komunikatu błędu w UI
4. Możliwość odświeżenia danych lub wylogowania

**Kod**:
```typescript
if (error && error.message === 'NOT_FOUND') {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Nie znaleziono użytkownika</AlertTitle>
      <AlertDescription>
        Twoje konto nie zostało prawidłowo utworzone. Skontaktuj się z administratorem.
        <div className="mt-4 flex gap-2">
          <Button onClick={() => refresh()} size="sm">
            Spróbuj ponownie
          </Button>
          <Button onClick={() => signOut()} variant="outline" size="sm">
            Wyloguj
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

**UI**: Alert z komunikatem błędu + przyciski akcji (retry, wyloguj).

#### 500 Internal Server Error

**Scenariusz**: Błąd serwera podczas pobierania danych użytkownika lub firmy.

**Obsługa**:
1. React Query retry mechanizm (1 próba ponowna)
2. Jeśli nadal błąd: wyświetlenie komunikatu w UI
3. Możliwość ręcznego odświeżenia
4. Logowanie szczegółów do konsoli

**Kod**:
```typescript
if (error && error.message !== 'UNAUTHORIZED' && error.message !== 'NOT_FOUND') {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Błąd ładowania danych</AlertTitle>
      <AlertDescription>
        Nie udało się pobrać danych konta. Spróbuj odświeżyć stronę.
        <div className="mt-4">
          <Button onClick={() => window.location.reload()} size="sm">
            Odśwież stronę
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

**UI**: Alert z komunikatem błędu + przycisk odświeżenia strony.

### Błędy związane z sesją

#### Brak danych sesji

**Scenariusz**: `supabaseBrowserClient.auth.getSession()` zwraca `session: null`.

**Obsługa**:
1. Hook `useSessionData` ustawia `session` na null
2. Komponent `SessionInfoCard` wyświetla placeholder
3. Informacja o braku dostępnych danych sesji

**Kod**:
```typescript
if (!session) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacje o sesji</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Nie udało się pobrać informacji o sesji. Możliwe, że nie jesteś zalogowany.
        </p>
      </CardContent>
    </Card>
  );
}
```

**UI**: Karta z komunikatem o braku danych.

#### Błąd podczas pobierania sesji

**Scenariusz**: `supabaseBrowserClient.auth.getSession()` zwraca błąd.

**Obsługa**:
1. Hook `useSessionData` ustawia error state
2. Wyświetlenie komunikatu błędu
3. Możliwość ponowienia próby

**Kod**:
```typescript
if (sessionError) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Błąd sesji</AlertTitle>
      <AlertDescription>
        {sessionError.message || 'Nie udało się pobrać informacji o sesji.'}
        <div className="mt-4">
          <Button onClick={() => refreshSession()} size="sm">
            Spróbuj ponownie
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

**UI**: Alert z szczegółami błędu + przycisk retry.

### Błędy związane z akcjami użytkownika

#### Błąd kopiowania do schowka

**Scenariusz**: `navigator.clipboard.writeText()` kończy się błędem (np. brak uprawnień).

**Obsługa**:
1. Złapanie błędu w try-catch
2. Wyświetlenie toast notification z informacją o błędzie
3. Logowanie błędu do konsoli

**Kod**:
```typescript
const handleCopyEmail = async () => {
  try {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported');
    }
    await navigator.clipboard.writeText(email);
    setIsCopied(true);
    toast.success("E-mail skopiowany do schowka");
    setTimeout(() => setIsCopied(false), 2000);
  } catch (error) {
    console.error('Copy error:', error);
    toast.error("Nie udało się skopiować e-mail. Spróbuj ręcznie.");
  }
};
```

**UI**: Toast z komunikatem błędu.

### Błędy związane ze stanem ładowania

#### Timeout podczas ładowania danych

**Scenariusz**: Zapytania do API trwają zbyt długo (>30s).

**Obsługa**:
1. React Query nie ma built-in timeout, ale możemy dodać własny
2. Po przekroczeniu czasu: wyświetlenie komunikatu
3. Możliwość anulowania i ponowienia

**Kod**:
```typescript
const userQuery = useQuery({
  queryKey: ["user", "me"],
  queryFn: fetchCurrentUser,
  staleTime: 5 * 60 * 1000,
  // Timeout jest obsługiwany przez retry logic
  retry: 1,
  retryDelay: 2000,
  enabled,
});

// W komponencie:
if (userQuery.isLoading && userQuery.fetchStatus === 'fetching') {
  // Pokaż loading indicator
  return <LoadingSpinner />;
}

if (userQuery.isError && userQuery.failureCount > 0) {
  // Timeout lub inne błędy po retry
  return <ErrorState onRetry={() => userQuery.refetch()} />;
}
```

**UI**: Loading spinner → Error state po timeout + możliwość retry.

### Obsługa stanu offline

#### Brak połączenia z internetem

**Scenariusz**: Użytkownik traci połączenie podczas korzystania z widoku.

**Obsługa**:
1. TanStack Query wykrywa brak połączenia (przez `navigator.onLine` i failed requests)
2. Wyświetlenie danych z cache (jeśli dostępne)
3. Banner informujący o braku połączenia
4. Automatyczne odświeżenie po przywróceniu połączenia

**Kod**:
```typescript
// W AccountSettingsView
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// W render:
{!isOnline && (
  <Alert>
    <WifiOff className="h-4 w-4" />
    <AlertTitle>Brak połączenia</AlertTitle>
    <AlertDescription>
      Pracujesz w trybie offline. Dane mogą być nieaktualne.
    </AlertDescription>
  </Alert>
)}
```

**UI**: Banner ostrzegawczy + dane z cache (jeśli dostępne).

#### Próba wylogowania offline

**Scenariusz**: Użytkownik próbuje się wylogować bez połączenia z internetem.

**Obsługa**:
1. Wywołanie `signOut()` kończy się błędem
2. Złapanie błędu i wyświetlenie komunikatu
3. Informacja o konieczności połączenia do wylogowania

**Kod**:
```typescript
const handleSignOut = async () => {
  if (!navigator.onLine) {
    toast.error("Wylogowanie wymaga połączenia z internetem");
    return;
  }
  
  setIsSigningOut(true);
  try {
    await signOut();
  } catch (error) {
    console.error("Sign out error:", error);
    toast.error("Nie udało się wylogować. Sprawdź połączenie z internetem.");
    setIsSigningOut(false);
  }
};
```

**UI**: Toast z komunikatem o braku połączenia.

## 11. Kroki implementacji

### Faza 1: Przygotowanie struktury i typów

#### Krok 1.1: Utworzenie typów dla widoku

**Plik**: `src/lib/settings/types.ts`

**Zadanie**: Zdefiniować wszystkie typy TypeScript potrzebne dla widoku ustawień konta:
- `SessionViewModel` - model widoku dla danych sesji
- `SessionStatus` - typ union dla statusów sesji
- Props interfaces dla wszystkich komponentów

**Weryfikacja**: TypeScript nie zgłasza błędów kompilacji, typy są eksportowane prawidłowo.

#### Krok 1.2: Utworzenie funkcji transformacji sesji

**Plik**: `src/lib/settings/sessionTransformers.ts`

**Zadanie**: Zaimplementować funkcje pomocnicze:
- `transformSupabaseSession()` - transformacja Supabase Session do SessionViewModel
- `formatSessionDate()` - formatowanie daty dla użytkownika polskiego
- `getSessionStatusText()` - tłumaczenie statusu na polski
- `getSessionStatusVariant()` - mapowanie statusu na wariant badge

**Weryfikacja**: Testy jednostkowe (opcjonalnie) lub manualne testy z przykładowymi danymi.

#### Krok 1.3: Utworzenie custom hook useSessionData

**Plik**: `src/lib/settings/useSessionData.ts`

**Zadanie**: Zaimplementować hook do pobierania i zarządzania danymi sesji:
- Pobieranie sesji z `supabaseBrowserClient.auth.getSession()`
- Transformacja do `SessionViewModel`
- Zarządzanie stanem ładowania i błędów
- Funkcja refresh

**Weryfikacja**: Hook poprawnie pobiera dane sesji i transformuje je do view model.

### Faza 2: Implementacja komponentów prezentacyjnych (bottom-up)

#### Krok 2.1: Implementacja SessionStatusIndicator

**Plik**: `src/components/settings/SessionStatusIndicator.tsx`

**Zadanie**: Utworzyć komponent Badge wyświetlający status sesji:
- Wykorzystać komponent `Badge` z Shadcn/ui
- Mapowanie statusu na odpowiedni wariant i ikonę
- Responsywny styling z Tailwind

**Weryfikacja**: Komponent poprawnie wyświetla się we wszystkich stanach (active, expiring_soon, expired).

#### Krok 2.2: Implementacja SessionExpiryWarning

**Plik**: `src/components/settings/SessionExpiryWarning.tsx`

**Zadanie**: Utworzyć komponent Alert z ostrzeżeniem o wygasającej sesji:
- Wykorzystać `Alert` z Shadcn/ui
- Formatowanie czasu wygaśnięcia
- Warunkowe wyświetlanie w zależności od statusu

**Weryfikacja**: Alert wyświetla się poprawnie z odpowiednią kolorystyką i tekstem.

#### Krok 2.3: Implementacja UserEmailDisplay

**Plik**: `src/components/settings/UserEmailDisplay.tsx`

**Zadanie**: Utworzyć komponent wyświetlający e-mail z przyciskiem kopiowania:
- Ikona `Copy` zamieniająca się na `Check` po skopiowaniu
- Obsługa Clipboard API
- Toast notification z Sonner
- Obsługa błędów kopiowania

**Weryfikacja**: Kliknięcie przycisku kopiuje e-mail i pokazuje toast.

#### Krok 2.4: Implementacja SecurityTipsList

**Plik**: `src/components/settings/SecurityTipsList.tsx`

**Zadanie**: Utworzyć komponent z listą porad bezpieczeństwa:
- Statyczna lista wskazówek w języku polskim
- Ikony przy każdej wskazówce
- Responsive styling

**Weryfikacja**: Lista wyświetla się poprawnie z odpowiednim formatowaniem.

### Faza 3: Implementacja komponentów złożonych (karty)

#### Krok 3.1: Implementacja SessionInfoCard

**Plik**: `src/components/settings/SessionInfoCard.tsx`

**Zadanie**: Utworzyć kartę z informacjami o sesji:
- Wykorzystać komponenty `Card`, `CardHeader`, `CardContent` z Shadcn/ui
- Zintegrować `SessionStatusIndicator` i `SessionExpiryWarning`
- Wyświetlić sformatowane daty
- Obsłużyć stan ładowania (skeleton)

**Weryfikacja**: Karta wyświetla kompletne informacje o sesji z odpowiednimi komponentami.

#### Krok 3.2: Implementacja UserInfoCard

**Plik**: `src/components/settings/UserInfoCard.tsx`

**Zadanie**: Utworzyć kartę z danymi użytkownika:
- Struktura Card z Shadcn/ui
- Zintegrować `UserEmailDisplay`
- Wyświetlić UUID użytkownika i firmy
- Wyświetlić datę utworzenia konta
- Obsłużyć stan ładowania

**Weryfikacja**: Karta wyświetla wszystkie dane użytkownika poprawnie.

#### Krok 3.3: Implementacja SecurityTipsCard

**Plik**: `src/components/settings/SecurityTipsCard.tsx`

**Zadanie**: Utworzyć kartę z poradami bezpieczeństwa:
- Struktura Card
- Zintegrować `SecurityTipsList`
- Dodać informacje o logach audytowych
- Link do dokumentacji (jeśli dostępny)

**Weryfikacja**: Karta wyświetla wszystkie porady i informacje.

#### Krok 3.4: Implementacja LogoutButton

**Plik**: `src/components/settings/LogoutButton.tsx`

**Zadanie**: Utworzyć przycisk wylogowania z potwierdzeniem:
- Wykorzystać `AlertDialog` z Shadcn/ui
- Stan ładowania podczas wylogowania
- Obsługa błędów
- Accessibility (focus management)

**Weryfikacja**: Kliknięcie przycisku otwiera dialog, potwierdzenie wywołuje wylogowanie.

#### Krok 3.5: Implementacja AccountActionsCard

**Plik**: `src/components/settings/AccountActionsCard.tsx`

**Zadanie**: Utworzyć kartę z akcjami konta:
- Struktura Card
- Zintegrować `LogoutButton`
- Obsłużyć prop `onSignOut` i `isSigningOut`

**Weryfikacja**: Karta poprawnie deleguje akcje do LogoutButton.

### Faza 4: Implementacja głównego widoku

#### Krok 4.1: Implementacja AccountSettingsView

**Plik**: `src/components/settings/AccountSettingsView.tsx`

**Zadanie**: Utworzyć główny komponent widoku:
- Zintegrować `useAuthContext` dla danych użytkownika
- Zintegrować `useSessionData` dla danych sesji
- Zintegrować wszystkie komponenty kart
- Obsłużyć stany: ładowanie, błędy, brak danych
- Implementacja obsługi wylogowania
- Responsive layout z odpowiednimi odstępami

**Weryfikacja**: Widok kompletnie wyświetla wszystkie sekcje i poprawnie obsługuje stany.

#### Krok 4.2: Implementacja AccountSettingsViewWithProvider

**Plik**: `src/components/settings/AccountSettingsViewWithProvider.tsx`

**Zadanie**: Utworzyć wrapper z QueryProvider:
- Owinąć `AccountSettingsView` w `QueryProvider`
- Przekazać wszystkie propsy
- Eksportować dla użycia w Astro islands

**Weryfikacja**: Komponent poprawnie dostarcza kontekst React Query.

### Faza 5: Integracja z Astro

#### Krok 5.1: Aktualizacja strony account.astro

**Plik**: `src/pages/settings/account.astro`

**Zadanie**: Zaktualizować stronę Astro:
- Usunąć placeholder "coming soon"
- Dodać import `AccountSettingsViewWithProvider`
- Opcjonalnie: server-side fetch danych użytkownika dla optymalizacji
- Dodać React island z `client:load`
- Zachować wspólną nawigację zakładek ustawień

**Weryfikacja**: Strona renderuje się poprawnie z React island.

#### Krok 5.2: Testowanie integracji z AuthenticatedLayout

**Plik**: `src/layouts/AuthenticatedLayout.astro`

**Zadanie**: Zweryfikować integrację:
- Upewnić się, że layout poprawnie chroni stronę
- Sprawdzić, czy breadcrumbs działają poprawnie
- Zweryfikować nawigację między zakładkami ustawień

**Weryfikacja**: Nawigacja działa płynnie, guard przekierowuje niezalogowanych.

### Faza 6: Styling i responsywność

#### Krok 6.1: Responsive design dla mobile

**Zadanie**: Dostosować wszystkie komponenty do widoku mobilnego:
- Karty w układzie single column na małych ekranach
- Odpowiednie padding i margins
- Testowanie na różnych rozmiarach ekranów

**Weryfikacja**: Widok wygląda dobrze na ekranach 320px - 1920px.

#### Krok 6.2: Dark mode

**Zadanie**: Zweryfikować wsparcie dla dark mode:
- Wszystkie kolory używają zmiennych CSS Tailwind
- Badge i alerty mają odpowiednie warianty
- Kontrasty są zgodne z WCAG

**Weryfikacja**: Widok wygląda dobrze w obu trybach (light/dark).

### Faza 7: Accessibility (A11y)

#### Krok 7.1: Testowanie nawigacji klawiaturą

**Zadanie**: Zweryfikować dostępność klawiatury:
- Tab order jest logiczny
- Focus indicators są widoczne
- AlertDialog ma focus trap
- Przyciski są dostępne przez Enter/Space

**Weryfikacja**: Wszystkie interakcje działają bez myszy.

#### Krok 7.2: Screen reader testing

**Zadanie**: Zweryfikować dostępność dla czytników ekranu:
- Wszystkie interaktywne elementy mają odpowiednie labele
- ARIA attributes są poprawnie ustawione
- Alerts mają `aria-live` (jeśli dynamiczne)
- Headings hierarchy jest poprawna

**Weryfikacja**: Widok jest zrozumiały dla użytkowników czytników ekranu.

#### Krok 7.3: Semantic HTML

**Zadanie**: Zweryfikować semantykę:
- Użycie odpowiednich tagów HTML5
- Headings (`h1`, `h2`, `h3`) w logicznej hierarchii
- Lists używają `ul`/`ol` i `li`
- Buttons vs links są użyte prawidłowo

**Weryfikacja**: Struktura HTML jest semantycznie poprawna.

### Faza 8: Obsługa błędów i edge cases

#### Krok 8.1: Implementacja obsługi błędów API

**Zadanie**: Dodać comprehensive error handling:
- Obsługa 401, 404, 500 z odpowiednimi komunikatami
- Retry logic tam, gdzie sensowne
- Fallback UI dla błędów
- Logowanie błędów do konsoli

**Weryfikacja**: Wszystkie scenariusze błędów są obsłużone gracefully.

#### Krok 8.2: Testowanie offline behavior

**Zadanie**: Zweryfikować zachowanie offline:
- Wyświetlanie danych z cache
- Blokowanie akcji wymagających połączenia
- Automatyczne odświeżenie po powrocie online
- Informowanie użytkownika o stanie offline

**Weryfikacja**: Aplikacja działa poprawnie offline i odzyskuje się online.

#### Krok 8.3: Testowanie edge cases

**Zadanie**: Przetestować nietypowe scenariusze:
- Użytkownik bez danych firmy
- Sesja wygasająca podczas korzystania z widoku
- Bardzo długie nazwy/emaile (overflow)
- Błędy Clipboard API

**Weryfikacja**: Wszystkie edge cases są obsłużone bez crashów.

### Faza 9: Testing

#### Krok 9.1: Unit testy (opcjonalne, ale zalecane)

**Zadanie**: Napisać testy jednostkowe dla:
- Funkcje transformacji sesji
- Custom hooks (useSessionData)
- Pure functions (formatowanie, walidacja)

**Framework**: Vitest (już skonfigurowany w projekcie)

**Weryfikacja**: Wszystkie testy przechodzą (`npm run test`).

#### Krok 9.2: Integration testing (opcjonalne)

**Zadanie**: Napisać testy integracyjne dla:
- Flow wylogowania
- Flow kopiowania email
- Interaction z AlertDialog

**Framework**: React Testing Library + Vitest

**Weryfikacja**: Testy integracyjne przechodzą.

#### Krok 9.3: Manual testing checklist

**Zadanie**: Przeprowadzić manualne testy:
- [ ] Strona ładuje się poprawnie
- [ ] Wszystkie dane użytkownika są wyświetlane
- [ ] Status sesji jest poprawny
- [ ] Kopiowanie email działa
- [ ] Wylogowanie działa z potwierdzeniem
- [ ] Anulowanie wylogowania działa
- [ ] Błędy API są obsłużone
- [ ] Responsywność na różnych ekranach
- [ ] Dark mode działa poprawnie
- [ ] Nawigacja klawiaturą działa
- [ ] Przekierowania przy wygaśnięciu sesji działają

**Weryfikacja**: Wszystkie punkty checklist są zaznaczone.

### Faza 10: Dokumentacja i cleanup

#### Krok 10.1: Dodanie komentarzy JSDoc

**Zadanie**: Uzupełnić dokumentację kodu:
- JSDoc dla wszystkich komponentów
- JSDoc dla funkcji pomocniczych
- Przykłady użycia w komentarzach

**Weryfikacja**: Kod jest dobrze udokumentowany.

#### Krok 10.2: Aktualizacja README (jeśli istnieje)

**Zadanie**: Zaktualizować dokumentację projektu:
- Dodać opis widoku ustawień konta
- Zaktualizować listę zaimplementowanych widoków

**Weryfikacja**: README jest aktualne.

#### Krok 10.3: Code review i refactoring

**Zadanie**: Przejrzeć kod i zoptymalizować:
- Usunąć nieużywany kod
- Sprawdzić czy nie ma duplikacji
- Zoptymalizować performance (React.memo gdzie sensowne)
- Sprawdzić linting (ESLint)

**Weryfikacja**: Kod przechodzi lintery bez warnings, jest czysty i zoptymalizowany.

### Faza 11: Deployment readiness

#### Krok 11.1: Build testing

**Zadanie**: Zweryfikować build production:
- Uruchomić `npm run build`
- Sprawdzić czy nie ma błędów TypeScript
- Sprawdzić rozmiar bundle'a
- Przetestować built app lokalnie

**Weryfikacja**: Build przechodzi bez błędów, app działa poprawnie w trybie production.

#### Krok 11.2: Performance check

**Zadanie**: Zweryfikować performance:
- Sprawdzić Lighthouse score
- Sprawdzić Core Web Vitals
- Zoptymalizować lazy loading jeśli potrzebne

**Weryfikacja**: Metrics są w akceptowalnych zakresach (>90 Lighthouse).

#### Krok 11.3: Security review

**Zadanie**: Przejrzeć bezpieczeństwo:
- Upewnić się, że nie ma exposed secrets
- Zweryfikować, że RLS policies chronią dane
- Sprawdzić, że sesje są bezpiecznie zarządzane

**Weryfikacja**: Brak luk bezpieczeństwa, dane są chronione.

---

## Podsumowanie

Po wykonaniu wszystkich kroków widok "Ustawienia – konto i sesja" będzie w pełni funkcjonalny, dostępny, responsywny i bezpieczny. Będzie spełniał wszystkie wymagania z PRD (US-002) oraz guidelines z UI plan.

Kluczowe punkty do zapamiętania:
- Wykorzystać istniejący `useAuthContext` dla danych użytkownika
- Utworzyć dedykowany `useSessionData` dla danych sesji
- Wszystkie komponenty prezentacyjne powinny być reusable
- Accessibility i obsługa błędów są priorytetem
- Testowanie na każdym etapie zapewnia jakość


