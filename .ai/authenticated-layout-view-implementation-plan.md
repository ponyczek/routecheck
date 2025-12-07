# Plan implementacji widoku AuthenticatedLayout

## 1. Przegląd

AuthenticatedLayout to główny shell aplikacji, który otacza wszystkie chronione widoki panelu spedytora (Dashboard, Kierowcy, Raporty, Ustawienia). Jego głównym celem jest zapewnienie spójnego layoutu, guardu uwierzytelnienia, kontekstu użytkownika i firmy oraz nawigacji. Layout automatycznie przekierowuje niezalogowanych użytkowników na stronę logowania i przechowuje żądany URL dla powrotu po zalogowaniu.

## 2. Routing widoku

AuthenticatedLayout nie jest samodzielną stroną, lecz komponentem layoutu wykorzystywanym przez chronione strony:

- `/dashboard` - Dashboard „Dzisiaj"
- `/drivers` - Lista kierowców
- `/reports` - Historia raportów
- `/settings` - Ustawienia (z podstronami: `/settings/profile`, `/settings/alerts`, `/settings/account`)
- Przyszłe moduły flagowane: `/vehicles`, `/assignments`

Layout zostanie zaimplementowany jako komponent Astro w `src/layouts/AuthenticatedLayout.astro`.

## 3. Struktura komponentów

```
AuthenticatedLayout (Astro)
├── ErrorBoundary (React)
│   └── LayoutContent (React)
│       ├── DesktopSidebar (React)
│       │   ├── Logo
│       │   ├── MainNavigation
│       │   │   └── NavItem (x4: Dashboard, Kierowcy, Raporty, Ustawienia)
│       │   ├── FeaturedModulesSection (flagowane)
│       │   └── UserMenu
│       ├── MobileLayout (React)
│       │   ├── TopBar
│       │   │   ├── Logo
│       │   │   ├── PageTitle
│       │   │   └── HamburgerButton
│       │   ├── MobileSheet (Shadcn Sheet)
│       │   │   ├── MainNavigation
│       │   │   └── UserMenu
│       │   └── BottomNavigation
│       │       └── NavItem (x4: Dashboard, Kierowcy, Raporty, Więcej)
│       ├── NetworkIndicator (React)
│       ├── Breadcrumbs (React)
│       ├── ContentSlot
│       │   └── {children}
│       └── OfflineFallback (React - conditional)
└── Toaster (Sonner)
```

## 4. Szczegóły komponentów

### AuthenticatedLayout (src/layouts/AuthenticatedLayout.astro)

- **Opis**: Główny layout Astro, który wykonuje server-side guard i dostarcza shell HTML. Sprawdza sesję Supabase po stronie serwera i przekierowuje na `/signin` z parametrem `returnTo` jeśli brak sesji.
- **Główne elementy**:
  - Server-side sprawdzenie sesji Supabase (`context.locals.supabase.auth.getSession()`)
  - Przekierowanie na `/signin?returnTo={currentPath}&expired=true` przy braku sesji
  - Slot dla zawartości strony
  - Osadzenie komponentu `LayoutContent` jako React island
  - Globalne style i Toaster dla powiadomień
- **Obsługiwane zdarzenia**: brak (komponent Astro)
- **Warunki walidacji**:
  - Sprawdzenie czy `session?.user` istnieje
  - Jeśli nie - wykonanie redirect 302
- **Typy**:
  - `Session` z `@supabase/supabase-js`
  - `SupabaseClient` z `src/db/supabase.client.ts`
- **Propsy**:
  - `title?: string` - tytuł strony dla `<head>`
  - `description?: string` - opis dla meta tags
  - Slot dla zawartości (children)

### ErrorBoundary (src/components/layout/ErrorBoundary.tsx)

- **Opis**: React Error Boundary, który przechwytuje błędy renderowania w drzewie komponentów i wyświetla fallback UI z opcją odświeżenia.
- **Główne elementy**:
  - `componentDidCatch` lifecycle method
  - Fallback UI z komunikatem błędu
  - Przycisk „Odśwież stronę"
  - Przycisk „Wróć do Dashboard"
- **Obsługiwane zdarzenia**:
  - `onRetry` - odświeżenie strony (`window.location.reload()`)
  - `onGoToDashboard` - przekierowanie na `/dashboard`
- **Warunki walidacji**: brak
- **Typy**:
  - State: `{ hasError: boolean; error: Error | null }`
  - Props: `{ children: React.ReactNode; fallback?: React.ReactNode }`
- **Propsy**:
  - `children: React.ReactNode` - komponenty potomne
  - `fallback?: React.ReactNode` - opcjonalny custom fallback

### LayoutContent (src/components/layout/LayoutContent.tsx)

- **Opis**: Główny kontener layoutu, który zarządza stanem użytkownika i firmy oraz renderuje odpowiedni layout dla desktop/mobile.
- **Główne elementy**:
  - Hook `useAuthContext` do pobierania danych użytkownika i firmy
  - Conditional rendering: Desktop Sidebar + Content albo Mobile Layout
  - NetworkIndicator
  - Toaster
- **Obsługiwane zdarzenia**:
  - Automatyczne przekierowanie przy błędzie 401 z API
  - Obsługa offline/online state
- **Warunki walidacji**:
  - Sprawdzenie czy dane użytkownika i firmy zostały załadowane
  - Wyświetlenie skeleton loadera podczas ładowania
- **Typy**:
  - `AuthContextValue` (z custom hook)
  - `UserDTO`, `CompanyDTO` z `src/types.ts`
- **Propsy**:
  - `children: React.ReactNode` - zawartość strony
  - `supabaseUrl: string` - URL Supabase
  - `supabaseKey: string` - klucz publiczny Supabase

### DesktopSidebar (src/components/layout/DesktopSidebar.tsx)

- **Opis**: Stały sidebar dla widoku desktop, zawierający logo, nawigację główną i menu użytkownika.
- **Główne elementy**:
  - `<aside>` element z fixed position
  - Logo RouteCheck (link do `/dashboard`)
  - Lista linków nawigacyjnych z ikonami
  - Sekcja flagowanych modułów z badge "Wkrótce"
  - UserMenu na dole sidebara
  - NetworkIndicator
- **Obsługiwane zdarzenia**:
  - Click na link - nawigacja (natywna)
  - Keyboard navigation (Tab, Enter, Arrows)
  - Focus management
- **Warunki walidacji**:
  - Podświetlenie aktywnego linku na podstawie `window.location.pathname`
  - Ukrycie sekcji flagowanych modułów jeśli brak flag
- **Typy**:
  - `NavItem: { label: string; href: string; icon: React.ReactNode; isActive: boolean; isFlagged?: boolean }`
  - `CompanyDTO` dla nazwy firmy
- **Propsy**:
  - `companyName: string` - nazwa firmy
  - `activeRoute: string` - aktualny route

### MainNavigation (src/components/layout/MainNavigation.tsx)

- **Opis**: Lista linków nawigacyjnych z ikonami i wskaźnikiem aktywnej strony.
- **Główne elementy**:
  - `<nav>` z `role="navigation"` i `aria-label="Główna nawigacja"`
  - Lista `<ul>` z elementami `<li>`
  - Każdy NavItem to `<a>` z ikoną i tekstem
  - Aktywny link ma specjalne style i `aria-current="page"`
- **Obsługiwane zdarzenia**:
  - Click na link - natywna nawigacja
  - Keyboard navigation
- **Warunki walidacji**:
  - Określenie aktywnego linku na podstawie pathname
  - Dla `/settings/*` - aktywny jeśli pathname startsWith `/settings`
- **Typy**:
  - `NavItem[]` - tablica elementów nawigacji
- **Propsy**:
  - `items: NavItem[]` - elementy nawigacji
  - `activeRoute: string` - aktualny route
  - `orientation?: "vertical" | "horizontal"` - orientacja (vertical dla sidebar, horizontal dla mobile)

### UserMenu (src/components/layout/UserMenu.tsx)

- **Opis**: Dropdown menu z danymi użytkownika i akcjami (ustawienia, wylogowanie).
- **Główne elementy**:
  - Shadcn DropdownMenu
  - Trigger: avatar + nazwa firmy (desktop) lub avatar + email (mobile)
  - Menu items:
    - Nazwa firmy (disabled item)
    - Separator
    - Link "Ustawienia" → `/settings/profile`
    - Link "Ustawienia konta" → `/settings/account`
    - Separator
    - Button "Wyloguj" z ikoną
- **Obsługiwane zdarzenia**:
  - Click "Wyloguj" - wywołanie `handleSignOut`
  - Click na linki - natywna nawigacja
- **Warunki walidacji**:
  - Sprawdzenie czy użytkownik jest zalogowany przed wyświetleniem
  - Pokazanie spinner podczas wylogowywania
- **Typy**:
  - `UserDTO` - dane użytkownika
  - `CompanyDTO` - dane firmy
- **Propsy**:
  - `user: UserDTO` - dane użytkownika
  - `company: CompanyDTO` - dane firmy
  - `onSignOut: () => Promise<void>` - callback wylogowania

### MobileLayout (src/components/layout/MobileLayout.tsx)

- **Opis**: Layout dla urządzeń mobilnych z top bar, hamburger menu i bottom navigation.
- **Główne elementy**:
  - TopBar z logo, tytułem strony i hamburgerem
  - Shadcn Sheet (wysuwa się z lewej) z MainNavigation i UserMenu
  - Content area
  - BottomNavigation z 4 ikonami
- **Obsługiwane zdarzenia**:
  - Toggle Sheet - otwarcie/zamknięcie menu
  - Click na nav item w bottom navigation
  - Keyboard trap w otwartym Sheet
- **Warunki walidacji**:
  - Wyświetlenie tylko na widoku mobile (CSS: `@media (max-width: 768px)`)
  - Auto-close Sheet po kliknięciu w link
- **Typy**:
  - `MobileLayoutProps: { children: React.ReactNode; pageTitle: string; activeRoute: string }`
- **Propsy**:
  - `children: React.ReactNode` - zawartość strony
  - `pageTitle: string` - tytuł aktualnej strony
  - `activeRoute: string` - aktywny route
  - `companyName: string` - nazwa firmy
  - `user: UserDTO` - dane użytkownika
  - `company: CompanyDTO` - dane firmy

### TopBar (src/components/layout/TopBar.tsx)

- **Opis**: Górny pasek dla mobile z logo, tytułem i hamburgerem.
- **Główne elementy**:
  - `<header>` sticky na górze
  - Logo (link do dashboard)
  - Tytuł strony (h1)
  - HamburgerButton
  - NetworkIndicator
- **Obsługiwane zdarzenia**:
  - Click na hamburger - toggle Sheet
- **Warunki walidacji**: brak
- **Typy**:
  - `TopBarProps: { pageTitle: string; onMenuToggle: () => void; isMenuOpen: boolean }`
- **Propsy**:
  - `pageTitle: string` - tytuł strony
  - `onMenuToggle: () => void` - callback toggle menu
  - `isMenuOpen: boolean` - stan menu

### BottomNavigation (src/components/layout/BottomNavigation.tsx)

- **Opis**: Dolna nawigacja dla mobile z 4 głównymi sekcjami.
- **Główne elementy**:
  - `<nav>` fixed na dole ekranu
  - 4 linki: Dashboard, Kierowcy, Raporty, Więcej
  - Każdy link z ikoną i labelem
  - Aktywny link podświetlony
- **Obsługiwane zdarzenia**:
  - Click na link - natywna nawigacja
  - Click "Więcej" - otwarcie Sheet z dodatkowymi opcjami
- **Warunki walidacji**:
  - Aktywny link na podstawie pathname
- **Typy**:
  - `BottomNavItem: { label: string; href: string; icon: React.ReactNode; isActive: boolean }`
- **Propsy**:
  - `activeRoute: string` - aktywny route
  - `onMoreClick: () => void` - callback dla "Więcej"

### NetworkIndicator (src/components/layout/NetworkIndicator.tsx)

- **Opis**: Wskaźnik stanu połączenia sieciowego (online/offline).
- **Główne elementy**:
  - Badge z ikoną i tekstem
  - Stan online: zielony, ikona check
  - Stan offline: czerwony, ikona alert
  - Toast przy zmianie stanu
- **Obsługiwane zdarzenia**:
  - Nasłuchiwanie na `online` i `offline` events z `window`
  - Update stanu przy zmianie połączenia
- **Warunki walidacji**:
  - Sprawdzenie `navigator.onLine` przy mount
  - Pokazanie toastu tylko przy zmianie stanu
- **Typy**:
  - State: `{ isOnline: boolean }`
- **Propsy**: brak (standalone component)

### Breadcrumbs (src/components/layout/Breadcrumbs.tsx)

- **Opis**: Ścieżka nawigacyjna pokazująca hierarchię stron.
- **Główne elementy**:
  - `<nav>` z `aria-label="Breadcrumb"`
  - Lista crumbs: Home → Parent → Current
  - Separator między crumbs (/)
  - Ostatni element bez linku (aria-current="page")
- **Obsługiwane zdarzenia**:
  - Click na crumb - natywna nawigacja
- **Warunki walidacji**:
  - Generowanie crumbs na podstawie pathname
  - Mapowanie pathname do czytelnych nazw (np. `/drivers` → "Kierowcy")
- **Typy**:
  - `Crumb: { label: string; href: string; isCurrent: boolean }`
- **Propsy**:
  - `pathname: string` - aktualny pathname

### OfflineFallback (src/components/layout/OfflineFallback.tsx)

- **Opis**: Banner wyświetlany gdy aplikacja jest offline.
- **Główne elementy**:
  - Alert z ikoną offline
  - Komunikat "Brak połączenia z internetem"
  - Informacja o ograniczonej funkcjonalności
  - Przycisk "Spróbuj ponownie"
- **Obsługiwane zdarzenia**:
  - Click "Spróbuj ponownie" - check połączenia i próba ponownego pobrania danych
- **Warunki walidacji**:
  - Wyświetlenie tylko gdy `isOnline === false`
- **Typy**:
  - Props: `{ onRetry: () => void }`
- **Propsy**:
  - `onRetry: () => void` - callback retry

## 5. Typy

### DTO z src/types.ts (już zdefiniowane)

```typescript
// Używane bezpośrednio z types.ts
export type UserDTO = PickCamel<Tables<"users">, "uuid" | "company_uuid" | "created_at">;
export type CompanyDTO = PickCamel<Tables<"companies">, "uuid" | "name" | "created_at">;
```

### Nowe typy dla AuthenticatedLayout

Nowy plik: `src/lib/layout/types.ts`

```typescript
import type { UserDTO, CompanyDTO } from "@/types";

/**
 * Navigation item for sidebar and mobile navigation
 */
export interface NavItem {
  /** Unique identifier for the nav item */
  id: string;
  /** Display label */
  label: string;
  /** Navigation href */
  href: string;
  /** Icon component (React element) */
  icon: React.ReactNode;
  /** Whether this item is currently active */
  isActive: boolean;
  /** Whether this is a flagged/upcoming feature */
  isFlagged?: boolean;
  /** Badge text for flagged items */
  badgeText?: string;
}

/**
 * Auth context value providing user and company data
 */
export interface AuthContextValue {
  /** Current authenticated user */
  user: UserDTO | null;
  /** User's company */
  company: CompanyDTO | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Sign out function */
  signOut: () => Promise<void>;
  /** Refresh user data */
  refresh: () => Promise<void>;
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  /** Page title for breadcrumbs and mobile top bar */
  pageTitle: string;
  /** Show breadcrumbs */
  showBreadcrumbs?: boolean;
  /** Custom breadcrumbs */
  breadcrumbs?: Crumb[];
}

/**
 * Breadcrumb item
 */
export interface Crumb {
  /** Display label */
  label: string;
  /** Navigation href */
  href: string;
  /** Whether this is the current page */
  isCurrent: boolean;
}

/**
 * Network status
 */
export type NetworkStatus = "online" | "offline" | "slow";

/**
 * Mobile sheet state
 */
export interface MobileMenuState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
}
```

### ViewModel types

```typescript
/**
 * Processed navigation items with active state computed
 */
export interface ProcessedNavItems {
  main: NavItem[];
  flagged: NavItem[];
}

/**
 * Current route info for layout decisions
 */
export interface RouteInfo {
  pathname: string;
  pageTitle: string;
  breadcrumbs: Crumb[];
  parentRoute?: string;
}
```

## 6. Zarządzanie stanem

### Custom hooks

#### useAuthContext (src/lib/layout/useAuthContext.ts)

Hook zarządzający kontekstem uwierzytelnienia, który:

- Pobiera dane użytkownika z `/api/users/me`
- Pobiera dane firmy z `/api/companies/me`
- Używa TanStack Query z `stale-while-revalidate`
- Automatycznie przekierowuje na `/signin` przy błędzie 401
- Udostępnia funkcję `signOut` wywołującą Supabase `signOut()`
- Refetch co 5 minut w tle (dla świeżości danych)

```typescript
interface UseAuthContextOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

function useAuthContext(options?: UseAuthContextOptions): AuthContextValue {
  // Implementacja z TanStack Query
  const userQuery = useQuery({
    queryKey: ["user", "me"],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000, // 5 min
    refetchInterval: options?.refetchInterval ?? 5 * 60 * 1000,
  });

  const companyQuery = useQuery({
    queryKey: ["company", "me"],
    queryFn: fetchCompany,
    enabled: !!userQuery.data,
    staleTime: 5 * 60 * 1000,
  });

  // Auto redirect on 401
  useEffect(() => {
    if (userQuery.error?.status === 401) {
      window.location.href = `/signin?returnTo=${encodeURIComponent(window.location.pathname)}`;
    }
  }, [userQuery.error]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/signin?reason=signed-out";
  }, []);

  return {
    user: userQuery.data ?? null,
    company: companyQuery.data ?? null,
    isLoading: userQuery.isLoading || companyQuery.isLoading,
    error: userQuery.error ?? companyQuery.error ?? null,
    signOut,
    refresh: () => Promise.all([userQuery.refetch(), companyQuery.refetch()]),
  };
}
```

#### useNetworkStatus (src/lib/layout/useNetworkStatus.ts)

Hook monitorujący stan połączenia sieciowego:

- Nasłuchuje `online` i `offline` events
- Wykrywa wolne połączenie (opcjonalnie, przez navigator.connection)
- Pokazuje toast przy zmianie stanu
- Zwraca `{ isOnline: boolean; status: NetworkStatus }`

```typescript
function useNetworkStatus(): { isOnline: boolean; status: NetworkStatus } {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [status, setStatus] = useState<NetworkStatus>("online");

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus("online");
      toast.success("Połączenie przywrócone");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus("offline");
      toast.error("Brak połączenia z internetem");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, status };
}
```

#### useActiveRoute (src/lib/layout/useActiveRoute.ts)

Hook określający aktywny route i generujący informacje o stronie:

- Parsuje `window.location.pathname`
- Mapuje pathname do tytułu strony
- Generuje breadcrumbs
- Zwraca `RouteInfo`

```typescript
function useActiveRoute(): RouteInfo {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    // Update on popstate (back/forward)
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const routeInfo = useMemo(() => {
    return parseRouteInfo(pathname);
  }, [pathname]);

  return routeInfo;
}

function parseRouteInfo(pathname: string): RouteInfo {
  // Mapping logic
  const routeMap: Record<string, { title: string; parent?: string }> = {
    "/dashboard": { title: "Dashboard" },
    "/drivers": { title: "Kierowcy" },
    "/reports": { title: "Raporty" },
    "/settings": { title: "Ustawienia" },
    "/settings/profile": { title: "Profil firmy", parent: "/settings" },
    "/settings/alerts": { title: "Alerty", parent: "/settings" },
    "/settings/account": { title: "Konto", parent: "/settings" },
  };

  const route = routeMap[pathname] || { title: "Strona" };
  const breadcrumbs = generateBreadcrumbs(pathname, routeMap);

  return {
    pathname,
    pageTitle: route.title,
    breadcrumbs,
    parentRoute: route.parent,
  };
}
```

#### useMobileMenu (src/lib/layout/useMobileMenu.ts)

Hook zarządzający stanem mobile menu (Sheet):

- Stan `isOpen`
- Funkcje `open`, `close`, `toggle`
- Auto-close przy zmianie route
- Focus trap w otwartym menu

```typescript
function useMobileMenu(): MobileMenuState {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useActiveRoute();

  // Auto-close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);

  return { isOpen, toggle, close, open };
}
```

### State w komponentach

- **LayoutContent**: używa `useAuthContext`, `useNetworkStatus`, `useActiveRoute`
- **MobileLayout**: używa `useMobileMenu`
- **ErrorBoundary**: lokalny state dla `hasError` i `error`
- **NetworkIndicator**: używa `useNetworkStatus`

## 7. Integracja API

### Endpointy

#### GET /api/users/me

**Implementacja**: `src/pages/api/users/me.ts`

**Request**:

- Method: `GET`
- Headers: `Authorization: Bearer <supabase_jwt>`
- Body: brak

**Response** (200):

```typescript
{
  uuid: string;
  companyUuid: string;
  createdAt: string; // ISO 8601
}
```

**Błędy**:

- 401: brak tokenu lub token wygasły → redirect na `/signin`
- 404: użytkownik nie istnieje w bazie (rzadkie, po rejestracji)
- 500: błąd serwera → toast error

**Implementacja service**:

Nowy plik: `src/lib/services/usersService.ts`

```typescript
import type { UserDTO, ProblemDetail } from "@/types";
import { createSupabaseClient } from "@/db/supabase.client";

export async function fetchCurrentUser(): Promise<UserDTO> {
  const supabase = createSupabaseClient();

  // Get current session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("UNAUTHORIZED");
  }

  // Fetch user from database
  const { data, error } = await supabase
    .from("users")
    .select("uuid, company_uuid, created_at")
    .eq("uuid", session.user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("NOT_FOUND");
    }
    throw error;
  }

  return {
    uuid: data.uuid,
    companyUuid: data.company_uuid,
    createdAt: data.created_at,
  };
}
```

**Endpoint handler**:

```typescript
// src/pages/api/users/me.ts
import type { APIRoute } from "astro";
import { fetchCurrentUser } from "@/lib/services/usersService";

export const GET: APIRoute = async ({ locals }) => {
  try {
    const user = await fetchCurrentUser();

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return new Response(
        JSON.stringify({
          code: "unauthorized",
          message: "Sesja wygasła. Zaloguj się ponownie.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error.message === "NOT_FOUND") {
      return new Response(
        JSON.stringify({
          code: "not_found",
          message: "Użytkownik nie istnieje.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        code: "internal_error",
        message: "Wystąpił błąd serwera.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

#### GET /api/companies/me

**Implementacja**: `src/pages/api/companies/me.ts`

**Request**:

- Method: `GET`
- Headers: `Authorization: Bearer <supabase_jwt>`
- Body: brak

**Response** (200):

```typescript
{
  uuid: string;
  name: string;
  createdAt: string; // ISO 8601
}
```

**Błędy**:

- 401: brak tokenu
- 404: firma nie istnieje (nie powinno się zdarzyć po poprawnej rejestracji)
- 500: błąd serwera

**Implementacja service**:

Nowy plik: `src/lib/services/companiesService.ts`

```typescript
import type { CompanyDTO } from "@/types";
import { createSupabaseClient } from "@/db/supabase.client";

export async function fetchCurrentCompany(): Promise<CompanyDTO> {
  const supabase = createSupabaseClient();

  // Get current session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("UNAUTHORIZED");
  }

  // Fetch user to get company_uuid
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("company_uuid")
    .eq("uuid", session.user.id)
    .single();

  if (userError) {
    throw userError;
  }

  // Fetch company
  const { data, error } = await supabase
    .from("companies")
    .select("uuid, name, created_at")
    .eq("uuid", userData.company_uuid)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("NOT_FOUND");
    }
    throw error;
  }

  return {
    uuid: data.uuid,
    name: data.name,
    createdAt: data.created_at,
  };
}
```

**Endpoint handler**:

```typescript
// src/pages/api/companies/me.ts
import type { APIRoute } from "astro";
import { fetchCurrentCompany } from "@/lib/services/companiesService";

export const GET: APIRoute = async ({ locals }) => {
  try {
    const company = await fetchCurrentCompany();

    return new Response(JSON.stringify(company), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error.message === "UNAUTHORIZED") {
      return new Response(
        JSON.stringify({
          code: "unauthorized",
          message: "Sesja wygasła. Zaloguj się ponownie.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error.message === "NOT_FOUND") {
      return new Response(
        JSON.stringify({
          code: "not_found",
          message: "Firma nie istnieje.",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        code: "internal_error",
        message: "Wystąpił błąd serwera.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### Strategia cachowania (TanStack Query)

- **queryKey**: `['user', 'me']` dla użytkownika, `['company', 'me']` dla firmy
- **staleTime**: 5 minut (dane użytkownika rzadko się zmieniają)
- **cacheTime**: 10 minut
- **refetchInterval**: 5 minut (automatyczne odświeżanie w tle)
- **refetchOnWindowFocus**: true (odświeżenie po powrocie do karty)
- **refetchOnReconnect**: true (odświeżenie po przywróceniu połączenia)
- **retry**: 1 (jedna próba przy błędzie, potem przekierowanie na signin)

## 8. Interakcje użytkownika

### Desktop

1. **Nawigacja przez sidebar**:
   - Użytkownik klika na link w sidebar (np. "Kierowcy")
   - Link prowadzi do `/drivers` (natywna nawigacja Astro)
   - Aktywny link jest podświetlony
   - Focus pozostaje na aktywnym linku po nawigacji

2. **Otwarcie UserMenu**:
   - Użytkownik klika na avatar/nazwę firmy w sidebar
   - Dropdown rozwija się z animacją
   - Użytkownik widzi opcje: Ustawienia, Wyloguj
   - Click "Wyloguj" wywołuje Supabase signOut i redirect na `/signin?reason=signed-out`

3. **Obsługa błędu sesji**:
   - API zwraca 401 (sesja wygasła)
   - Hook `useAuthContext` wykrywa błąd
   - Automatyczne przekierowanie na `/signin?returnTo=/dashboard&expired=true&reason=timeout`
   - Na stronie logowania wyświetlany jest komunikat o wygasłej sesji

### Mobile

1. **Otwarcie menu hamburger**:
   - Użytkownik klika na ikonę hamburgera w TopBar
   - Sheet wysuwa się z lewej strony z animacją
   - Wyświetlana jest pełna lista nawigacji + UserMenu
   - Focus trap w otwartym menu

2. **Nawigacja przez bottom navigation**:
   - Użytkownik klika na ikonę w dolnej nawigacji (np. "Raporty")
   - Natywna nawigacja do `/reports`
   - Ikona jest podświetlona
   - Sheet się zamyka jeśli była otwarta

3. **Click "Więcej" w bottom navigation**:
   - Użytkownik klika na "Więcej"
   - Sheet wysuwa się z ustawieniami i dodatkowymi opcjami
   - Użytkownik może wybrać "Ustawienia" lub "Wyloguj"

### Uniwersalne

1. **Obsługa offline**:
   - Połączenie internetowe zostaje utracone
   - NetworkIndicator zmienia kolor na czerwony
   - Toast z komunikatem "Brak połączenia z internetem"
   - OfflineFallback banner pojawia się na górze strony
   - Próba nawigacji pokazuje cached dane (jeśli dostępne w Query Cache)
   - Po przywróceniu połączenia: toast "Połączenie przywrócone", auto-refetch danych

2. **Keyboard navigation**:
   - Tab przechodzi przez linki w sidebar/menu
   - Enter aktywuje link
   - Escape zamyka UserMenu dropdown lub mobile Sheet
   - Arrow keys w dropdown menu (Shadcn domyślnie obsługuje)

3. **Focus management**:
   - Po otwarciu dropdown/Sheet focus przenosi się na pierwszy element
   - Po zamknięciu focus wraca na trigger
   - Skip link na początek zawartości (dla screen readerów)

## 9. Warunki i walidacja

### Server-side (AuthenticatedLayout.astro)

1. **Sprawdzenie sesji Supabase**:
   - Warunek: `session?.user` istnieje
   - Jeśli nie: redirect 302 na `/signin?returnTo=${encodeURIComponent(Astro.url.pathname)}&expired=true`
   - Jeśli tak: renderowanie layoutu

2. **Przekazanie credentials do client**:
   - Walidacja że `import.meta.env.SUPABASE_URL` i `import.meta.env.SUPABASE_KEY` istnieją
   - Jeśli nie: throw error (to powinno być wykryte w development)

### Client-side (useAuthContext)

1. **Walidacja odpowiedzi API**:
   - Status 200: parsowanie JSON i walidacja struktury (Zod)
   - Status 401: automatyczne przekierowanie na `/signin`
   - Status 404: wyświetlenie error state (użytkownik nie istnieje w bazie)
   - Status 500: wyświetlenie error state z możliwością retry

2. **Walidacja danych użytkownika**:
   - Schema Zod dla `UserDTO`:
     ```typescript
     const UserDTOSchema = z.object({
       uuid: z.string().uuid(),
       companyUuid: z.string().uuid(),
       createdAt: z.string().datetime(),
     });
     ```
   - Rzucenie błędu jeśli walidacja nie przejdzie

3. **Walidacja danych firmy**:
   - Schema Zod dla `CompanyDTO`:
     ```typescript
     const CompanyDTOSchema = z.object({
       uuid: z.string().uuid(),
       name: z.string().min(1),
       createdAt: z.string().datetime(),
     });
     ```

### UI Conditional Rendering

1. **Loading state**:
   - Warunek: `isLoading === true`
   - Efekt: wyświetlenie skeleton loadera w miejscu sidebara i contentu

2. **Error state**:
   - Warunek: `error !== null && error.status !== 401`
   - Efekt: wyświetlenie ErrorBoundary fallback z możliwością retry

3. **Offline state**:
   - Warunek: `isOnline === false`
   - Efekt: wyświetlenie OfflineFallback banner, NetworkIndicator w kolorze czerwonym

4. **Flagowane moduły**:
   - Warunek: feature flag `SHOW_VEHICLES` === false
   - Efekt: wyświetlenie linku z badge "Wkrótce" lub całkowite ukrycie

5. **Aktywny route**:
   - Warunek: `navItem.href === activeRoute` lub `activeRoute.startsWith(navItem.href)` dla route z podstronami
   - Efekt: podświetlenie linku, `aria-current="page"`

## 10. Obsługa błędów

### Błędy API

1. **401 Unauthorized**:
   - Przyczyna: sesja wygasła, token nieprawidłowy
   - Obsługa:
     - Automatyczne przekierowanie na `/signin?returnTo=${pathname}&expired=true&reason=timeout`
     - Komunikat na stronie logowania: "Twoja sesja wygasła. Zaloguj się ponownie."
   - Nie pokazujemy toastu (użytkownik widzi komunikat na stronie signin)

2. **404 Not Found**:
   - Przyczyna: użytkownik lub firma nie istnieje w bazie
   - Obsługa:
     - ErrorBoundary fallback
     - Komunikat: "Nie można załadować danych użytkownika. Skontaktuj się z administratorem."
     - Przycisk "Wyloguj i zaloguj ponownie"
   - Toast error: "Błąd: brak danych użytkownika"

3. **500 Internal Server Error**:
   - Przyczyna: błąd serwera, błąd bazy danych
   - Obsługa:
     - ErrorBoundary fallback
     - Komunikat: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
     - Przycisk "Spróbuj ponownie" (refetch)
     - Przycisk "Wyloguj"
   - Toast error: "Wystąpił błąd. Spróbuj ponownie."
   - Logowanie błędu do telemetrii (jeśli włączone)

4. **Network Error**:
   - Przyczyna: brak połączenia z internetem
   - Obsługa:
     - NetworkIndicator zmienia stan na "offline"
     - OfflineFallback banner
     - Toast: "Brak połączenia z internetem"
     - Automatyczny retry przy przywróceniu połączenia
   - Nie przekierowujemy na signin (to nie jest błąd sesji)

### Błędy renderowania (React Error Boundary)

1. **Błąd w drzewie komponentów**:
   - Przyczyna: runtime error w komponencie potomnym
   - Obsługa:
     - ErrorBoundary przechwytuje błąd
     - Wyświetlenie fallback UI z komunikatem
     - Opcje: "Odśwież stronę", "Wróć do Dashboard"
     - Logowanie błędu do console.error (i opcjonalnie telemetrii)
   - W development: wyświetlenie stack trace

2. **Błąd ładowania chunk**:
   - Przyczyna: webpack chunk loading error (rzadkie, przy deployment)
   - Obsługa:
     - Toast: "Wykryto nową wersję aplikacji. Odśwież stronę."
     - Automatyczne odświeżenie po 3 sekundach

### Graceful degradation

1. **Brak danych użytkownika (podczas ładowania)**:
   - Wyświetlenie skeleton w sidebar (zamiast nazwy firmy)
   - Wyświetlenie generic avatar w UserMenu
   - Zablokowanie możliwości otwarcia UserMenu dropdown

2. **Wolne połączenie**:
   - NetworkIndicator pokazuje status "slow"
   - Toast: "Wolne połączenie. Ładowanie może potrwać dłużej."
   - Wydłużenie timeout dla API calls

3. **Częściowa utrata funkcjonalności**:
   - Jeśli API użytkownika działa, ale API firmy nie:
     - Wyświetlenie danych użytkownika
     - Placeholder "Nazwa firmy" w sidebar
     - Toast: "Nie można załadować danych firmy"
   - Nie blokujemy całego layoutu

## 11. Kroki implementacji

### Krok 1: Setup struktur folderów i typów

1. Utworzyć folder `src/components/layout/`
2. Utworzyć plik `src/lib/layout/types.ts` z typami:
   - `NavItem`, `AuthContextValue`, `LayoutConfig`, `Crumb`, `NetworkStatus`, `MobileMenuState`
   - `ProcessedNavItems`, `RouteInfo`
3. Utworzyć folder `src/lib/services/` (jeśli nie istnieje)
4. Zainstalować zależności (jeśli potrzebne):
   ```bash
   npm install @tanstack/react-query lucide-react sonner
   ```

### Krok 2: Implementacja API services

1. Utworzyć `src/lib/services/usersService.ts`:
   - `fetchCurrentUser()` - wywołanie Supabase RPC lub bezpośrednie query
   - Obsługa błędów (401, 404, 500)
2. Utworzyć `src/lib/services/companiesService.ts`:
   - `fetchCurrentCompany()` - query z join przez `users.company_uuid`
   - Obsługa błędów
3. Dodać Zod schemas dla walidacji odpowiedzi

### Krok 3: Implementacja API endpoints

1. Utworzyć `src/pages/api/users/me.ts`:
   - Handler GET
   - Wywołanie `fetchCurrentUser()`
   - Mapowanie błędów na ProblemDetail
2. Utworzyć `src/pages/api/companies/me.ts`:
   - Handler GET
   - Wywołanie `fetchCurrentCompany()`
   - Mapowanie błędów na ProblemDetail
3. Testowanie endpointów przez Thunder Client / Postman

### Krok 4: Implementacja custom hooks

1. Utworzyć `src/lib/layout/useAuthContext.ts`:
   - Hook z TanStack Query dla użytkownika i firmy
   - Auto redirect przy 401
   - Funkcja `signOut`
   - Funkcja `refresh`
2. Utworzyć `src/lib/layout/useNetworkStatus.ts`:
   - Nasłuchiwanie na `online`/`offline` events
   - State `isOnline`
   - Toasty przy zmianie stanu
3. Utworzyć `src/lib/layout/useActiveRoute.ts`:
   - Parsing `window.location.pathname`
   - Mapowanie na `RouteInfo`
   - Generowanie breadcrumbs
4. Utworzyć `src/lib/layout/useMobileMenu.ts`:
   - State `isOpen`
   - Funkcje `toggle`, `close`, `open`
   - Auto-close przy zmianie route

### Krok 5: Implementacja komponentów nawigacyjnych

1. Utworzyć `src/components/layout/NavItem.tsx`:
   - Link z ikoną i tekstem
   - Props: `item: NavItem`
   - Active state styling
   - Keyboard accessible
2. Utworzyć `src/components/layout/MainNavigation.tsx`:
   - Lista NavItem
   - Props: `items: NavItem[]`, `activeRoute: string`, `orientation`
   - ARIA labels
3. Utworzyć `src/components/layout/UserMenu.tsx`:
   - Shadcn DropdownMenu
   - Trigger: avatar + company name
   - Menu items: Ustawienia, Wyloguj
   - Props: `user`, `company`, `onSignOut`

### Krok 6: Implementacja Desktop Sidebar

1. Utworzyć `src/components/layout/DesktopSidebar.tsx`:
   - Fixed aside element
   - Logo na górze
   - MainNavigation
   - UserMenu na dole
   - NetworkIndicator
   - Props: `companyName`, `activeRoute`, `user`, `company`
   - Responsive: ukryte na mobile (`hidden md:block`)

### Krok 7: Implementacja Mobile Layout

1. Utworzyć `src/components/layout/TopBar.tsx`:
   - Sticky header
   - Logo, PageTitle, HamburgerButton
   - Props: `pageTitle`, `onMenuToggle`, `isMenuOpen`
2. Utworzyć `src/components/layout/BottomNavigation.tsx`:
   - Fixed nav na dole
   - 4 ikony: Dashboard, Kierowcy, Raporty, Więcej
   - Props: `activeRoute`, `onMoreClick`
3. Utworzyć `src/components/layout/MobileLayout.tsx`:
   - Kombinacja TopBar + Shadcn Sheet + BottomNavigation
   - Props: `children`, `pageTitle`, `activeRoute`, `companyName`, `user`, `company`
   - Hook `useMobileMenu`
   - Responsive: widoczne tylko na mobile (`block md:hidden`)

### Krok 8: Implementacja utility components

1. Utworzyć `src/components/layout/NetworkIndicator.tsx`:
   - Badge z ikoną
   - Hook `useNetworkStatus`
   - Conditional styling (green/red)
2. Utworzyć `src/components/layout/Breadcrumbs.tsx`:
   - Nav z listą crumbs
   - Props: `crumbs: Crumb[]`
   - ARIA labels
3. Utworzyć `src/components/layout/OfflineFallback.tsx`:
   - Alert banner
   - Props: `onRetry`
   - Conditional rendering (tylko gdy offline)
4. Utworzyć `src/components/layout/ErrorBoundary.tsx`:
   - React Error Boundary class component
   - Fallback UI
   - Props: `children`, `fallback?`

### Krok 9: Implementacja LayoutContent

1. Utworzyć `src/components/layout/LayoutContent.tsx`:
   - Hook `useAuthContext`
   - Hook `useNetworkStatus`
   - Hook `useActiveRoute`
   - Conditional rendering: Desktop Sidebar XOR Mobile Layout
   - Loading state: skeleton
   - Error state: ErrorBoundary
   - Props: `children`, `supabaseUrl`, `supabaseKey`

### Krok 10: Implementacja AuthenticatedLayout.astro

1. Utworzyć `src/layouts/AuthenticatedLayout.astro`:
   - Server-side sprawdzenie sesji:
     ```typescript
     const {
       data: { session },
     } = await Astro.locals.supabase.auth.getSession();
     if (!session?.user) {
       return Astro.redirect(`/signin?returnTo=${encodeURIComponent(Astro.url.pathname)}&expired=true`);
     }
     ```
   - Props: `title?`, `description?`
   - Slot dla zawartości
   - Osadzenie `LayoutContent` jako React island z `client:only="react"`
   - Globalne style i Toaster (Sonner)
2. Dodać meta tags w `<head>`:
   - title, description
   - viewport, charset
   - favicon

### Krok 11: Integracja z istniejącymi stronami

1. Zmienić `src/pages/index.astro`:
   - Redirect na `/dashboard` jeśli zalogowany, na `/signin` jeśli nie
2. Utworzyć `src/pages/dashboard.astro`:
   - Użycie `AuthenticatedLayout`
   - Placeholder content: "Dashboard - coming soon"
3. Utworzyć placeholder pages:
   - `src/pages/drivers.astro`
   - `src/pages/reports.astro`
   - `src/pages/settings/profile.astro`
   - `src/pages/settings/alerts.astro`
   - `src/pages/settings/account.astro`
   - Wszystkie używają `AuthenticatedLayout`

### Krok 12: Stylowanie i responsive design

1. Dodać Tailwind utilities dla:
   - Sidebar: fixed, w-64, h-screen
   - TopBar: sticky top-0, h-16
   - BottomNavigation: fixed bottom-0, h-16
   - Content: ml-64 na desktop, ml-0 na mobile, pt-16 na mobile
2. Dodać breakpoint dla mobile/desktop: `md:` (768px)
3. Dodać animacje:
   - Sidebar hover effect
   - Sheet slide-in animation (Shadcn default)
   - Dropdown fade-in (Shadcn default)
   - Page transition (opcjonalnie, Astro View Transitions)

### Krok 13: Accessibility improvements

1. Dodać ARIA labels:
   - `<nav aria-label="Główna nawigacja">`
   - `<nav aria-label="Breadcrumb">`
   - `aria-current="page"` dla aktywnego linku
2. Dodać keyboard shortcuts (opcjonalnie):
   - `Ctrl+K` - otwarcie search (przyszłość)
   - `Esc` - zamknięcie dropdown/sheet
3. Dodać skip link:
   - "Przejdź do treści" na początku (hidden, widoczny na focus)
4. Focus trap w mobile Sheet (Shadcn domyślnie obsługuje)

### Krok 14: Testowanie

1. Testowanie server-side guard:
   - Próba dostępu do `/dashboard` bez logowania → redirect na `/signin?returnTo=/dashboard`
   - Po zalogowaniu → redirect z powrotem na `/dashboard`
2. Testowanie API calls:
   - Poprawne załadowanie danych użytkownika i firmy
   - Obsługa błędu 401 → auto redirect
   - Obsługa błędu 500 → error state z retry
3. Testowanie nawigacji:
   - Click na linki w sidebar → nawigacja
   - Aktywny link podświetlony
   - Breadcrumbs aktualizują się
4. Testowanie mobile:
   - TopBar i BottomNavigation widoczne
   - Hamburger otwiera Sheet
   - Sheet zamyka się po kliknięciu linku
   - Bottom nav highlightuje aktywny route
5. Testowanie offline:
   - Wyłączenie sieci → NetworkIndicator czerwony, toast, OfflineFallback
   - Włączenie sieci → toast, auto refetch
6. Testowanie logout:
   - Click "Wyloguj" → Supabase signOut → redirect `/signin?reason=signed-out`

### Krok 15: Optymalizacje

1. Code splitting:
   - Lazy load UserMenu dropdown
   - Lazy load mobile Sheet (jeśli heavy)
2. Memoizacja:
   - `React.memo()` dla NavItem
   - `useMemo()` dla computed nav items
   - `useCallback()` dla event handlers
3. Preload:
   - Preload `/api/users/me` i `/api/companies/me` w `<head>` (link rel="preload")
4. Caching:
   - TanStack Query z odpowiednimi ustawieniami stale/cache time
   - Service Worker dla offline support (opcjonalnie)

### Krok 16: Dokumentacja i finalizacja

1. Dodać komentarze JSDoc do wszystkich komponentów i hooków
2. Dodać README dla `src/components/layout/` z opisem komponentów
3. Dodać przykłady użycia w komentarzach
4. Code review i refactoring
5. Merge do main branch

---

## Dodatkowe uwagi implementacyjne

### Icons

Użyć biblioteki `lucide-react` dla ikon:

- `LayoutDashboard` - Dashboard
- `Users` - Kierowcy
- `FileText` - Raporty
- `Settings` - Ustawienia
- `Menu` - Hamburger
- `X` - Close
- `ChevronDown` - Dropdown
- `LogOut` - Wyloguj
- `Wifi` / `WifiOff` - Network status

### Kolory (Tailwind/Shadcn)

- Aktywny link: `bg-primary/10 text-primary`
- Hover link: `hover:bg-accent`
- Sidebar bg: `bg-background border-r border-border`
- TopBar/BottomNavigation: `bg-background border-t border-border`
- NetworkIndicator: `badge-success` (green) / `badge-destructive` (red)

### Responsywność

- Mobile: `< 768px` - TopBar + BottomNav + Sheet
- Desktop: `>= 768px` - Sidebar + Content
- Tablet: `768px - 1024px` - zachowanie desktop (sidebar może być węższy)

### Feature Flags

Dla flagowanych modułów (Pojazdy, Przypisania):

```typescript
const FEATURE_FLAGS = {
  SHOW_VEHICLES: false,
  SHOW_ASSIGNMENTS: false,
};

const flaggedNavItems = [
  { id: 'vehicles', label: 'Pojazdy', href: '/vehicles', icon: <Truck />, isFlagged: !FEATURE_FLAGS.SHOW_VEHICLES },
  { id: 'assignments', label: 'Przypisania', href: '/assignments', icon: <Calendar />, isFlagged: !FEATURE_FLAGS.SHOW_ASSIGNMENTS },
];
```

Renderowanie:

```tsx
{
  flaggedNavItems.map((item) => (
    <NavItem key={item.id} item={item} disabled={item.isFlagged}>
      {item.isFlagged && <Badge>Wkrótce</Badge>}
    </NavItem>
  ));
}
```

### Performance Budget

- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3.5s
- Layout shift (CLS): < 0.1
- JavaScript bundle dla layout: < 50kb gzipped
