# Plan implementacji widoku Dashboard

## 1. Przegląd

Dashboard „Dzisiaj" to główny widok aplikacji RouteLog, który wyświetla się bezpośrednio po zalogowaniu spedytora. Jego celem jest zapewnienie szybkiego przeglądu statusu raportów dziennych od kierowców oraz umożliwienie identyfikacji potencjalnych problemów poprzez prezentację poziomów ryzyka. Widok automatycznie odświeża się co 60 sekund, oferuje możliwość ręcznego odświeżenia oraz pokazuje kluczowe metryki: liczbę aktywnych kierowców, wysłane i oczekujące raporty, rozkład poziomów ryzyka oraz listy dzisiejszych raportów i kierowców bez raportu.

## 2. Routing widoku

Widok dostępny pod ścieżką: `/dashboard`

- Wymaga uwierzytelnienia (guard w middleware).
- Jest domyślnym widokiem po zalogowaniu (US-002).
- Wykorzystuje `AuthenticatedLayout.astro` jako layout.
- Po utracie sesji (401) następuje przekierowanie do `/signin`.

## 3. Struktura komponentów

```
/dashboard (Astro page)
├── AuthenticatedLayout.astro
│   └── DashboardView (React island)
│       ├── DashboardHeader
│       │   ├── PageTitle
│       │   ├── LastUpdateIndicator
│       │   └── RefreshButton
│       ├── MetricsCardsGrid
│       │   ├── MetricCard (aktywni kierowcy)
│       │   ├── MetricCard (wysłane raporty)
│       │   ├── MetricCard (oczekujące raporty)
│       │   └── RiskBreakdownCard
│       │       └── RiskBadge (x4: none/low/medium/high)
│       ├── TodayReportsSection
│       │   ├── SectionHeader
│       │   ├── ReportsTable (desktop)
│       │   │   └── ReportRow
│       │   │       ├── DriverInfo
│       │   │       ├── ReportStatus
│       │   │       ├── RiskBadge
│       │   │       └── ActionButton
│       │   └── ReportCards (mobile)
│       │       └── ReportCard
│       │           ├── DriverInfo
│       │           ├── ReportStatus
│       │           ├── RiskBadge
│       │           └── ActionButton
│       ├── PendingDriversSection
│       │   ├── SectionHeader
│       │   └── PendingDriversList
│       │       └── PendingDriverCard
│       │           ├── DriverInfo
│       │           └── ContactButton
│       └── ConnectionBadge
└── LoadingSkeletons (gdy dane się ładują)
```

## 4. Szczegóły komponentów

### DashboardView

- **Opis komponentu**: Główny kontener widoku dashboardu, zarządza stanem danych, orchestruje automatyczne odświeżanie i wyświetla wszystkie sekcje.

- **Główne elementy**: `<div>` kontener główny z klasami Tailwind dla layoutu grid/flex, zawiera wszystkie podrzędne sekcje (header, metryki, tabele).

- **Obsługiwane zdarzenia**:
  - Manual refresh (kliknięcie przycisku odświeżania)
  - Nawigacja do szczegółów raportu
  - Nawigacja do listy raportów z filtrami
  - Nawigacja do profilu kierowcy

- **Warunki walidacji**: Brak – komponent głównie prezentacyjny.

- **Typy**:
  - `DashboardData` (ViewModel)
  - `ReportsTodaySummaryDTO`
  - `ReportListItemDTO[]`
  - `DriverDTO[]`

- **Propsy**:
  ```typescript
  interface DashboardViewProps {
    initialSummary?: ReportsTodaySummaryDTO;
    initialReports?: ReportListItemDTO[];
    timezone?: string;
  }
  ```

### DashboardHeader

- **Opis komponentu**: Nagłówek widoku zawierający tytuł, wskaźnik ostatniej aktualizacji oraz przycisk ręcznego odświeżania.

- **Główne elementy**:
  - `<header>` z tytułem strony
  - `<span>` dla wskaźnika czasu ostatniej aktualizacji
  - `<Button>` do ręcznego odświeżania

- **Obsługiwane zdarzenia**:
  - `onRefresh` – callback wywoływany przy kliknięciu przycisku odświeżania

- **Warunki walidacji**:
  - Przycisk odświeżania zablokowany podczas trwającego odświeżania (debouncing 2s)

- **Typy**: `IsoDateString` dla `lastUpdatedAt`

- **Propsy**:
  ```typescript
  interface DashboardHeaderProps {
    lastUpdatedAt: IsoDateString;
    isRefreshing: boolean;
    onRefresh: () => void;
  }
  ```

### MetricsCardsGrid

- **Opis komponentu**: Kontener siatki metryk prezentujący kluczowe liczby w kartach.

- **Główne elementy**: `<div>` grid container (4 kolumny desktop, 2 mobile) zawierający 4 `MetricCard` komponenty.

- **Obsługiwane zdarzenia**: Brak – komponent prezentacyjny.

- **Warunki walidacji**: Brak.

- **Typy**: `MetricsData` (ViewModel)

- **Propsy**:
  ```typescript
  interface MetricsCardsGridProps {
    metrics: MetricsData;
    isLoading?: boolean;
  }
  ```

### MetricCard

- **Opis komponentu**: Karta prezentująca pojedynczą metrykę z ikoną, tytułem i wartością liczbową.

- **Główne elementy**:
  - `<Card>` (shadcn/ui)
  - Ikona (optional)
  - Tytuł metryki
  - Wartość liczbowa (duża czcionka)
  - Opcjonalny opis pomocniczy

- **Obsługiwane zdarzenia**: Opcjonalnie `onClick` dla nawigacji (np. do pełnej listy).

- **Warunki walidacji**: Brak.

- **Typy**: Podstawowe typy primitives.

- **Propsy**:
  ```typescript
  interface MetricCardProps {
    title: string;
    value: number;
    icon?: React.ReactNode;
    description?: string;
    onClick?: () => void;
    variant?: 'default' | 'accent';
    isLoading?: boolean;
  }
  ```

### RiskBreakdownCard

- **Opis komponentu**: Specjalna karta metryk pokazująca rozkład raportów według poziomów ryzyka z kolorowymi badge'ami.

- **Główne elementy**:
  - `<Card>` kontener
  - Grid z 4 `RiskBadge` komponentami (po jednym na każdy poziom ryzyka)
  - Każdy badge pokazuje liczbę raportów danego poziomu

- **Obsługiwane zdarzenia**: Kliknięcie w badge może filtrować widok raportów poniżej lub nawigować do `/reports?riskLevel=X`.

- **Warunki walidacji**: Brak.

- **Typy**:
  - `RiskBreakdown` (ViewModel)
  - `ReportRiskLevel`

- **Propsy**:
  ```typescript
  interface RiskBreakdownCardProps {
    breakdown: RiskBreakdown;
    onRiskClick?: (riskLevel: ReportRiskLevel) => void;
    isLoading?: boolean;
  }
  ```

### RiskBadge

- **Opis komponentu**: Badge wizualizujący poziom ryzyka z odpowiednim kolorem i ikoną zgodnie z WCAG.

- **Główne elementy**:
  - `<Badge>` (shadcn/ui) z wariantami kolorystycznymi
  - Tekst poziom ryzyka (Brak/Niskie/Średnie/Wysokie)
  - Opcjonalna ikona

- **Obsługiwane zdarzenia**: Opcjonalnie `onClick`.

- **Warunki walidacji**: Wymagany poziom ryzyka z enum `ReportRiskLevel`.

- **Typy**: `ReportRiskLevel`

- **Propsy**:
  ```typescript
  interface RiskBadgeProps {
    level: ReportRiskLevel;
    showIcon?: boolean;
    onClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
  }
  ```

### TodayReportsSection

- **Opis komponentu**: Sekcja wyświetlająca wszystkie raporty złożone dzisiaj w formie tabeli (desktop) lub kart (mobile).

- **Główne elementy**:
  - `<section>` kontener
  - `<SectionHeader>` z tytułem „Dzisiejsze raporty"
  - `<ReportsTable>` dla desktop (>768px)
  - `<ReportCards>` dla mobile (<768px)
  - Stan pusty, jeśli brak raportów

- **Obsługiwane zdarzenia**:
  - Kliknięcie w raport → nawigacja do `/reports/[uuid]`
  - Sortowanie tabeli (opcjonalnie)

- **Warunki walidacji**: Brak.

- **Typy**: `ReportListItemDTO[]`

- **Propsy**:
  ```typescript
  interface TodayReportsSectionProps {
    reports: ReportListItemDTO[];
    isLoading?: boolean;
    onReportClick: (reportUuid: Uuid) => void;
  }
  ```

### ReportsTable

- **Opis komponentu**: Tabela responsywna wyświetlająca raporty w formacie tabelarycznym z kolumnami: kierowca, pojazd, status trasy, opóźnienie, ryzyko, akcje.

- **Główne elementy**:
  - `<Table>` (shadcn/ui)
  - `<TableHeader>` z nazwami kolumn
  - `<TableBody>` z wierszami `ReportRow`
  - ARIA labels dla dostępności

- **Obsługiwane zdarzenia**: Kliknięcie w wiersz → nawigacja do szczegółów.

- **Warunki walidacji**: Brak.

- **Typy**: `ReportListItemDTO[]`

- **Propsy**:
  ```typescript
  interface ReportsTableProps {
    reports: ReportListItemDTO[];
    onRowClick: (reportUuid: Uuid) => void;
  }
  ```

### ReportRow

- **Opis komponentu**: Pojedynczy wiersz tabeli reprezentujący jeden raport.

- **Główne elementy**:
  - `<TableRow>`
  - `<TableCell>` dla każdej kolumny: nazwa kierowcy, status, opóźnienie (min), ryzyko (badge), przycisk akcji

- **Obsługiwane zdarzenia**: Click → `onRowClick(reportUuid)`.

- **Warunki walidacji**: Brak.

- **Typy**: `ReportListItemDTO`

- **Propsy**:
  ```typescript
  interface ReportRowProps {
    report: ReportListItemDTO;
    onRowClick: (reportUuid: Uuid) => void;
  }
  ```

### ReportCards

- **Opis komponentu**: Lista kart raportów dla widoku mobilnego.

- **Główne elementy**:
  - `<div>` kontener flex column
  - `<ReportCard>` dla każdego raportu

- **Obsługiwane zdarzenia**: Click na kartę → nawigacja.

- **Warunki walidacji**: Brak.

- **Typy**: `ReportListItemDTO[]`

- **Propsy**:
  ```typescript
  interface ReportCardsProps {
    reports: ReportListItemDTO[];
    onCardClick: (reportUuid: Uuid) => void;
  }
  ```

### ReportCard

- **Opis komponentu**: Karta pojedynczego raportu dla widoku mobilnego.

- **Główne elementy**:
  - `<Card>` (shadcn/ui)
  - Sekcja z informacją o kierowcy (avatar/inicjały, imię)
  - Status trasy
  - Opóźnienie (jeśli > 0)
  - `<RiskBadge>`
  - Przycisk „Zobacz szczegóły"

- **Obsługiwane zdarzenia**: Click → `onCardClick(reportUuid)`.

- **Warunki walidacji**: Brak.

- **Typy**: `ReportListItemDTO`

- **Propsy**:
  ```typescript
  interface ReportCardProps {
    report: ReportListItemDTO;
    onCardClick: (reportUuid: Uuid) => void;
  }
  ```

### PendingDriversSection

- **Opis komponentu**: Sekcja wyświetlająca listę kierowców, którzy jeszcze nie wysłali raportu dzisiaj.

- **Główne elementy**:
  - `<section>` kontener
  - `<SectionHeader>` z tytułem „Oczekujące raporty"
  - `<PendingDriversList>` – lista kierowców
  - Stan pusty, jeśli wszyscy kierowcy wysłali raporty (komunikat pozytywny)

- **Obsługiwane zdarzenia**: Kliknięcie w kierowcę → nawigacja do `/drivers/[uuid]` lub otwarcie kontaktu.

- **Warunki walidacji**: Brak.

- **Typy**: `PendingDriver[]` (ViewModel)

- **Propsy**:
  ```typescript
  interface PendingDriversSectionProps {
    pendingDrivers: PendingDriver[];
    isLoading?: boolean;
    onDriverClick?: (driverUuid: Uuid) => void;
  }
  ```

### PendingDriversList

- **Opis komponentu**: Lista kart kierowców oczekujących na wysłanie raportu.

- **Główne elementy**:
  - `<div>` kontener grid (2-3 kolumny desktop, 1 mobile)
  - `<PendingDriverCard>` dla każdego kierowcy

- **Obsługiwane zdarzenia**: Przekazuje eventy z kart dzieci.

- **Warunki walidacji**: Brak.

- **Typy**: `PendingDriver[]`

- **Propsy**:
  ```typescript
  interface PendingDriversListProps {
    drivers: PendingDriver[];
    onDriverClick?: (driverUuid: Uuid) => void;
  }
  ```

### PendingDriverCard

- **Opis komponentu**: Karta pojedynczego kierowcy, który nie wysłał jeszcze raportu.

- **Główne elementy**:
  - `<Card>` (shadcn/ui) z lekkim podświetleniem (np. border accent)
  - Avatar/inicjały kierowcy
  - Imię kierowcy
  - Informacja o pojeździe (jeśli dostępna)
  - Czas od wysłania linku (opcjonalnie)
  - Przycisk „Skontaktuj się" (email/tel) lub „Zobacz profil"

- **Obsługiwane zdarzenia**: Click na kartę lub przycisk → `onDriverClick(driverUuid)`.

- **Warunki walidacji**: Brak.

- **Typy**: `PendingDriver` (ViewModel)

- **Propsy**:
  ```typescript
  interface PendingDriverCardProps {
    driver: PendingDriver;
    onDriverClick?: (driverUuid: Uuid) => void;
  }
  ```

### ConnectionBadge

- **Opis komponentu**: Badge pokazujący status połączenia (online/offline) oraz tryb aktualizacji (realtime/polling).

- **Główne elementy**:
  - `<Badge>` z ikoną statusu
  - Tekst „Online – odświeżanie co 60s" lub „Offline"

- **Obsługiwane zdarzenia**: Brak.

- **Warunki walidacji**: Brak.

- **Typy**: Prostą stan boolean `isOnline`.

- **Propsy**:
  ```typescript
  interface ConnectionBadgeProps {
    isOnline: boolean;
    refetchInterval?: number;
  }
  ```

### LastUpdateIndicator

- **Opis komponentu**: Wyświetla czas ostatniej aktualizacji danych w formacie względnym (np. „Zaktualizowano 30 sekund temu").

- **Główne elementy**:
  - `<span>` z tekstem i ikoną zegara
  - ARIA live region (polite) dla aktualizacji

- **Obsługiwane zdarzenia**: Brak – automatycznie aktualizuje się co 10s.

- **Warunki walidacji**: Brak.

- **Typy**: `IsoDateString`

- **Propsy**:
  ```typescript
  interface LastUpdateIndicatorProps {
    lastUpdatedAt: IsoDateString;
  }
  ```

### RefreshButton

- **Opis komponentu**: Przycisk ręcznego odświeżania danych z wizualnym feedbackiem i debouncing.

- **Główne elementy**:
  - `<Button>` (shadcn/ui) z ikoną odświeżania
  - Spinner podczas ładowania
  - Tooltip „Odśwież dane"

- **Obsługiwane zdarzenia**: `onClick` → wywołanie `onRefresh` callback z debouncing 2s.

- **Warunki walidacji**: Zablokowany (disabled) podczas trwającego odświeżania.

- **Typy**: Brak specjalnych.

- **Propsy**:
  ```typescript
  interface RefreshButtonProps {
    onRefresh: () => void;
    isRefreshing: boolean;
    disabled?: boolean;
  }
  ```

### LoadingSkeletons

- **Opis komponentu**: Zestaw szkieletów ładowania (skeleton screens) wyświetlanych podczas pobierania danych.

- **Główne elementy**:
  - Skeleton grid metryk (4 prostokąty)
  - Skeleton tabeli (wiersze z placeholderami)
  - Skeleton listy pending drivers

- **Obsługiwane zdarzenia**: Brak.

- **Warunki walidacji**: Brak.

- **Typy**: Brak.

- **Propsy**: Brak – komponent bezargumentowy.

## 5. Typy

### DTO (z API – importowane z `src/types.ts`)

```typescript
// Już zdefiniowane w types.ts:
export interface ReportsTodaySummaryDTO {
  totalActiveDrivers: number;
  submittedCount: number;
  pendingCount: number;
  riskBreakdown: {
    none: number;
    low: number;
    medium: number;
    high: number;
  };
}

export type ReportListItemDTO = ReportDTO & {
  ai?: ReportAiResultDTO | null;
};

export type DriverDTO = PickCamel<
  Tables<"drivers">,
  "uuid" | "name" | "email" | "timezone" | "is_active" | "created_at" | "deleted_at"
>;

export type ReportRiskLevel = Enums<"report_risk_level">; // "NONE" | "LOW" | "MEDIUM" | "HIGH"
export type ReportRouteStatus = Enums<"report_route_status">; // "COMPLETED" | "PARTIALLY_COMPLETED" | "CANCELLED"

export type Uuid = string;
export type IsoDateString = string;
```

### ViewModel (typy frontendowe specyficzne dla dashboardu)

```typescript
// src/lib/dashboard/types.ts

import type {
  ReportsTodaySummaryDTO,
  ReportListItemDTO,
  DriverDTO,
  ReportRiskLevel,
  Uuid,
  IsoDateString,
} from "@/types";

/**
 * DashboardData – główny ViewModel dla widoku Dashboard.
 * Agreguje dane z wielu źródeł API.
 */
export interface DashboardData {
  summary: ReportsTodaySummaryDTO;
  todayReports: ReportListItemDTO[];
  pendingDrivers: PendingDriver[];
  lastUpdatedAt: IsoDateString;
}

/**
 * MetricsData – ViewModel dla siatki metryk na dashboardzie.
 */
export interface MetricsData {
  totalActiveDrivers: number;
  submittedCount: number;
  pendingCount: number;
  riskBreakdown: RiskBreakdown;
}

/**
 * RiskBreakdown – liczby raportów na poziom ryzyka.
 */
export interface RiskBreakdown {
  none: number;
  low: number;
  medium: number;
  high: number;
}

/**
 * PendingDriver – kierowca bez raportu na dzisiejszy dzień.
 * Zawiera dodatkowe informacje potrzebne w UI (np. czas od wysłania linku).
 */
export interface PendingDriver {
  uuid: Uuid;
  name: string;
  email: string;
  timezone: string;
  vehicleRegistration: string | null;
  linkSentAt: IsoDateString | null; // Czas wysłania linku (z tabeli report_links)
}

/**
 * DashboardFilters – opcjonalne filtry dla widoku (MVP: brak, ale struktura gotowa do rozbudowy).
 */
export interface DashboardFilters {
  date?: IsoDateString; // Domyślnie dzisiaj
  riskLevel?: ReportRiskLevel[];
}

/**
 * RefreshState – stan procesu odświeżania danych.
 */
export interface RefreshState {
  isRefreshing: boolean;
  lastRefreshAt: IsoDateString;
  error: string | null;
}
```

### Typy pomocnicze dla query hooks

```typescript
// src/lib/dashboard/queryKeys.ts
export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  summary: (date: string) => ["dashboard", "summary", date] as const,
  todayReports: (date: string) => ["dashboard", "reports", date] as const,
  pendingDrivers: (date: string) => ["dashboard", "pending", date] as const,
};
```

## 6. Zarządzanie stanem

### Stan lokalny komponentów

- **DashboardView**: Zarządza stanem odświeżania (`isRefreshing`), ostatniej aktualizacji (`lastUpdatedAt`), oraz błędów (`error`).
- **LastUpdateIndicator**: Lokalny timer (useEffect co 10s) dla aktualizacji względnego czasu.
- **RefreshButton**: Lokalny debounce state (2s) zapobiegający spamowaniu.

### Stan serwera (TanStack Query)

Dane dashboardu są pobierane z API i cachowane przez TanStack Query. Wykorzystujemy trzy główne query:

1. **Summary Query** (`useReportsTodaySummary`)
   - Endpoint: `GET /api/reports/today/summary`
   - Query key: `["dashboard", "summary", currentDate]`
   - Refetch interval: 60s (automatyczne odświeżanie)
   - Stale time: 30s

2. **Today Reports Query** (`useTodayReports`)
   - Endpoint: `GET /api/reports?from=today&to=today&includeAi=true`
   - Query key: `["dashboard", "reports", currentDate]`
   - Refetch interval: 60s
   - Stale time: 30s

3. **Pending Drivers Query** (`usePendingDrivers`)
   - Złożone: pobiera listę aktywnych kierowców oraz dzisiejsze raporty, następnie oblicza różnicę.
   - Endpoints: `GET /api/drivers?isActive=true` + `GET /api/reports?from=today&to=today`
   - Query key: `["dashboard", "pending", currentDate]`
   - Refetch interval: 60s
   - Stale time: 30s

### Custom hook: `useDashboard`

Hook agregujący wszystkie query i dostarczający zunifikowany interface dla `DashboardView`.

```typescript
// src/lib/dashboard/useDashboard.ts

import { useQuery } from "@tanstack/react-query";
import { dashboardQueryKeys } from "./queryKeys";
import type { DashboardData, PendingDriver } from "./types";
import { getCurrentDateInTimezone } from "@/lib/utils/date";

export function useDashboard(timezone: string = "Europe/Warsaw") {
  const currentDate = getCurrentDateInTimezone(timezone);

  // Query 1: Summary
  const summaryQuery = useQuery({
    queryKey: dashboardQueryKeys.summary(currentDate),
    queryFn: () => fetchReportsTodaySummary(currentDate, timezone),
    refetchInterval: 60_000, // 60s
    staleTime: 30_000, // 30s
  });

  // Query 2: Today Reports
  const reportsQuery = useQuery({
    queryKey: dashboardQueryKeys.todayReports(currentDate),
    queryFn: () => fetchTodayReports(currentDate, timezone),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Query 3: Pending Drivers
  const pendingQuery = useQuery({
    queryKey: dashboardQueryKeys.pendingDrivers(currentDate),
    queryFn: () => fetchPendingDrivers(currentDate, timezone),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const isLoading =
    summaryQuery.isLoading || reportsQuery.isLoading || pendingQuery.isLoading;
  const isRefreshing =
    summaryQuery.isFetching || reportsQuery.isFetching || pendingQuery.isFetching;
  const error =
    summaryQuery.error || reportsQuery.error || pendingQuery.error;

  const data: DashboardData | undefined =
    summaryQuery.data && reportsQuery.data && pendingQuery.data
      ? {
          summary: summaryQuery.data,
          todayReports: reportsQuery.data,
          pendingDrivers: pendingQuery.data,
          lastUpdatedAt: new Date().toISOString(),
        }
      : undefined;

  const refetch = async () => {
    await Promise.all([
      summaryQuery.refetch(),
      reportsQuery.refetch(),
      pendingQuery.refetch(),
    ]);
  };

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}
```

### Optymalizacje

- **Stale-while-revalidate**: Dane są wyświetlane z cache podczas pobierania świeżych danych w tle.
- **Automatic refetch**: Co 60s TanStack Query automatycznie odświeża dane bez interakcji użytkownika.
- **Manual refetch**: Przycisk odświeżania wywołuje `refetch()` na wszystkich query jednocześnie.
- **ARIA live regions**: Wskaźnik ostatniej aktualizacji korzysta z `aria-live="polite"` dla komunikacji zmian użytkownikom czytników ekranu.

## 7. Integracja API

### Endpoint 1: `GET /api/reports/today/summary`

**Opis**: Zwraca podsumowanie raportów dzisiejszych z metrykami i rozkładem ryzyka.

**Query params**:
- `timezone` (opcjonalny): strefa czasowa do interpretacji „dzisiaj" (default: `Europe/Warsaw`)

**Typ żądania**: brak body (GET).

**Typ odpowiedzi**: `ReportsTodaySummaryDTO`

```typescript
export interface ReportsTodaySummaryDTO {
  totalActiveDrivers: number;
  submittedCount: number;
  pendingCount: number;
  riskBreakdown: {
    none: number;
    low: number;
    medium: number;
    high: number;
  };
}
```

**Obsługa błędów**:
- `401 Unauthorized` → przekierowanie do `/signin`
- `500 Internal Server Error` → wyświetlenie toastu błędu, dane z cache (jeśli dostępne)
- `429 Too Many Requests` → toast z komunikatem o limicie, retry po czasie z nagłówka `Retry-After`

**Przykład wywołania**:

```typescript
async function fetchReportsTodaySummary(
  date: string,
  timezone: string
): Promise<ReportsTodaySummaryDTO> {
  const response = await fetch(
    `/api/reports/today/summary?timezone=${encodeURIComponent(timezone)}`,
    {
      headers: {
        Authorization: `Bearer ${await getSupabaseToken()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch summary: ${response.status}`);
  }

  return response.json();
}
```

### Endpoint 2: `GET /api/reports`

**Opis**: Zwraca listę raportów z możliwością filtrowania.

**Query params**:
- `from`: `YYYY-MM-DD` (required)
- `to`: `YYYY-MM-DD` (required)
- `includeAi`: `true` (wymagane dla wyświetlenia ryzyka)
- `limit`: number (opcjonalnie, default: 50)
- `sortBy`: `reportDate` (default)
- `sortDir`: `desc` (default)

**Typ żądania**: brak body (GET).

**Typ odpowiedzi**: `ReportsListResponseDTO`

```typescript
export type ReportsListResponseDTO = Paginated<ReportListItemDTO>;

export interface Paginated<TItem> {
  items: TItem[];
  nextCursor: string | null;
}

export type ReportListItemDTO = ReportDTO & {
  ai?: ReportAiResultDTO | null;
};
```

**Obsługa błędów**: Jak w endpoint 1.

**Przykład wywołania**:

```typescript
async function fetchTodayReports(
  date: string,
  timezone: string
): Promise<ReportListItemDTO[]> {
  const response = await fetch(
    `/api/reports?from=${date}&to=${date}&includeAi=true&sortBy=reportDate&sortDir=desc`,
    {
      headers: {
        Authorization: `Bearer ${await getSupabaseToken()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch reports: ${response.status}`);
  }

  const data: ReportsListResponseDTO = await response.json();
  return data.items;
}
```

### Endpoint 3: `GET /api/drivers` (dla pending drivers)

**Opis**: Zwraca listę aktywnych kierowców.

**Query params**:
- `isActive`: `true`
- `includeDeleted`: `false` (default)
- `limit`: number (opcjonalnie)

**Typ żądania**: brak body (GET).

**Typ odpowiedzi**: `DriversListResponseDTO`

```typescript
export type DriversListResponseDTO = Paginated<DriverDTO>;
```

**Logika obliczania pending drivers** (w custom hook lub API):

```typescript
async function fetchPendingDrivers(
  date: string,
  timezone: string
): Promise<PendingDriver[]> {
  // 1. Pobierz wszystkich aktywnych kierowców
  const driversResponse = await fetch(
    `/api/drivers?isActive=true&includeDeleted=false`,
    {
      headers: {
        Authorization: `Bearer ${await getSupabaseToken()}`,
      },
    }
  );
  const driversData: DriversListResponseDTO = await driversResponse.json();
  const allDrivers = driversData.items;

  // 2. Pobierz dzisiejsze raporty
  const reportsResponse = await fetch(
    `/api/reports?from=${date}&to=${date}`,
    {
      headers: {
        Authorization: `Bearer ${await getSupabaseToken()}`,
      },
    }
  );
  const reportsData: ReportsListResponseDTO = await reportsResponse.json();
  const reportedDriverUuids = new Set(
    reportsData.items.map((r) => r.driverUuid)
  );

  // 3. Oblicz kierowców bez raportu
  const pending = allDrivers
    .filter((driver) => !reportedDriverUuids.has(driver.uuid))
    .map((driver) => ({
      uuid: driver.uuid,
      name: driver.name,
      email: driver.email,
      timezone: driver.timezone,
      vehicleRegistration: null, // TODO: dołączyć z assignments jeśli dostępne
      linkSentAt: null, // TODO: opcjonalnie dołączyć z report_links
    }));

  return pending;
}
```

**Uwaga**: W przyszłości można stworzyć dedykowany endpoint `GET /api/reports/today/pending` zwracający gotową listę pending drivers, aby zredukować liczbę requestów i przenosić logikę na backend.

## 8. Interakcje użytkownika

### 1. Automatyczne odświeżanie danych

- **Opis**: Co 60 sekund TanStack Query automatycznie wywołuje refetch na wszystkich trzech query.
- **Feedback**: `LastUpdateIndicator` aktualizuje czas ostatniego odświeżenia.
- **ARIA**: Region `aria-live="polite"` informuje użytkowników czytników ekranu o aktualizacji.

### 2. Ręczne odświeżanie danych

- **Trigger**: Kliknięcie przycisku `RefreshButton` w nagłówku.
- **Akcja**: Wywołanie `refetch()` na wszystkich query jednocześnie.
- **Feedback**: 
  - Przycisk pokazuje spinner podczas ładowania.
  - Przycisk jest zablokowany (disabled) podczas odświeżania.
  - Debouncing 2s zapobiega spamowaniu.
- **Sukces**: Aktualizacja `lastUpdatedAt`, toast „Dane odświeżone" (opcjonalnie).
- **Błąd**: Toast z komunikatem błędu (np. „Nie udało się odświeżyć danych. Spróbuj ponownie.").

### 3. Kliknięcie w kartę metryki

- **Trigger**: Kliknięcie w `MetricCard` (np. „Oczekujące raporty").
- **Akcja**: Nawigacja do `/reports` z odpowiednim filtrem lub scroll do sekcji `PendingDriversSection`.
- **Przykład**: Kliknięcie „Oczekujące: 5" scrolluje stronę do sekcji „Oczekujące raporty".

### 4. Kliknięcie w RiskBadge w RiskBreakdownCard

- **Trigger**: Kliknięcie w badge poziomu ryzyka (np. „Wysokie: 2").
- **Akcja**: Filtrowanie widoku `TodayReportsSection` (lokalne) lub nawigacja do `/reports?riskLevel=HIGH`.
- **Feedback**: Tabela raportów aktualizuje się, pokazując tylko raporty danego poziomu ryzyka.

### 5. Kliknięcie w wiersz tabeli / kartę raportu

- **Trigger**: Kliknięcie w `ReportRow` lub `ReportCard`.
- **Akcja**: Nawigacja do `/reports/[uuid]` (szczegóły raportu).
- **Feedback**: Przejście do widoku szczegółów (może być modal lub osobna strona).

### 6. Kliknięcie w kartę pending driver

- **Trigger**: Kliknięcie w `PendingDriverCard`.
- **Akcja**: 
  - Opcja A: Nawigacja do `/drivers/[uuid]` (profil kierowcy).
  - Opcja B: Otwarcie modalnego okna kontaktu (email/telefon).
- **Feedback**: Przejście do profilu lub otwarcie klienta email/telefonu.

### 7. Sortowanie tabeli (opcjonalne w MVP)

- **Trigger**: Kliknięcie w nagłówek kolumny tabeli.
- **Akcja**: Sortowanie lokalne tablicy `todayReports` po danym polu.
- **Feedback**: Tabela przeładowuje się z nowym porządkiem, ikona strzałki w nagłówku wskazuje kierunek sortowania.

### 8. Obsługa offline

- **Trigger**: Utrata połączenia internetowego.
- **Akcja**: 
  - `ConnectionBadge` zmienia status na „Offline".
  - TanStack Query zatrzymuje automatyczne odświeżanie.
  - Dane z cache pozostają widoczne.
- **Feedback**: Badge offline, opcjonalny toast „Brak połączenia. Wyświetlane dane mogą być nieaktualne."

### 9. Powrót online

- **Trigger**: Przywrócenie połączenia.
- **Akcja**: 
  - `ConnectionBadge` zmienia status na „Online".
  - TanStack Query automatycznie wznawia refetch.
- **Feedback**: Badge online, toast „Połączenie przywrócone. Odświeżanie danych..." (opcjonalnie).

## 9. Warunki i walidacja

Dashboard jest głównie widokiem prezentacyjnym, jednak kilka warunków musi być weryfikowanych:

### Warunki po stronie API (weryfikowane przez backend)

1. **Autoryzacja**: Użytkownik musi być zalogowany i posiadać ważny JWT token Supabase.
   - Weryfikacja: Middleware sprawdza token przed dostępem do `/dashboard`.
   - Błąd: 401 → przekierowanie do `/signin`.

2. **Przynależność do firmy**: Użytkownik musi być przypisany do firmy (company_uuid).
   - Weryfikacja: RLS w Supabase automatycznie filtruje dane po `company_uuid`.
   - Błąd: 404 dla firmy → wyświetlenie komunikatu błędu.

3. **Aktywni kierowcy**: Lista kierowców powinna zawierać tylko aktywnych (`is_active = true`, `deleted_at IS NULL`).
   - Weryfikacja: Query param `?isActive=true&includeDeleted=false`.

4. **Zakres dat**: Filtry `from` i `to` muszą być poprawne daty w formacie `YYYY-MM-DD`.
   - Weryfikacja: Backend waliduje format i logiczność (from <= to).
   - Błąd: 400 Bad Request.

### Warunki po stronie UI (weryfikowane przez frontend)

1. **Debouncing odświeżania**: Przycisk ręcznego odświeżania blokowany na 2s po kliknięciu.
   - Komponent: `RefreshButton`
   - Implementacja: Lokalny state `isRefreshing` + setTimeout.

2. **Wyświetlanie danych**: 
   - Jeśli `isLoading = true` → wyświetl `LoadingSkeletons`.
   - Jeśli `error` → wyświetl komunikat błędu z przyciskiem „Spróbuj ponownie".
   - Jeśli `data` → wyświetl pełny widok.

3. **Stan pusty dla raportów**: Jeśli `todayReports.length === 0`, wyświetl komunikat „Brak raportów na dzisiaj".

4. **Stan pusty dla pending drivers**: Jeśli `pendingDrivers.length === 0`, wyświetl pozytywny komunikat „Wszyscy kierowcy wysłali raporty! 🎉".

5. **Walidacja poziomu ryzyka**: Badge `RiskBadge` wymaga poprawnej wartości z enum `ReportRiskLevel`.
   - Implementacja: TypeScript gwarantuje typ.

6. **ARIA live dla aktualizacji**: Wskaźnik `LastUpdateIndicator` musi mieć `aria-live="polite"`, aby użytkownicy czytników ekranu byli informowani o zmianach.

## 10. Obsługa błędów

### Błędy HTTP z API

| Kod | Opis | Obsługa UI |
|-----|------|------------|
| 401 | Unauthorized (brak lub nieprawidłowy token) | Automatyczne przekierowanie do `/signin` przez middleware. Toast: „Sesja wygasła. Zaloguj się ponownie." |
| 403 | Forbidden (brak uprawnień) | Toast: „Brak dostępu do tej funkcji." + wyświetlenie komunikatu błędu. |
| 404 | Not Found (np. firma nie istnieje) | Toast: „Nie znaleziono danych." + komunikat w sekcji. |
| 429 | Too Many Requests (rate limit) | Toast: „Zbyt wiele żądań. Spróbuj za chwilę." + disable przycisku odświeżania na czas z nagłówka `Retry-After`. |
| 500 | Internal Server Error | Toast: „Wystąpił błąd serwera. Spróbuj ponownie." + wyświetlenie danych z cache (jeśli dostępne). |
| 503 | Service Unavailable | Toast: „Serwis chwilowo niedostępny. Spróbuj ponownie za chwilę." + wyświetlenie danych z cache. |

### Błędy sieciowe

- **Brak połączenia**: TanStack Query automatycznie próbuje ponownie (retry 3x z exponential backoff). Jeśli wszystkie próby się nie powiodą:
  - Toast: „Nie można połączyć z serwerem. Sprawdź połączenie internetowe."
  - `ConnectionBadge` pokazuje status „Offline".
  - Dane z cache pozostają widoczne.

### Błędy walidacji (rzadkie w tym widoku, bo brak formularzy)

- Nie dotyczy dashboardu (brak inputów użytkownika poza przyciskiem odświeżania).

### Błędy parsowania danych

- Jeśli API zwróci dane w nieprawidłowym formacie, `useDashboard` hook złapie błąd parsowania JSON:
  - Toast: „Otrzymano nieprawidłowe dane. Skontaktuj się z administratorem."
  - Logi błędu do konsoli (tylko w dev) lub do narzędzia monitoringu (np. Sentry w prod).

### Błędy komponentów (React Error Boundary)

- Wszystkie komponenty dashboardu są owinięte w `ErrorBoundary` (z `AuthenticatedLayout`):
  - Jeśli komponent rzuci błąd renderowania, `ErrorBoundary` wyświetli fallback UI:
    - „Wystąpił nieoczekiwany błąd. Odśwież stronę."
    - Przycisk „Odśwież stronę".
  - Błąd zostaje zalogowany (console.error + monitoring).

### Retry Strategy

- **Automatyczne retry**: TanStack Query domyślnie wykonuje 3 próby z exponential backoff (0s, 1s, 3s).
- **Manualne retry**: Przycisk „Spróbuj ponownie" w komunikacie błędu wywołuje `refetch()`.

### Komunikaty użytkownikowi (UX Copy)

- **Sukces odświeżenia**: „Dane zaktualizowane." (toast, opcjonalnie – może być nadmiarowe przy auto-refresh).
- **Błąd odświeżenia**: „Nie udało się odświeżyć danych. Spróbuj ponownie."
- **Brak połączenia**: „Brak połączenia z internetem. Wyświetlane dane mogą być nieaktualne."
- **Sesja wygasła**: „Twoja sesja wygasła. Zaloguj się ponownie."
- **Limit żądań**: „Przekroczono limit żądań. Poczekaj chwilę i spróbuj ponownie."

## 11. Kroki implementacji

### Faza 1: Przygotowanie struktury i typów (1-2h)

1. Utwórz katalog `src/lib/dashboard/`.
2. Utwórz plik `src/lib/dashboard/types.ts` i zdefiniuj wszystkie typy ViewModel (DashboardData, MetricsData, RiskBreakdown, PendingDriver, itp.).
3. Utwórz plik `src/lib/dashboard/queryKeys.ts` z kluczami query dla TanStack Query.
4. Dodaj eksporty w `src/lib/dashboard/index.ts` dla wygody importu.

### Faza 2: Implementacja funkcji API (2-3h)

5. Utwórz plik `src/lib/dashboard/api.ts` z funkcjami:
   - `fetchReportsTodaySummary(date, timezone)`
   - `fetchTodayReports(date, timezone)`
   - `fetchPendingDrivers(date, timezone)`
6. Zaimplementuj obsługę błędów HTTP (sprawdzanie statusu, rzucanie wyjątków).
7. Dodaj helper `getSupabaseToken()` w `src/lib/auth/` do pobierania tokenu JWT z Supabase client (jeśli jeszcze nie istnieje).
8. Dodaj helper `getCurrentDateInTimezone(timezone)` w `src/lib/utils/date.ts` zwracający dzisiejszą datę w formacie `YYYY-MM-DD` dla danej strefy czasowej.

### Faza 3: Custom hook `useDashboard` (2h)

9. Utwórz plik `src/lib/dashboard/useDashboard.ts`.
10. Zaimplementuj hook `useDashboard(timezone)` wykorzystujący `useQuery` z TanStack Query dla trzech endpointów.
11. Skonfiguruj `refetchInterval: 60_000` i `staleTime: 30_000` dla automatycznego odświeżania.
12. Zaimplementuj funkcję `refetch()` wywołującą wszystkie query jednocześnie.
13. Dodaj obsługę stanów: `isLoading`, `isRefreshing`, `error`.

### Faza 4: Komponenty prezentacyjne niskiego poziomu (3-4h)

14. Utwórz katalog `src/components/dashboard/`.
15. Zaimplementuj komponenty atomowe:
    - `RiskBadge.tsx` – badge poziomu ryzyka z wariantami kolorystycznymi (WCAG compliant).
    - `MetricCard.tsx` – karta pojedynczej metryki z opcjonalną ikoną.
    - `ConnectionBadge.tsx` – badge statusu połączenia.
    - `LastUpdateIndicator.tsx` – wskaźnik czasu ostatniej aktualizacji z ARIA live.
    - `RefreshButton.tsx` – przycisk odświeżania z debouncing.
16. Dodaj testy jednostkowe dla `RiskBadge` (snapshot + propsy).

### Faza 5: Komponenty tabeli i kart raportów (3-4h)

17. Zaimplementuj komponenty dla raportów:
    - `ReportRow.tsx` – wiersz tabeli desktop.
    - `ReportCard.tsx` – karta mobile.
    - `ReportsTable.tsx` – tabela raportów (wykorzystuje `ReportRow`).
    - `ReportCards.tsx` – lista kart (wykorzystuje `ReportCard`).
    - `TodayReportsSection.tsx` – sekcja z logiką responsywną (pokazuje tabelę lub karty).
18. Dodaj obsługę kliknięcia (`onReportClick`) z nawigacją do `/reports/[uuid]`.
19. Dodaj stany puste („Brak raportów na dzisiaj").

### Faza 6: Komponenty metryk i pending drivers (2-3h)

20. Zaimplementuj komponenty:
    - `RiskBreakdownCard.tsx` – karta z 4 badge'ami ryzyka i liczbami.
    - `MetricsCardsGrid.tsx` – grid 4 kart metryk.
    - `PendingDriverCard.tsx` – karta pojedynczego pending driver.
    - `PendingDriversList.tsx` – grid kart pending drivers.
    - `PendingDriversSection.tsx` – sekcja z nagłówkiem i listą.
21. Dodaj logikę kliknięcia w pending driver card (nawigacja do profilu).
22. Dodaj stan pusty („Wszyscy kierowcy wysłali raporty!").

### Faza 7: Nagłówek dashboardu (1h)

23. Zaimplementuj `DashboardHeader.tsx`:
    - Tytuł „Dashboard – Dzisiaj".
    - `LastUpdateIndicator`.
    - `RefreshButton`.
24. Podłącz callback `onRefresh` do `useDashboard`.

### Faza 8: Główny komponent `DashboardView` (2-3h)

25. Utwórz `src/components/dashboard/DashboardView.tsx`.
26. Zintegruj hook `useDashboard(timezone)`.
27. Zaimplementuj logikę renderowania:
    - `isLoading` → `LoadingSkeletons`.
    - `error` → komunikat błędu + przycisk retry.
    - `data` → pełny widok (header, metryki, raporty, pending).
28. Dodaj `ConnectionBadge` w dolnym prawym rogu (fixed position).
29. Dodaj ARIA landmarks (`main`, `section`, `article`) dla dostępności.

### Faza 9: Skeletony ładowania (1h)

30. Utwórz `LoadingSkeletons.tsx` z szkieletami:
    - Skeleton grid metryk (4 prostokąty).
    - Skeleton tabeli raportów (5-10 wierszy).
    - Skeleton listy pending drivers (3-5 kart).
31. Wykorzystaj komponent `Skeleton` z shadcn/ui.

### Faza 10: Strona Astro `/dashboard` (1h)

32. Utwórz plik `src/pages/dashboard.astro`.
33. Użyj `AuthenticatedLayout.astro` jako layout.
34. Osadź komponent `DashboardView` jako React island z `client:load`.
35. Opcjonalnie: pobierz dane po stronie serwera (SSR) i przekaż jako `initialSummary`, `initialReports` do `DashboardView` dla szybszego first paint (hydration).

### Faza 11: Integracja z nawigacją (1h)

36. Upewnij się, że `AuthenticatedLayout.astro` ma link do `/dashboard` w nawigacji jako pierwszy element.
37. Po zalogowaniu w `/signin` przekieruj użytkownika do `/dashboard` (logika w `SignInFormCard.tsx`).
38. Dodaj highlight dla aktywnej trasy w sidebar/nav.

### Faza 12: Stylowanie i responsywność (2-3h)

39. Zastosuj klasy Tailwind do wszystkich komponentów zgodnie z design system.
40. Upewnij się, że widok działa poprawnie na:
    - Desktop (≥1024px): tabela raportów, 4 kolumny metryk.
    - Tablet (768-1023px): 2 kolumny metryk, tabela z przewijaniem.
    - Mobile (<768px): 1 kolumna metryk, karty raportów zamiast tabeli.
41. Przetestuj kontrast kolorów dla poziomów ryzyka (WCAG AA).
42. Dodaj hover/focus states dla interaktywnych elementów.

### Faza 13: Dostępność (A11y) (2h)

43. Dodaj ARIA labels:
    - `aria-live="polite"` dla `LastUpdateIndicator`.
    - `aria-label` dla `RefreshButton` („Odśwież dane dashboardu").
    - `role="status"` dla komunikatów ładowania/błędów.
44. Upewnij się, że wszystkie interaktywne elementy są dostępne z klawiatury (tab order).
45. Przetestuj z czytnikiem ekranu (VoiceOver/NVDA).
46. Sprawdź kontrast kolorów badge'y ryzyka (używając narzędzia jak Contrast Checker).

### Faza 14: Obsługa błędów i edge cases (2h)

47. Dodaj toasty dla komunikatów błędów (Sonner).
48. Zaimplementuj fallback UI w `ErrorBoundary` dla błędów renderowania.
49. Przetestuj scenariusze:
    - Brak połączenia internetowego (offline).
    - API zwraca 500.
    - API zwraca 401 (sesja wygasła).
    - Brak danych (wszystkie listy puste).
    - API zwraca nieprawidłowe dane (błąd parsowania).

### Faza 15: Testy jednostkowe (3-4h)

50. Utwórz testy dla kluczowych komponentów:
    - `RiskBadge.test.tsx` – renderowanie z różnymi poziomami ryzyka.
    - `MetricCard.test.tsx` – renderowanie z wartościami, ikonami.
    - `DashboardView.test.tsx` – renderowanie z mockami `useDashboard`.
    - `useDashboard.test.tsx` – testowanie hooka z mockami TanStack Query.
51. Uruchom testy: `npm test`.

### Faza 16: Testy E2E (opcjonalnie, 2-3h)

52. Utwórz test E2E (Playwright/Cypress):
    - Zaloguj się → przejdź do `/dashboard`.
    - Sprawdź, czy metryki się wyświetlają.
    - Kliknij „Odśwież" → sprawdź, czy dane się aktualizują.
    - Kliknij w raport → sprawdź nawigację do szczegółów.
    - Sprawdź responsywność (mobile viewport).

### Faza 17: Optymalizacja wydajności (1-2h)

53. Zmierz czas ładowania dashboardu (Lighthouse, Core Web Vitals).
54. Zoptymalizuj bundle size (lazy loading komponentów, code splitting).
55. Upewnij się, że SSR działa poprawnie (dane prefetchowane po stronie serwera).
56. Sprawdź, czy obrazy/ikony są optymalizowane (webp, lazy loading).

### Faza 18: Dokumentacja (1h)

57. Dodaj komentarze JSDoc do kluczowych funkcji i typów.
58. Zaktualizuj plik `.ai/dashboard-view-implementation-plan.md` z rzeczywistymi decyzjami implementacyjnymi (jeśli były zmiany).
59. Dodaj README w `src/components/dashboard/` z opisem struktury komponentów.

### Faza 19: Code review i refactoring (1-2h)

60. Przejrzyj kod pod kątem:
    - Zgodności z workspace rules (early returns, error handling, guard clauses).
    - DRY (unikanie duplikacji).
    - Nazewnictwa (czytelne, konsekwentne).
61. Uruchom linter: `npm run lint`.
62. Napraw wszystkie linter errors/warnings.

### Faza 20: Wdrożenie i monitoring (1h)

63. Zmerguj branch z dashboardem do `main`.
64. Wdróż na staging i przeprowadź smoke test.
65. Wdróż na production.
66. Monitoruj logi błędów (Sentry) i metryki wydajności (analytics).
67. Zbierz feedback od użytkowników po pierwszym tygodniu użytkowania.

---

**Szacowany całkowity czas implementacji**: 35-50 godzin (w zależności od doświadczenia programisty i dostępności komponentów z shadcn/ui).

**Priorytety**:
- **Fazy 1-8**: Krytyczne – implementacja core functionality.
- **Fazy 9-12**: Wysokie – UX, responsywność, integracja.
- **Fazy 13-15**: Średnie – A11y, testy, obsługa błędów.
- **Fazy 16-20**: Niskie (nice-to-have) – E2E, optymalizacje, dokumentacja.

**Zależności**:
- AuthenticatedLayout musi być już zaimplementowany.
- Shadcn/ui komponenty (Card, Badge, Table, Button, Skeleton) muszą być zainstalowane.
- TanStack Query musi być skonfigurowany w projekcie.
- Supabase client musi być dostępny z helperami do pobierania tokenu JWT.


