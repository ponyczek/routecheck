# Plan implementacji widoku Pojazdy

## 1. Przegląd

Widok Pojazdy to moduł zarządzania flotą pojazdów w aplikacji RouteLog. Umożliwia spedytorom przeglądanie, dodawanie, edycję i usuwanie pojazdów (soft delete) z możliwością filtrowania, sortowania i paginacji. Widok jest oznaczony jako feature flag, co oznacza, że może być warunkowo dostępny w zależności od konfiguracji aplikacji. Implementacja wzorowana jest na widoku Kierowcy, zapewniając spójność UX i architektury.

Główne funkcjonalności:

- Lista pojazdów z filtrowaniem (wyszukiwarka tekstowa, status aktywności, usunięte)
- Sortowanie po numerze rejestracyjnym lub dacie utworzenia
- Paginacja cursorowa
- Dodawanie nowego pojazdu (numer rejestracyjny, VIN opcjonalny, status aktywności)
- Edycja istniejącego pojazdu
- Soft delete pojazdu z potwierdzeniem
- Responsywny design (tabela desktop, karty mobile)
- Walidacja unikalności numeru rejestracyjnego w ramach firmy

## 2. Routing widoku

- **Ścieżka główna:** `/vehicles`
- **Plik strony:** `src/pages/vehicles/index.astro`
- **Layout:** `AuthenticatedLayout` (wymaga uwierzytelnienia)
- **Feature flag:** Widok powinien być dostępny tylko gdy `FEATURE_FLAGS.SHOW_VEHICLES === true`
- **Guard:** Middleware automatycznie przekierowuje niezalogowanych użytkowników na `/signin`

Struktura plików:

```
src/
├── pages/
│   └── vehicles/
│       └── index.astro
├── components/
│   └── vehicles/
│       ├── VehiclesView.tsx
│       ├── VehiclesViewWithProvider.tsx
│       ├── VehiclesHeader.tsx
│       ├── VehiclesFiltersBar.tsx
│       ├── VehiclesTable.tsx
│       ├── VehicleRow.tsx
│       ├── VehiclesCardList.tsx
│       ├── VehicleCard.tsx
│       ├── AddEditVehicleModal.tsx
│       ├── VehicleForm.tsx
│       ├── DeleteConfirmationDialog.tsx
│       ├── RowActionsMenu.tsx
│       ├── StatusBadge.tsx
│       ├── LoadingSkeletons.tsx
│       ├── EmptyState.tsx
│       └── ErrorState.tsx
└── lib/
    └── vehicles/
        ├── index.ts
        ├── types.ts
        ├── queryKeys.ts
        ├── useVehiclesList.ts
        ├── useCreateVehicle.ts
        ├── useUpdateVehicle.ts
        ├── useDeleteVehicle.ts
        ├── useVehiclesFilters.ts
        ├── usePagination.ts
        ├── useDebouncedValue.ts
        └── validation.ts
```

## 3. Struktura komponentów

```
VehiclesView (główny orkestrator)
├── VehiclesHeader
│   ├── Title
│   └── AddButton
├── VehiclesFiltersBar
│   ├── SearchInput
│   ├── ActiveStatusFilter (Combobox)
│   ├── IncludeDeletedToggle
│   └── SortControls (Combobox)
├── Conditional Rendering:
│   ├── LoadingSkeletons (gdy isLoading)
│   ├── ErrorState (gdy isError)
│   ├── EmptyState (gdy brak wyników)
│   └── VehiclesContent (gdy dane dostępne)
│       ├── VehiclesTable (desktop >= 768px)
│       │   └── VehicleRow (x N)
│       │       ├── StatusBadge
│       │       ├── VehicleData
│       │       └── RowActionsMenu
│       │           ├── EditButton
│       │           ├── ToggleActiveButton
│       │           └── DeleteButton
│       └── VehiclesCardList (mobile < 768px)
│           └── VehicleCard (x N)
│               ├── StatusBadge
│               ├── VehicleData
│               └── ActionsMenu
├── PaginationControls
│   ├── PrevButton
│   ├── PageInfo
│   └── NextButton
└── Modals:
    ├── AddEditVehicleModal
    │   └── VehicleForm
    │       ├── RegistrationNumberInput
    │       ├── VinInput (opcjonalny)
    │       └── IsActiveSwitch
    └── DeleteConfirmationDialog
```

## 4. Szczegóły komponentów

### VehiclesView (src/components/vehicles/VehiclesView.tsx)

- **Opis komponentu:** Główny komponent widoku, który orkiestruje wszystkie elementy: filtry, pobieranie danych, paginację, modals i renderowanie odpowiedniego widoku (tabela/karty). Zarządza stanem modalów i koordynuje interakcje użytkownika.

- **Główne elementy:**
  - Hook `useVehiclesFilters` do zarządzania filtrami z synchronizacją URL
  - Hook `usePagination` do zarządzania paginacją cursorową
  - Hook `useVehiclesList` do pobierania danych z API
  - Hook `useMediaQuery` do wykrywania rozmiaru ekranu
  - State `modalState` do zarządzania otwartymi modalami
  - Conditional rendering: loading, error, empty, content
  - Handlers: `handleAddClick`, `handleEditClick`, `handleDeleteClick`, `handleToggleActiveClick`

- **Obsługiwane zdarzenia:**
  - `onAddClick` - otwarcie modalu dodawania
  - `onEditClick` - otwarcie modalu edycji z danymi pojazdu
  - `onDeleteClick` - otwarcie dialogu potwierdzenia usunięcia
  - `onToggleActiveClick` - przełączenie statusu aktywności pojazdu
  - `onFiltersChange` - aktualizacja filtrów z resetem paginacji
  - `onPaginationChange` - nawigacja między stronami

- **Obsługiwana walidacja:**
  - Sprawdzenie czy dane zostały załadowane przed renderowaniem
  - Walidacja parametrów query przed wysłaniem do API

- **Typy:**
  - `VehiclesFiltersState` (z `src/lib/vehicles/types.ts`)
  - `PaginationState` (z `src/lib/vehicles/types.ts`)
  - `ModalState` (z `src/lib/vehicles/types.ts`)
  - `VehicleDTO` (z `src/types.ts`)
  - `VehiclesListResponseDTO` (z `src/types.ts`)

- **Propsy:**
  - Brak (komponent główny, nie przyjmuje props)

### VehiclesHeader (src/components/vehicles/VehiclesHeader.tsx)

- **Opis komponentu:** Nagłówek widoku z tytułem strony i przyciskiem dodawania pojazdu. Wyświetla się na górze widoku, przed filtrami.

- **Główne elementy:**
  - `<h1>` z tytułem "Pojazdy"
  - `Button` z ikoną `Plus` i tekstem "Dodaj pojazd"
  - Opcjonalnie: liczba pojazdów (jeśli dostępna)

- **Obsługiwane zdarzenia:**
  - `onAddClick` - callback wywoływany przy kliknięciu przycisku dodawania

- **Obsługiwana walidacja:**
  - Brak (komponent prezentacyjny)

- **Typy:**
  - Brak dodatkowych typów

- **Propsy:**
  ```typescript
  interface VehiclesHeaderProps {
    onAddClick: () => void;
    totalCount?: number; // opcjonalna liczba pojazdów
  }
  ```

### VehiclesFiltersBar (src/components/vehicles/VehiclesFiltersBar.tsx)

- **Opis komponentu:** Pasek filtrów z wyszukiwarką, filtrem statusu aktywności, przełącznikiem "Pokaż usunięte" i kontrolami sortowania. Synchronizuje stan z URL query params.

- **Główne elementy:**
  - `Input` z ikoną wyszukiwania (debounced)
  - `Combobox` dla filtru statusu aktywności (Wszystkie/Aktywne/Nieaktywne)
  - `Switch` lub `Checkbox` dla "Pokaż usunięte"
  - `Combobox` dla sortowania (Pole: Numer rejestracyjny/Data utworzenia, Kierunek: Rosnąco/Malejąco)
  - Przycisk "Resetuj filtry" (opcjonalnie)

- **Obsługiwane zdarzenia:**
  - `onSearchChange` - zmiana wartości wyszukiwarki (debounced 300ms)
  - `onActiveStatusChange` - zmiana filtru statusu aktywności
  - `onIncludeDeletedChange` - zmiana przełącznika "Pokaż usunięte"
  - `onSortChange` - zmiana sortowania
  - `onReset` - reset wszystkich filtrów do wartości domyślnych

- **Obsługiwana walidacja:**
  - Walidacja wartości sortowania (tylko dozwolone wartości)
  - Walidacja wartości filtru statusu (tylko dozwolone wartości)

- **Typy:**
  - `VehiclesFiltersState` (z `src/lib/vehicles/types.ts`)

- **Propsy:**
  ```typescript
  interface VehiclesFiltersBarProps {
    filters: VehiclesFiltersState;
    onFiltersChange: (updates: Partial<VehiclesFiltersState>) => void;
    onReset: () => void;
  }
  ```

### VehiclesTable (src/components/vehicles/VehiclesTable.tsx)

- **Opis komponentu:** Tabela pojazdów dla widoku desktop (>= 768px). Wyświetla pojazdy w formie tabeli z kolumnami: Numer rejestracyjny, VIN, Status, Data utworzenia, Akcje.

- **Główne elementy:**
  - `<table>` z nagłówkami kolumn
  - `<thead>` z kolumnami: Numer rejestracyjny, VIN, Status, Data utworzenia, Akcje
  - `<tbody>` z wierszami `VehicleRow`
  - Opcjonalnie: `<tfoot>` z podsumowaniem

- **Obsługiwane zdarzenia:**
  - Delegowane do `VehicleRow` (edit, delete, toggle active)

- **Obsługiwana walidacja:**
  - Sprawdzenie czy lista pojazdów nie jest pusta przed renderowaniem

- **Typy:**
  - `VehicleDTO[]` (z `src/types.ts`)

- **Propsy:**
  ```typescript
  interface VehiclesTableProps {
    vehicles: VehicleDTO[];
    onEdit: (vehicle: VehicleDTO) => void;
    onDelete: (vehicle: VehicleDTO) => void;
    onToggleActive: (vehicle: VehicleDTO) => void;
  }
  ```

### VehicleRow (src/components/vehicles/VehicleRow.tsx)

- **Opis komponentu:** Pojedynczy wiersz tabeli pojazdu. Wyświetla dane pojazdu i menu akcji.

- **Główne elementy:**
  - `<tr>` z komórkami danych
  - Komórka z numerem rejestracyjnym (bold)
  - Komórka z VIN (lub "-" jeśli brak)
  - Komórka ze `StatusBadge`
  - Komórka z datą utworzenia (sformatowaną)
  - Komórka z `RowActionsMenu`

- **Obsługiwane zdarzenia:**
  - `onEdit` - kliknięcie "Edytuj"
  - `onDelete` - kliknięcie "Usuń"
  - `onToggleActive` - kliknięcie "Aktywuj/Dezaktywuj"

- **Obsługiwana walidacja:**
  - Brak (komponent prezentacyjny)

- **Typy:**
  - `VehicleDTO` (z `src/types.ts`)

- **Propsy:**
  ```typescript
  interface VehicleRowProps {
    vehicle: VehicleDTO;
    onEdit: (vehicle: VehicleDTO) => void;
    onDelete: (vehicle: VehicleDTO) => void;
    onToggleActive: (vehicle: VehicleDTO) => void;
  }
  ```

### VehiclesCardList (src/components/vehicles/VehiclesCardList.tsx)

- **Opis komponentu:** Lista kart pojazdów dla widoku mobile (< 768px). Wyświetla pojazdy w formie kart z pełnymi informacjami.

- **Główne elementy:**
  - `<div>` z klasą grid/flex
  - Komponenty `VehicleCard` dla każdego pojazdu

- **Obsługiwane zdarzenia:**
  - Delegowane do `VehicleCard`

- **Obsługiwana walidacja:**
  - Sprawdzenie czy lista pojazdów nie jest pusta

- **Typy:**
  - `VehicleDTO[]` (z `src/types.ts`)

- **Propsy:**
  ```typescript
  interface VehiclesCardListProps {
    vehicles: VehicleDTO[];
    onEdit: (vehicle: VehicleDTO) => void;
    onDelete: (vehicle: VehicleDTO) => void;
    onToggleActive: (vehicle: VehicleDTO) => void;
  }
  ```

### VehicleCard (src/components/vehicles/VehicleCard.tsx)

- **Opis komponentu:** Karta pojazdu dla widoku mobile. Wyświetla wszystkie dane pojazdu w formie karty z menu akcji.

- **Główne elementy:**
  - `<div>` z klasą card (Shadcn Card)
  - Nagłówek z numerem rejestracyjnym (bold)
  - Sekcja z VIN (jeśli dostępny)
  - `StatusBadge`
  - Data utworzenia
  - Menu akcji (dropdown)

- **Obsługiwane zdarzenia:**
  - `onEdit` - kliknięcie "Edytuj"
  - `onDelete` - kliknięcie "Usuń"
  - `onToggleActive` - kliknięcie "Aktywuj/Dezaktywuj"

- **Obsługiwana walidacja:**
  - Brak (komponent prezentacyjny)

- **Typy:**
  - `VehicleDTO` (z `src/types.ts`)

- **Propsy:**
  ```typescript
  interface VehicleCardProps {
    vehicle: VehicleDTO;
    onEdit: (vehicle: VehicleDTO) => void;
    onDelete: (vehicle: VehicleDTO) => void;
    onToggleActive: (vehicle: VehicleDTO) => void;
  }
  ```

### AddEditVehicleModal (src/components/vehicles/AddEditVehicleModal.tsx)

- **Opis komponentu:** Modal do dodawania i edycji pojazdu. Zawiera formularz z walidacją Zod i obsługuje optimistic updates.

- **Główne elementy:**
  - `Dialog` (Shadcn) z `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
  - `VehicleForm` z polami formularza
  - `DialogFooter` z przyciskami "Anuluj" i "Zapisz"
  - Spinner ładowania podczas submit

- **Obsługiwane zdarzenia:**
  - `onClose` - zamknięcie modalu (ESC, kliknięcie poza modal, przycisk Anuluj)
  - `onSubmit` - submit formularza (create lub update)
  - `onSuccess` - callback po udanym zapisie

- **Obsługiwana walidacja:**
  - Walidacja formularza przez Zod schema (z `src/lib/vehicles/validation.ts`)
  - Walidacja unikalności numeru rejestracyjnego (409 Conflict z API)
  - Wyświetlanie błędów walidacji pod polami

- **Typy:**
  - `VehicleFormData` (z `src/lib/vehicles/validation.ts`)
  - `VehicleDTO` (z `src/types.ts`)
  - `CreateVehicleCommand`, `UpdateVehicleCommand` (z `src/types.ts`)

- **Propsy:**
  ```typescript
  interface AddEditVehicleModalProps {
    isOpen: boolean;
    mode: "add" | "edit";
    vehicle?: VehicleDTO;
    onClose: () => void;
    onSuccess: () => void;
  }
  ```

### VehicleForm (src/components/vehicles/VehicleForm.tsx)

- **Opis komponentu:** Formularz pojazdu z React Hook Form i walidacją Zod. Zawiera pola: numer rejestracyjny (required), VIN (opcjonalny), status aktywności (switch).

- **Główne elementy:**
  - `<form>` z React Hook Form
  - `Input` dla numeru rejestracyjnego (required, minLength: 2, maxLength: 20)
  - `Input` dla VIN (opcjonalny, maxLength: 17, pattern dla formatu VIN)
  - `Switch` dla statusu aktywności
  - Komunikaty błędów walidacji pod każdym polem
  - Przycisk submit (ukryty, wywoływany przez modal)

- **Obsługiwane zdarzenia:**
  - `onSubmit` - submit formularza (walidacja + callback)
  - `onChange` - zmiana wartości pól (walidacja inline)

- **Obsługiwana walidacja:**
  - Numer rejestracyjny: required, minLength 2, maxLength 20, trim whitespace
  - VIN: opcjonalny, jeśli podany: maxLength 17, pattern validation (alfanumeryczny)
  - Status aktywności: boolean (domyślnie true)

- **Typy:**
  - `VehicleFormData` (z `src/lib/vehicles/validation.ts`)
  - Zod schema: `vehicleFormSchema` (z `src/lib/vehicles/validation.ts`)

- **Propsy:**
  ```typescript
  interface VehicleFormProps {
    defaultValues?: VehicleFormData;
    onSubmit: (data: VehicleFormData) => void | Promise<void>;
    isSubmitting?: boolean;
  }
  ```

### DeleteConfirmationDialog (src/components/vehicles/DeleteConfirmationDialog.tsx)

- **Opis komponentu:** Dialog potwierdzenia usunięcia pojazdu. Wyświetla ostrzeżenie i wymaga potwierdzenia przed wykonaniem soft delete.

- **Główne elementy:**
  - `AlertDialog` (Shadcn) z `AlertDialogContent`
  - `AlertDialogHeader` z tytułem i opisem
  - Informacja o zachowaniu historii raportów
  - Przyciski: "Anuluj" (secondary) i "Usuń" (destructive)
  - Spinner podczas usuwania

- **Obsługiwane zdarzenia:**
  - `onConfirm` - potwierdzenie usunięcia
  - `onCancel` - anulowanie (ESC, kliknięcie poza dialog, przycisk Anuluj)

- **Obsługiwana walidacja:**
  - Brak (komponent prezentacyjny)

- **Typy:**
  - `VehicleDTO` (z `src/types.ts`)

- **Propsy:**
  ```typescript
  interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    vehicle: VehicleDTO;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    isDeleting?: boolean;
  }
  ```

### RowActionsMenu (src/components/vehicles/RowActionsMenu.tsx)

- **Opis komponentu:** Menu akcji w wierszu tabeli/karcie pojazdu. Zawiera opcje: Edytuj, Aktywuj/Dezaktywuj, Usuń.

- **Główne elementy:**
  - `DropdownMenu` (Shadcn) z przyciskiem trigger (ikona trzech kropek)
  - `DropdownMenuContent` z opcjami:
    - "Edytuj" (ikona Edit)
    - "Aktywuj" / "Dezaktywuj" (ikona CheckCircle / XCircle)
    - Separator
    - "Usuń" (ikona Trash, destructive)

- **Obsługiwane zdarzenia:**
  - `onEdit` - kliknięcie "Edytuj"
  - `onToggleActive` - kliknięcie "Aktywuj/Dezaktywuj"
  - `onDelete` - kliknięcie "Usuń"

- **Obsługiwana walidacja:**
  - Brak (komponent prezentacyjny)

- **Typy:**
  - `VehicleDTO` (z `src/types.ts`)

- **Propsy:**
  ```typescript
  interface RowActionsMenuProps {
    vehicle: VehicleDTO;
    onEdit: (vehicle: VehicleDTO) => void;
    onToggleActive: (vehicle: VehicleDTO) => void;
    onDelete: (vehicle: VehicleDTO) => void;
  }
  ```

### StatusBadge (src/components/vehicles/StatusBadge.tsx)

- **Opis komponentu:** Badge wyświetlający status pojazdu (Aktywny/Nieaktywny/Usunięty) z odpowiednią kolorystyką.

- **Główne elementy:**
  - `Badge` (Shadcn) z klasami wariantu:
    - Aktywny: `default` (zielony)
    - Nieaktywny: `secondary` (szary)
    - Usunięty: `destructive` (czerwony)

- **Obsługiwane zdarzenia:**
  - Brak (komponent prezentacyjny)

- **Obsługiwana walidacja:**
  - Brak (komponent prezentacyjny)

- **Typy:**
  - `VehicleDTO` (z `src/types.ts`)

- **Propsy:**
  ```typescript
  interface StatusBadgeProps {
    vehicle: VehicleDTO;
  }
  ```

### LoadingSkeletons (src/components/vehicles/LoadingSkeletons.tsx)

- **Opis komponentu:** Skeletony ładowania dla tabeli i kart pojazdów. Wyświetlane podczas pobierania danych z API.

- **Główne elementy:**
  - Skeleton dla tabeli (desktop): wiersze z komórkami
  - Skeleton dla kart (mobile): karty z placeholderami

- **Obsługiwane zdarzenia:**
  - Brak (komponent prezentacyjny)

- **Obsługiwana walidacja:**
  - Brak (komponent prezentacyjny)

- **Typy:**
  - Brak dodatkowych typów

- **Propsy:**
  ```typescript
  interface LoadingSkeletonsProps {
    variant: "table" | "cards";
    count?: number; // domyślnie 5
  }
  ```

### EmptyState (src/components/vehicles/EmptyState.tsx)

- **Opis komponentu:** Stan pusty wyświetlany gdy brak pojazdów do wyświetlenia (po zastosowaniu filtrów lub gdy lista jest pusta).

- **Główne elementy:**
  - Ikona (Truck z lucide-react)
  - Tytuł: "Brak pojazdów"
  - Opis: "Nie znaleziono pojazdów spełniających kryteria wyszukiwania" (z filtrami) lub "Dodaj pierwszy pojazd, aby rozpocząć" (bez filtrów)
  - Przycisk "Dodaj pojazd" (jeśli brak filtrów)

- **Obsługiwane zdarzenia:**
  - `onAddClick` - kliknięcie "Dodaj pojazd"

- **Obsługiwana walidacja:**
  - Brak (komponent prezentacyjny)

- **Typy:**
  - Brak dodatkowych typów

- **Propsy:**
  ```typescript
  interface EmptyStateProps {
    hasFilters: boolean;
    onAddClick?: () => void;
  }
  ```

### ErrorState (src/components/vehicles/ErrorState.tsx)

- **Opis komponentu:** Stan błędu wyświetlany gdy wystąpi błąd podczas pobierania danych z API.

- **Główne elementy:**
  - Ikona błędu (AlertCircle z lucide-react)
  - Tytuł: "Wystąpił błąd"
  - Opis błędu (z API lub domyślny)
  - Przycisk "Spróbuj ponownie" (refetch)

- **Obsługiwane zdarzenia:**
  - `onRetry` - kliknięcie "Spróbuj ponownie"

- **Obsługiwana walidacja:**
  - Brak (komponent prezentacyjny)

- **Typy:**
  - `Error` lub obiekt z `message`

- **Propsy:**
  ```typescript
  interface ErrorStateProps {
    error: Error | { message?: string };
    onRetry: () => void;
  }
  ```

## 5. Typy

### Typy z src/types.ts (już zdefiniowane)

#### VehicleDTO

```typescript
export type VehicleDTO = PickCamel<
  Tables<"vehicles">,
  "uuid" | "registration_number" | "vin" | "is_active" | "created_at" | "deleted_at"
>;
```

- `uuid: Uuid` - unikalny identyfikator pojazdu
- `registrationNumber: string` - numer rejestracyjny pojazdu (unique w ramach firmy dla aktywnych)
- `vin: string | null` - numer VIN pojazdu (opcjonalny)
- `isActive: boolean` - status aktywności pojazdu
- `createdAt: IsoDateString` - data utworzenia rekordu
- `deletedAt: IsoDateString | null` - data soft delete (null jeśli aktywny)

#### CreateVehicleCommand

```typescript
export type CreateVehicleCommand = PickCamel<TablesInsert<"vehicles">, "registration_number" | "vin" | "is_active">;
```

- `registrationNumber: string` - numer rejestracyjny (required)
- `vin: string | null` - numer VIN (opcjonalny)
- `isActive: boolean` - status aktywności (domyślnie true)

#### UpdateVehicleCommand

```typescript
export type UpdateVehicleCommand = Partial<CreateVehicleCommand>;
```

- Częściowa aktualizacja pól pojazdu

#### VehiclesListResponseDTO

```typescript
export type VehiclesListResponseDTO = Paginated<VehicleDTO>;
```

- `items: VehicleDTO[]` - lista pojazdów
- `nextCursor: string | null` - cursor następnej strony (null jeśli ostatnia)

### Nowe typy w src/lib/vehicles/types.ts

#### VehiclesFiltersState

```typescript
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
```

#### defaultFilters

```typescript
export const defaultFilters: VehiclesFiltersState = {
  q: "",
  isActive: undefined,
  includeDeleted: false,
  sortBy: "registrationNumber",
  sortDir: "asc",
};
```

#### ModalState

```typescript
export type ModalState =
  | { type: null }
  | { type: "add" }
  | { type: "edit"; vehicle: VehicleDTO }
  | { type: "delete"; vehicle: VehicleDTO };
```

#### VehicleFormData

```typescript
export interface VehicleFormData {
  registrationNumber: string;
  vin: string | null;
  isActive: boolean;
}
```

#### PaginationState

```typescript
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
```

#### VehiclesQueryParams

```typescript
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
```

## 6. Zarządzanie stanem

### TanStack Query (React Query)

Widok używa TanStack Query do zarządzania stanem serwera i cache'owania danych:

1. **useVehiclesList** - hook do pobierania listy pojazdów
   - Query key: `['vehicles', 'list', params]`
   - Stale time: 30 sekund
   - Refetch interval: 60 sekund (auto-refresh)
   - Refetch on window focus: true
   - Retry: 2 razy przy błędzie

2. **useCreateVehicle** - mutation do tworzenia pojazdu
   - Invaliduje query `['vehicles', 'list']` po sukcesie
   - Optimistic update: dodaje pojazd do cache przed odpowiedzią API
   - Rollback przy błędzie

3. **useUpdateVehicle** - mutation do aktualizacji pojazdu
   - Invaliduje query `['vehicles', 'list']` i `['vehicles', uuid]` po sukcesie
   - Optimistic update: aktualizuje pojazd w cache

4. **useDeleteVehicle** - mutation do usuwania pojazdu
   - Invaliduje query `['vehicles', 'list']` po sukcesie
   - Optimistic update: usuwa pojazd z cache (lub oznacza jako deleted)

### Lokalny stan komponentów

1. **Filtry** - zarządzane przez `useVehiclesFilters`
   - Synchronizacja z URL query params
   - Debounce dla wyszukiwarki (300ms)
   - Reset paginacji przy zmianie filtrów (oprócz cursor)

2. **Paginacja** - zarządzana przez `usePagination`
   - Stack kursorów poprzednich stron
   - Aktualny cursor
   - Flagi hasNext/hasPrev

3. **Modals** - zarządzane przez `useState<ModalState>`
   - Stan: null, 'add', 'edit', 'delete'
   - Reset przy zamknięciu modalu

4. **Responsive** - wykrywanie rozmiaru ekranu przez `useMediaQuery`
   - Desktop: >= 768px (tabela)
   - Mobile: < 768px (karty)

### Custom hooki

1. **useVehiclesFilters** - zarządzanie filtrami z synchronizacją URL

   ```typescript
   function useVehiclesFilters(): {
     filters: VehiclesFiltersState;
     updateFilters: (updates: Partial<VehiclesFiltersState>) => void;
     resetFilters: () => void;
   };
   ```

2. **usePagination** - zarządzanie paginacją cursorową

   ```typescript
   function usePagination(): {
     currentCursor: string | undefined;
     goToNext: () => void;
     goToPrev: () => void;
     hasNext: boolean;
     hasPrev: boolean;
     reset: () => void;
   };
   ```

3. **useDebouncedValue** - debounce wartości (dla wyszukiwarki)
   ```typescript
   function useDebouncedValue<T>(value: T, delay: number): T;
   ```

## 7. Integracja API

### Endpointy API

#### GET /api/vehicles

- **Opis:** Lista pojazdów z filtrowaniem, sortowaniem i paginacją
- **Query params:**
  - `q?: string` - wyszukiwarka tekstowa (numer rejestracyjny, VIN)
  - `isActive?: boolean` - filtr statusu aktywności
  - `includeDeleted?: boolean` - czy zawierać usunięte (default: false)
  - `limit?: number` - limit wyników (default: 20)
  - `cursor?: string` - cursor paginacji
  - `sortBy?: 'registrationNumber' | 'createdAt'` - pole sortowania
  - `sortDir?: 'asc' | 'desc'` - kierunek sortowania
- **Response:** `VehiclesListResponseDTO` (200)
- **Errors:**
  - 401 Unauthorized - brak sesji
  - 500 Internal Server Error - błąd serwera

#### POST /api/vehicles

- **Opis:** Utworzenie nowego pojazdu
- **Body:** `CreateVehicleCommand`
  ```json
  {
    "registrationNumber": "ABC1234",
    "vin": "1HGBH41JXMN109186",
    "isActive": true
  }
  ```
- **Response:** `VehicleDTO` (201)
- **Errors:**
  - 400 Validation Error - błąd walidacji
  - 409 Conflict - duplikat numeru rejestracyjnego w ramach firmy (aktywny pojazd)
  - 401 Unauthorized - brak sesji

#### GET /api/vehicles/{uuid}

- **Opis:** Szczegóły pojedynczego pojazdu
- **Response:** `VehicleDTO` (200)
- **Errors:**
  - 404 Not Found - pojazd nie istnieje
  - 401 Unauthorized - brak sesji

#### PATCH /api/vehicles/{uuid}

- **Opis:** Aktualizacja pojazdu
- **Body:** `UpdateVehicleCommand` (partial)
- **Response:** `VehicleDTO` (200)
- **Errors:**
  - 400 Validation Error - błąd walidacji
  - 409 Conflict - duplikat numeru rejestracyjnego (jeśli zmieniono na istniejący)
  - 404 Not Found - pojazd nie istnieje
  - 401 Unauthorized - brak sesji

#### DELETE /api/vehicles/{uuid}

- **Opis:** Soft delete pojazdu (ustawia `deleted_at` i `is_active=false`)
- **Response:** 204 No Content
- **Errors:**
  - 404 Not Found - pojazd nie istnieje
  - 401 Unauthorized - brak sesji
  - 500 Internal Server Error - błąd serwera

### Serwis API (src/lib/services/vehiclesService.ts)

```typescript
export const vehiclesService = {
  async list(params: VehiclesQueryParams): Promise<VehiclesListResponseDTO>,
  async create(data: CreateVehicleCommand): Promise<VehicleDTO>,
  async get(uuid: string): Promise<VehicleDTO>,
  async update(uuid: string, data: UpdateVehicleCommand): Promise<VehicleDTO>,
  async delete(uuid: string): Promise<void>,
};
```

### Obsługa błędów API

1. **409 Conflict** - duplikat numeru rejestracyjnego
   - Wyświetlenie błędu pod polem "Numer rejestracyjny" w formularzu
   - Toast: "Pojazd o tym numerze rejestracyjnym już istnieje"

2. **400 Validation Error** - błąd walidacji
   - Wyświetlenie błędów walidacji pod odpowiednimi polami
   - Toast: "Sprawdź poprawność wprowadzonych danych"

3. **401 Unauthorized** - brak sesji
   - Automatyczne przekierowanie na `/signin` (obsługiwane przez middleware)

4. **404 Not Found** - pojazd nie istnieje
   - Toast: "Pojazd nie został znaleziony"
   - Powrót do listy pojazdów

5. **500 Internal Server Error** - błąd serwera
   - Toast: "Wystąpił błąd serwera. Spróbuj ponownie."
   - Przycisk retry w ErrorState

## 8. Interakcje użytkownika

### Dodawanie pojazdu

1. Użytkownik klika przycisk "Dodaj pojazd" w nagłówku
2. Otwiera się modal `AddEditVehicleModal` w trybie 'add'
3. Użytkownik wypełnia formularz:
   - Numer rejestracyjny (required)
   - VIN (opcjonalny)
   - Status aktywności (domyślnie aktywny)
4. Użytkownik klika "Zapisz"
5. Formularz waliduje dane (Zod)
6. Jeśli walidacja OK, wysyłane jest żądanie POST /api/vehicles
7. Po sukcesie:
   - Modal się zamyka
   - Lista pojazdów odświeża się (invalidate query)
   - Toast: "Pojazd został dodany pomyślnie"
8. Jeśli błąd 409:
   - Błąd wyświetlany pod polem "Numer rejestracyjny"
   - Toast: "Pojazd o tym numerze rejestracyjnym już istnieje"
   - Modal pozostaje otwarty

### Edycja pojazdu

1. Użytkownik klika "Edytuj" w menu akcji pojazdu
2. Otwiera się modal `AddEditVehicleModal` w trybie 'edit' z danymi pojazdu
3. Użytkownik modyfikuje dane w formularzu
4. Użytkownik klika "Zapisz"
5. Formularz waliduje dane
6. Jeśli walidacja OK, wysyłane jest żądanie PATCH /api/vehicles/{uuid}
7. Po sukcesie:
   - Modal się zamyka
   - Lista pojazdów odświeża się (optimistic update + invalidate)
   - Toast: "Pojazd został zaktualizowany pomyślnie"
8. Jeśli błąd 409:
   - Błąd wyświetlany pod polem "Numer rejestracyjny"
   - Toast: "Pojazd o tym numerze rejestracyjnym już istnieje"

### Usuwanie pojazdu

1. Użytkownik klika "Usuń" w menu akcji pojazdu
2. Otwiera się dialog `DeleteConfirmationDialog`
3. Dialog wyświetla:
   - Tytuł: "Usunąć pojazd {numer rejestracyjny}?"
   - Opis: "Ta operacja oznaczy pojazd jako usunięty. Historia raportów zostanie zachowana."
4. Użytkownik klika "Usuń" w dialogu
5. Wysyłane jest żądanie DELETE /api/vehicles/{uuid}
6. Po sukcesie:
   - Dialog się zamyka
   - Lista pojazdów odświeża się (optimistic update + invalidate)
   - Toast: "Pojazd został usunięty"
7. Jeśli błąd:
   - Toast: "Nie udało się usunąć pojazdu. Spróbuj ponownie."
   - Dialog pozostaje otwarty

### Przełączanie statusu aktywności

1. Użytkownik klika "Aktywuj" / "Dezaktywuj" w menu akcji pojazdu
2. Wysyłane jest żądanie PATCH /api/vehicles/{uuid} z `isActive: !vehicle.isActive`
3. Po sukcesie:
   - Lista pojazdów odświeża się (optimistic update)
   - Toast: "Status pojazdu został zmieniony"
4. Jeśli błąd:
   - Toast: "Nie udało się zmienić statusu pojazdu"

### Filtrowanie i wyszukiwanie

1. Użytkownik wpisuje tekst w polu wyszukiwarki
2. Wartość jest debounced (300ms)
3. Po zatrzymaniu wpisywania:
   - Filtry są aktualizowane
   - Paginacja resetuje się do pierwszej strony
   - Query jest wysyłane do API z parametrem `q`
4. Lista pojazdów odświeża się z wynikami wyszukiwania

### Sortowanie

1. Użytkownik wybiera pole sortowania w combobox (Numer rejestracyjny / Data utworzenia)
2. Użytkownik wybiera kierunek sortowania (Rosnąco / Malejąco)
3. Filtry są aktualizowane (`sortBy`, `sortDir`)
4. Paginacja resetuje się
5. Query jest wysyłane do API z parametrami sortowania
6. Lista pojazdów odświeża się z posortowanymi wynikami

### Paginacja

1. Użytkownik klika "Następna" / "Poprzednia" w kontrolkach paginacji
2. Cursor paginacji jest aktualizowany
3. Query jest wysyłane do API z parametrem `cursor`
4. Lista pojazdów odświeża się z wynikami dla wybranej strony

### Responsive switching

1. Użytkownik zmienia rozmiar okna przeglądarki
2. Hook `useMediaQuery` wykrywa zmianę (breakpoint 768px)
3. Komponent przełącza się między:
   - Desktop: `VehiclesTable` (tabela)
   - Mobile: `VehiclesCardList` (karty)

## 9. Warunki i walidacja

### Walidacja formularza (VehicleForm)

1. **Numer rejestracyjny:**
   - Required: "Numer rejestracyjny jest wymagany"
   - MinLength 2: "Numer rejestracyjny musi mieć co najmniej 2 znaki"
   - MaxLength 20: "Numer rejestracyjny nie może przekraczać 20 znaków"
   - Trim whitespace przed walidacją

2. **VIN:**
   - Opcjonalny (może być null lub pusty string)
   - Jeśli podany:
     - MaxLength 17: "VIN nie może przekraczać 17 znaków"
     - Pattern: alfanumeryczny (opcjonalna walidacja formatu VIN)

3. **Status aktywności:**
   - Boolean (domyślnie true)
   - Brak walidacji (zawsze poprawna wartość)

### Walidacja API (409 Conflict)

1. **Duplikat numeru rejestracyjnego:**
   - Warunek: Istnieje aktywny pojazd z tym samym numerem rejestracyjnym w ramach firmy
   - Weryfikacja: API zwraca 409 Conflict z kodem "duplicate_registration_number"
   - Obsługa frontend:
     - Wyświetlenie błędu pod polem "Numer rejestracyjny"
     - Toast: "Pojazd o tym numerze rejestracyjnym już istnieje"
     - Modal pozostaje otwarty

### Warunki wyświetlania

1. **Loading state:**
   - Warunek: `isLoading === true`
   - Efekt: Wyświetlenie `LoadingSkeletons`

2. **Error state:**
   - Warunek: `isError === true`
   - Efekt: Wyświetlenie `ErrorState` z przyciskiem retry

3. **Empty state:**
   - Warunek: `data.items.length === 0` i `!isLoading`
   - Efekt: Wyświetlenie `EmptyState`
   - Różnica w komunikacie:
     - Z filtrami: "Nie znaleziono pojazdów spełniających kryteria wyszukiwania"
     - Bez filtrów: "Dodaj pierwszy pojazd, aby rozpocząć" + przycisk "Dodaj pojazd"

4. **Content state:**
   - Warunek: `data.items.length > 0` i `!isLoading` i `!isError`
   - Efekt: Wyświetlenie `VehiclesTable` (desktop) lub `VehiclesCardList` (mobile)

5. **Feature flag:**
   - Warunek: `FEATURE_FLAGS.SHOW_VEHICLES === false`
   - Efekt: Przekierowanie na `/dashboard` lub wyświetlenie banera "Moduł niedostępny"

### Warunki akcji

1. **Przycisk "Dodaj pojazd":**
   - Zawsze aktywny (jeśli feature flag włączony)

2. **Przycisk "Edytuj":**
   - Zawsze aktywny (jeśli pojazd istnieje)

3. **Przycisk "Usuń":**
   - Zawsze aktywny (jeśli pojazd istnieje)
   - Wymaga potwierdzenia w dialogu

4. **Przycisk "Aktywuj/Dezaktywuj":**
   - Zawsze aktywny (jeśli pojazd istnieje)
   - Tekst zależy od `vehicle.isActive`

5. **Przyciski paginacji:**
   - "Następna": aktywny gdy `hasNext === true`
   - "Poprzednia": aktywny gdy `hasPrev === true`

## 10. Obsługa błędów

### Błędy API

1. **400 Validation Error:**
   - Przyczyna: Błąd walidacji danych w formularzu
   - Obsługa:
     - Wyświetlenie błędów walidacji pod odpowiednimi polami formularza
     - Toast: "Sprawdź poprawność wprowadzonych danych"
     - Modal pozostaje otwarty

2. **401 Unauthorized:**
   - Przyczyna: Sesja wygasła, token nieprawidłowy
   - Obsługa:
     - Automatyczne przekierowanie na `/signin?returnTo=/vehicles` (obsługiwane przez middleware)
     - Toast: "Twoja sesja wygasła. Zaloguj się ponownie."

3. **404 Not Found:**
   - Przyczyna: Pojazd nie istnieje (przy GET/PATCH/DELETE)
   - Obsługa:
     - Toast: "Pojazd nie został znaleziony"
     - Powrót do listy pojazdów (jeśli w modalu edycji)
     - Modal/dialog się zamyka

4. **409 Conflict:**
   - Przyczyna: Duplikat numeru rejestracyjnego w ramach firmy (aktywny pojazd)
   - Obsługa:
     - Wyświetlenie błędu pod polem "Numer rejestracyjny" w formularzu
     - Toast: "Pojazd o tym numerze rejestracyjnym już istnieje"
     - Modal pozostaje otwarty
     - Użytkownik może poprawić numer rejestracyjny

5. **429 Rate Limited:**
   - Przyczyna: Zbyt wiele żądań w krótkim czasie
   - Obsługa:
     - Toast: "Zbyt wiele żądań. Spróbuj za chwilę."
     - Wyświetlenie czasu oczekiwania (jeśli dostępny w headerze `Retry-After`)

6. **500 Internal Server Error:**
   - Przyczyna: Błąd serwera, błąd bazy danych
   - Obsługa:
     - Toast: "Wystąpił błąd serwera. Spróbuj ponownie."
     - Przycisk retry w `ErrorState`
     - Logowanie błędu do telemetrii (jeśli włączone)

### Błędy sieciowe

1. **Network Error:**
   - Przyczyna: Brak połączenia z internetem, timeout
   - Obsługa:
     - Toast: "Brak połączenia z internetem"
     - Wyświetlenie `ErrorState` z przyciskiem retry
     - Automatyczny retry przy przywróceniu połączenia (refetch on reconnect)

2. **Timeout:**
   - Przyczyna: Żądanie przekroczyło limit czasu
   - Obsługa:
     - Toast: "Żądanie przekroczyło limit czasu. Spróbuj ponownie."
     - Przycisk retry

### Błędy walidacji formularza (Zod)

1. **Błędy pól:**
   - Przyczyna: Niepoprawne dane w formularzu
   - Obsługa:
     - Wyświetlenie błędów pod odpowiednimi polami
     - Podświetlenie pól z błędami (czerwona ramka)
     - Fokus na pierwszym polu z błędem
     - Blokada submit formularza

2. **Błędy typu:**
   - Przyczyna: Nieprawidłowy typ danych (np. string zamiast boolean)
   - Obsługa:
     - Automatyczna konwersja przez Zod (jeśli możliwa)
     - Lub wyświetlenie błędu walidacji

### Błędy renderowania (React Error Boundary)

1. **Błąd w drzewie komponentów:**
   - Przyczyna: Błąd JavaScript w komponencie
   - Obsługa:
     - ErrorBoundary przechwytuje błąd
     - Wyświetlenie fallback UI z komunikatem błędu
     - Przycisk "Spróbuj ponownie" (reload strony)
     - Logowanie błędu do konsoli i telemetrii

### Scenariusze brzegowe

1. **Równoczesna edycja:**
   - Scenariusz: Dwa użytkownicy edytują ten sam pojazd jednocześnie
   - Obsługa:
     - Ostatnia zmiana wygrywa (standardowe zachowanie API)
     - Toast: "Pojazd został zaktualizowany przez innego użytkownika"
     - Odświeżenie danych przed edycją

2. **Usunięcie podczas edycji:**
   - Scenariusz: Pojazd został usunięty podczas edycji w innym oknie
   - Obsługa:
     - 404 Not Found przy zapisie
     - Toast: "Pojazd został usunięty"
     - Modal się zamyka
     - Powrót do listy pojazdów

3. **Brak uprawnień:**
   - Scenariusz: Użytkownik nie ma uprawnień do modyfikacji pojazdów (przyszłe rozszerzenie)
   - Obsługa:
     - 403 Forbidden z API
     - Toast: "Brak uprawnień do wykonania tej operacji"
     - Ukrycie przycisków akcji (jeśli dostępne w przyszłości)

## 11. Kroki implementacji

### Faza 1: Przygotowanie struktury i typów

1. Utworzenie folderów:
   - `src/components/vehicles/`
   - `src/lib/vehicles/`
   - `src/pages/vehicles/`

2. Utworzenie plików typów:
   - `src/lib/vehicles/types.ts` - definicje typów lokalnych
   - `src/lib/vehicles/validation.ts` - schematy Zod i funkcje walidacji

3. Utworzenie plików serwisu API:
   - `src/lib/services/vehiclesService.ts` - funkcje komunikacji z API

4. Utworzenie plików query keys:
   - `src/lib/vehicles/queryKeys.ts` - klucze dla TanStack Query

### Faza 2: Implementacja hooków i logiki biznesowej

5. Implementacja hooków TanStack Query:
   - `src/lib/vehicles/useVehiclesList.ts` - hook do pobierania listy
   - `src/lib/vehicles/useCreateVehicle.ts` - mutation do tworzenia
   - `src/lib/vehicles/useUpdateVehicle.ts` - mutation do aktualizacji
   - `src/lib/vehicles/useDeleteVehicle.ts` - mutation do usuwania

6. Implementacja hooków pomocniczych:
   - `src/lib/vehicles/useVehiclesFilters.ts` - zarządzanie filtrami z URL
   - `src/lib/vehicles/usePagination.ts` - zarządzanie paginacją cursorową
   - `src/lib/vehicles/useDebouncedValue.ts` - debounce wartości (lub użycie istniejącego z drivers)

7. Implementacja walidacji:
   - `src/lib/vehicles/validation.ts` - schemat Zod dla formularza pojazdu

### Faza 3: Implementacja komponentów prezentacyjnych

8. Implementacja komponentów pomocniczych:
   - `src/components/vehicles/StatusBadge.tsx` - badge statusu
   - `src/components/vehicles/LoadingSkeletons.tsx` - skeletony ładowania
   - `src/components/vehicles/EmptyState.tsx` - stan pusty
   - `src/components/vehicles/ErrorState.tsx` - stan błędu

9. Implementacja komponentów formularza:
   - `src/components/vehicles/VehicleForm.tsx` - formularz z React Hook Form
   - `src/components/vehicles/AddEditVehicleModal.tsx` - modal dodawania/edycji
   - `src/components/vehicles/DeleteConfirmationDialog.tsx` - dialog potwierdzenia

10. Implementacja komponentów listy (desktop):
    - `src/components/vehicles/VehicleRow.tsx` - wiersz tabeli
    - `src/components/vehicles/RowActionsMenu.tsx` - menu akcji w wierszu
    - `src/components/vehicles/VehiclesTable.tsx` - tabela pojazdów

11. Implementacja komponentów listy (mobile):
    - `src/components/vehicles/VehicleCard.tsx` - karta pojazdu
    - `src/components/vehicles/VehiclesCardList.tsx` - lista kart

### Faza 4: Implementacja komponentów głównych

12. Implementacja komponentów nagłówka i filtrów:
    - `src/components/vehicles/VehiclesHeader.tsx` - nagłówek z przyciskiem dodawania
    - `src/components/vehicles/VehiclesFiltersBar.tsx` - pasek filtrów

13. Implementacja głównego komponentu widoku:
    - `src/components/vehicles/VehiclesView.tsx` - główny orkestrator
    - `src/components/vehicles/VehiclesViewWithProvider.tsx` - wrapper z QueryClientProvider

14. Implementacja strony Astro:
    - `src/pages/vehicles/index.astro` - strona z AuthenticatedLayout

### Faza 5: Integracja z nawigacją i feature flag

15. Aktualizacja nawigacji:
    - Dodanie linku "Pojazdy" do `DesktopSidebar` i `MobileLayout`
    - Sprawdzenie feature flag `SHOW_VEHICLES`
    - Wyświetlenie badge "Wkrótce" jeśli flag wyłączony

16. Implementacja feature flag:
    - Utworzenie pliku `src/lib/features/flags.ts` (jeśli nie istnieje)
    - Dodanie flagi `SHOW_VEHICLES`
    - Guard w `src/pages/vehicles/index.astro` - przekierowanie jeśli flag wyłączony

### Faza 6: Testy i optymalizacja

17. Testy manualne:
    - Test dodawania pojazdu (happy path)
    - Test edycji pojazdu
    - Test usuwania pojazdu
    - Test filtrowania i wyszukiwania
    - Test sortowania
    - Test paginacji
    - Test responsive (desktop/mobile)
    - Test obsługi błędów (409, 404, 500)
    - Test walidacji formularza

18. Optymalizacja:
    - Sprawdzenie performance (React DevTools Profiler)
    - Optymalizacja re-renderów (useMemo, useCallback)
    - Sprawdzenie bundle size
    - Optymalizacja obrazów/ikon

19. Accessibility (A11y):
    - Sprawdzenie ARIA labels
    - Test nawigacji klawiaturą
    - Test screen readera
    - Sprawdzenie kontrastu kolorów

20. Dokumentacja:
    - Aktualizacja README w folderze `src/components/vehicles/`
    - Komentarze w kodzie dla złożonych funkcji
    - Aktualizacja dokumentacji API (jeśli wymagana)

### Faza 7: Code review i merge

21. Code review:
    - Przegląd kodu przez innego developera
    - Sprawdzenie zgodności z konwencjami projektu
    - Sprawdzenie zgodności z PRD i UI plan

22. Merge do main:
    - Utworzenie pull request
    - Uruchomienie CI/CD pipeline
    - Merge po zatwierdzeniu

---

## Dodatkowe uwagi implementacyjne

### Icons (lucide-react)

- `Truck` - ikona pojazdu (w nagłówku, empty state)
- `Plus` - dodawanie pojazdu
- `Edit` - edycja
- `Trash` - usuwanie
- `CheckCircle` - aktywacja
- `XCircle` - dezaktywacja
- `Search` - wyszukiwarka
- `Filter` - filtry
- `SortAsc` / `SortDesc` - sortowanie
- `ChevronLeft` / `ChevronRight` - paginacja
- `MoreVertical` - menu akcji (trzy kropki)

### Kolory (Tailwind/Shadcn)

- Aktywny pojazd: `badge-default` (zielony)
- Nieaktywny pojazd: `badge-secondary` (szary)
- Usunięty pojazd: `badge-destructive` (czerwony)
- Przycisk dodawania: `button-primary`
- Przycisk usuwania: `button-destructive`
- Hover wiersza tabeli: `hover:bg-accent`

### Responsywność

- Mobile: `< 768px` - karty pojazdów
- Desktop: `>= 768px` - tabela pojazdów
- Breakpoint: `md:` (768px) w Tailwind

### Feature Flags

Dla modułu pojazdów:

```typescript
const FEATURE_FLAGS = {
  SHOW_VEHICLES: process.env.PUBLIC_SHOW_VEHICLES === "true" || false,
};
```

Guard w `src/pages/vehicles/index.astro`:

```astro
---
import { FEATURE_FLAGS } from "@/lib/features/flags";

if (!FEATURE_FLAGS.SHOW_VEHICLES) {
  return Astro.redirect("/dashboard");
}
---
```

### Performance Budget

- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3.5s
- Layout shift (CLS): < 0.1
- JavaScript bundle dla widoku pojazdów: < 100kb gzipped

### Wzorce do naśladowania

Widok pojazdów powinien być wzorowany na widoku kierowców (`src/components/drivers/`), zachowując:

- Spójną strukturę folderów
- Podobne wzorce komponentów
- Identyczne podejście do zarządzania stanem (TanStack Query)
- Te same konwencje nazewnictwa
- Podobny UX i flow użytkownika
