# Plan implementacji widoku Raportów (`/reports`)

## 1. Przegląd

Widok Raportów to centralne miejsce dla spedytora do przeglądania, analizowania i zarządzania historią tras. Umożliwia filtrowanie raportów (z ostatnich 7 dni i starszych), wgląd w szczegóły analizy AI, ręczne dodawanie/edycję raportów oraz eksport danych do CSV. Widok musi obsługiwać zarówno desktop (tabela), jak i mobile (karty).

## 2. Routing widoku

- **Ścieżka:** `/reports`
- **Plik Astro:** `src/pages/reports.astro`
- **Główny komponent React:** `src/components/reports/ReportsView.tsx`

## 3. Struktura komponentów

```text
src/pages/reports.astro (Layout + Auth Guard)
└── ReportsView.tsx (Provider stanu i danych)
    ├── ReportsHeader.tsx (Tytuł, Przyciski: "Eksportuj", "Dodaj raport")
    ├── ReportsFilterBar.tsx (Pasek filtrów)
    │   ├── SearchInput.tsx (Szukanie tekstowe)
    │   ├── DateRangePicker.tsx (Wybór dat od-do)
    │   ├── ReportsFacetedFilter.tsx (Dropdowny: Kierowca, Ryzyko, Status)
    │   └── ActiveFiltersList.tsx (Lista chipów z możliwością usuwania)
    ├── ReportsContent.tsx (Kontener listy)
    │   ├── ReportsTable.tsx (Widok Desktop - Shadcn Table)
    │   │   └── ReportRow.tsx
    │   ├── ReportsMobileList.tsx (Widok Mobile - Lista kart)
    │   │   └── ReportCard.tsx
    │   └── PaginationTrigger.tsx (Przycisk "Załaduj więcej" / Infinite Scroll)
    ├── ReportDetailSheet.tsx (Panel boczny ze szczegółami)
    │   ├── ReportSummaryHeader.tsx
    │   ├── AITimeline.tsx
    │   └── ReportMetadata.tsx
    ├── ReportFormDialog.tsx (Modal dodawania/edycji)
    │   └── ReportForm.tsx (Formularz React Hook Form)
    └── ExportCsvDialog.tsx (Modal konfiguracji eksportu)
```

## 4. Szczegóły komponentów

### `ReportsView`

- **Opis:** Główny kontener (Smart Component). Inicjuje `QueryClient`, zarządza stanem filtrów (synchronizacja z URL) i przekazuje dane do komponentów podrzędnych.
- **Główne elementy:** `QueryClientProvider`, `ReportsHeader`, `ReportsFilterBar`, `ReportsContent`.
- **Typy:** Brak propsów (top-level island).
- **Hooki:** `useReportsParams` (custom), `useReports` (query).

### `ReportsFilterBar`

- **Opis:** Zawiera wszystkie kontrolki filtrowania.
- **Główne elementy:** `Input` (Shadcn), `Popover` + `Calendar` (DateRangePicker), `Command` + `Popover` (MultiSelect dla kierowców/statusów).
- **Obsługiwane interakcje:**
  - Zmiana zakresu dat -> aktualizacja URL.
  - Wpisanie tekstu -> debounce 500ms -> aktualizacja URL.
  - Wybór statusu/ryzyka/kierowcy -> aktualizacja URL.
  - Reset filtrów.
- **Propsy:**
  - `filters`: `ReportsFiltersState`
  - `onFilterChange`: `(newFilters: Partial<ReportsFiltersState>) => void`

### `ReportsContent` / `ReportsTable` / `ReportsMobileList`

- **Opis:** Prezentacja danych. Na desktopie tabela, na mobile lista kart.
- **Główne elementy:** `Table` (Shadcn), `Card` (Shadcn), `Skeleton` (loading state).
- **Obsługiwane interakcje:**
  - Kliknięcie w wiersz/kartę -> Otwarcie `ReportDetailSheet`.
  - Kliknięcie "Załaduj więcej" -> Pobranie kolejnej strony (cursor pagination).
- **Typy:** Przyjmuje listę `ReportListItemDTO[]`.

### `ReportDetailSheet`

- **Opis:** Panel boczny (Sheet) wyświetlający pełne szczegóły raportu, w tym analizę AI i tagi.
- **Główne elementy:** `Sheet`, `Badge` (dla ryzyka), `Accordion` (dla sekcji szczegółowych), `Button` (Edytuj).
- **Propsy:**
  - `reportId`: `string | null`
  - `isOpen`: `boolean`
  - `onClose`: `() => void`
  - `onEdit`: `(report: ReportDetailDTO) => void`

### `ReportFormDialog`

- **Opis:** Modal do ręcznego tworzenia lub edycji raportu przez spedytora.
- **Główne elementy:** `Dialog`, `Form` (Shadcn/RHF), `Select` (Kierowca), `Textarea` (Opisy).
- **Obsługiwana walidacja (Zod):**
  - `driverUuid`: wymagany.
  - `reportDate`: wymagana, nie z przyszłości.
  - `delayReason`: wymagany, jeśli `delayMinutes > 0`.
  - `routeStatus`: "PARTIALLY_COMPLETED" wymaga komentarza w `nextDayBlockers` (lub dedykowanym polu, jeśli dodamy).
- **Propsy:**
  - `open`: `boolean`
  - `initialData?`: `ReportDetailDTO` (dla edycji)
  - `onOpenChange`: `(open: boolean) => void`

### `ExportCsvDialog`

- **Opis:** Modal pozwalający pobrać raporty jako plik CSV.
- **Główne elementy:** `Dialog`, `DateRangePicker`, `Checkbox` (opcje eksportu).
- **Warunki walidacji:**
  - Zakres dat jest obowiązkowy.
- **Propsy:** `open`, `onOpenChange`.

## 5. Typy

### ViewModel: `ReportsFiltersState`

Stan reprezentujący filtry w URL:

```typescript
interface ReportsFiltersState {
  from: string; // YYYY-MM-DD (domyślnie today)
  to: string; // YYYY-MM-DD (domyślnie today)
  q?: string;
  driverUuid?: string[];
  riskLevel?: ReportRiskLevel[];
  routeStatus?: ReportRouteStatus[];
  includeAi: boolean; // domyślnie true
}
```

### Schema Formularza: `ReportFormSchema`

Zod schema mapująca na `CreateReportCommand` / `UpdateReportCommand`:

- `driverUuid`: string (uuid)
- `reportDate`: date
- `timezone`: string (IANA)
- `routeStatus`: enum
- `delayMinutes`: number (min 0)
- `delayReason`: string (optional, unless delay > 0)
- `isProblem`: boolean
- `cargoDamageDescription`: string (optional)
- `vehicleDamageDescription`: string (optional)
- `nextDayBlockers`: string (optional)

## 6. Zarządzanie stanem

1.  **URL State:** Źródło prawdy dla filtrów. Użyjemy hooka `useSearchParams` (z biblioteki react-router lub natywnego API przeglądarki w połączeniu z `window.history.pushState`, aby nie przeładowywać strony Astro). Zalecane stworzenie custom hooka `useReportsFilters`, który parsuje URL do obiektu `ReportsFiltersState` i udostępnia funkcję `setFilter`.
2.  **Server State:** TanStack Query (`useInfiniteQuery` dla listy, `useQuery` dla szczegółów i słowników).
    - Key: `['reports', filters]`
    - StaleTime: 1 minuta (dane nie zmieniają się bardzo dynamicznie, chyba że nadejdzie nowy raport).
3.  **Local State:** Widoczność modali (`isFormOpen`, `isDetailsOpen`, `isExportOpen`).

## 7. Integracja API

### Pobieranie listy

- **Endpoint:** `GET /api/reports`
- **Params:** Mapowane z `ReportsFiltersState` + `cursor`.
- **Response:** `ReportsListResponseDTO` (zawiera `items` i `nextCursor`).

### Szczegóły

- **Endpoint:** `GET /api/reports/{uuid}`
- **Params:** `includeAi=true`, `includeTags=true`

### Tworzenie/Edycja

- **Create:** `POST /api/reports` (body: `CreateReportCommand`)
- **Update:** `PATCH /api/reports/{uuid}` (body: `UpdateReportCommand`)
- **Po sukcesie:** Inwalidacja klucza `['reports']` oraz `['reports', uuid]`.

### Słowniki (do filtrów i formularzy)

- `GET /api/drivers` (dla listy wyboru kierowcy)
- `GET /api/risk-tags` (opcjonalnie, jeśli formularz pozwala tagować ręcznie, choć wg PRD tagi nadaje AI).

## 8. Interakcje użytkownika

1.  **Filtrowanie:** Użytkownik zmienia datę "Od" -> URL się aktualizuje -> Query key się zmienia -> Tabela pokazuje loading -> Nowe dane.
2.  **Szukanie:** Użytkownik wpisuje "Kowalski" -> Czeka 500ms -> URL update `?q=Kowalski` -> Refetch.
3.  **Podgląd:** Klik w wiersz -> URL update (opcjonalnie `?viewReport=uuid` dla deep linkowania) lub state local -> Otwiera się Sheet.
4.  **Edycja:** W Sheet klik "Edytuj" -> Sheet zostaje (lub zamyka się), otwiera się Dialog z formularzem wypełnionym danymi. Zapis -> Toast "Zapisano" -> Dialog zamyka się -> Sheet odświeża dane.

## 9. Warunki i walidacja

- **Pusty stan:** Jeśli brak raportów dla filtrów -> Wyświetl komponent `EmptyState` z sugestią "Zmień filtry".
- **Brak połączenia:** Wyświetl `offline` badge (globalnie) i zablokuj akcje edycji/tworzenia (disabled buttons).
- **Walidacja biznesowa (Formularz):**
  - Nie można zapisać raportu "Ukończono" z opóźnieniem > 0 bez podania przyczyny.
  - Nie można wybrać daty z przyszłości.

## 10. Obsługa błędów

- **Błąd pobierania listy:** Wyświetl `ErrorState` w miejscu tabeli z przyciskiem "Spróbuj ponownie".
- **Błąd formularza (400/422):** Wyświetl błędy walidacji pod polami (obsługa przez React Hook Form).
- **Błąd 409 (Konflikt):** Jeśli próba utworzenia raportu dla tego samego kierowcy i daty -> Toast Error: "Raport dla tego kierowcy i daty już istnieje".
- **Błąd 500:** Globalny Toast Error "Wystąpił błąd serwera".

## 11. Kroki implementacji

1.  **Setup API & Types:**
    - Sprawdź/Utwórz funkcje w `src/lib/services/reportsService.ts` (getList, getById, create, update, export).
    - Zdefiniuj Schemy Zod w `src/lib/validation/reportSchema.ts`.

2.  **Podstawowe komponenty UI:**
    - Stwórz `ReportRiskBadge` (kolory zależne od poziomu).
    - Stwórz `ReportStatusBadge`.

3.  **Filtry i Stan:**
    - Zaimplementuj hook `useReportsParams`.
    - Stwórz komponent `ReportsFilterBar` i podłącz go do hooka.

4.  **Lista (Read-only):**
    - Zaimplementuj `ReportsTable` (desktop) i `ReportsMobileList` (mobile).
    - Stwórz główny widok `ReportsView` i podepnij pobieranie danych (`useInfiniteQuery`).

5.  **Szczegóły (Read-only):**
    - Zaimplementuj `ReportDetailSheet`.
    - Podepnij pobieranie pojedynczego raportu po ID.

6.  **Formularz (Write):**
    - Zaimplementuj `ReportFormDialog` z walidacją.
    - Podepnij mutacje `createReport` i `updateReport`.

7.  **Eksport:**
    - Zaimplementuj `ExportCsvDialog`.
    - Podepnij funkcję generującą link do pobrania.

8.  **Integracja i szlify:**
    - Dodaj obsługę błędów (Error Boundaries).
    - Dostosuj skeletony ładowania.
    - Sprawdź responsywność na mobile.
