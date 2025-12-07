# Plan implementacji widoku Listy Kierowców

## 1. Przegląd

Widok Listy Kierowców (`/drivers`) to główny interfejs do zarządzania bazą kierowców w systemie RouteLog. Umożliwia spedytorom przeglądanie, wyszukiwanie, dodawanie, edycję i usuwanie kierowców. Widok jest zoptymalizowany pod kątem wydajności z paginacją cursorową, sortowaniem i filtrowaniem po stronie serwera. Responsywny interfejs dostosowuje się do urządzeń mobilnych, prezentując dane w formie kart zamiast tabeli. Wszystkie operacje CRUD są wykonywane z optimistic updates i odpowiednimi komunikatami toast. Widok obsługuje zarówno aktywnych, jak i usuniętych (soft delete) kierowców.

## 2. Routing widoku

**Ścieżka**: `/drivers`

**Plik**: `src/pages/drivers.astro`

**Layout**: `AuthenticatedLayout` – wymaga autoryzacji, automatyczne przekierowanie na `/signin` dla niezalogowanych użytkowników.

**Parametry URL** (synchronizacja stanu filtrów):
- `?q=<text>` – wyszukiwarka (debounced)
- `?isActive=true|false` – filtr statusu aktywności
- `?includeDeleted=true|false` – przełącznik wyświetlania usuniętych
- `?sortBy=name|createdAt` – pole sortowania
- `?sortDir=asc|desc` – kierunek sortowania
- `?cursor=<opaque>` – cursor paginacji

## 3. Struktura komponentów

```
DriversPage (Astro)
├── AuthenticatedLayout
│   └── DriversView (React)
│       ├── DriversHeader
│       │   ├── PageTitle
│       │   └── AddDriverButton
│       ├── DriversFiltersBar
│       │   ├── SearchInput
│       │   ├── ActiveFilterToggle
│       │   ├── ShowDeletedToggle
│       │   └── SortControls
│       ├── DriversTable (Desktop)
│       │   ├── TableHeader (sortable columns)
│       │   ├── DriverRow (multiple)
│       │   │   ├── DriverInfo
│       │   │   ├── StatusBadge
│       │   │   └── RowActionsMenu
│       │   │       ├── EditAction
│       │   │       ├── ToggleActiveAction
│       │   │       └── DeleteAction
│       │   └── TablePagination
│       ├── DriversCardList (Mobile)
│       │   ├── DriverCard (multiple)
│       │   │   ├── DriverCardHeader
│       │   │   ├── DriverCardBody
│       │   │   └── DriverCardActions
│       │   └── CardsPagination
│       ├── EmptyState
│       ├── LoadingSkeletons
│       ├── ErrorState
│       └── Modals
│           ├── AddEditDriverModal
│           │   ├── DriverForm
│           │   │   ├── NameInput
│           │   │   ├── EmailInput
│           │   │   ├── TimezoneCombobox
│           │   │   └── ActiveToggle
│           │   └── FormActions
│           └── DeleteConfirmationDialog
│               ├── WarningMessage
│               └── DialogActions
```

## 4. Szczegóły komponentów

### DriversView (główny kontener React)

**Opis**: Główny komponent odpowiedzialny za orkiestrację widoku, zarządzanie stanem filtrów, synchronizację z URL i renderowanie odpowiednich podkomponentów w zależności od stanu danych (loading, error, empty, success).

**Główne elementy**:
- `<div className="container mx-auto px-4 py-6">` – kontener główny
- `<DriversHeader />` – nagłówek z tytułem i przyciskiem dodawania
- `<DriversFiltersBar />` – pasek filtrów i wyszukiwania
- Warunkowe renderowanie: `<DriversTable />` (desktop) lub `<DriversCardList />` (mobile)
- `<LoadingSkeletons />` przy pierwszym ładowaniu
- `<ErrorState />` przy błędach
- `<EmptyState />` gdy brak wyników
- Modals: `<AddEditDriverModal />`, `<DeleteConfirmationDialog />`

**Obsługiwane interakcje**:
- Synchronizacja filtrów z URL (useSearchParams)
- Otwarcie modalu dodawania kierowcy
- Otwarcie modalu edycji kierowcy (przekazanie danych)
- Otwarcie dialogu potwierdzenia usunięcia
- Obsługa paginacji (next/prev)
- Auto-refetch co 60s (refetchInterval)

**Walidacja**: Brak bezpośredniej walidacji (delegowana do formularzy).

**Typy**:
- `DriversViewProps` (pusty lub z opcjonalnym initialFilters)
- `DriversFiltersState` (q, isActive, includeDeleted, sortBy, sortDir, cursor)
- `ModalState` (type: 'add' | 'edit' | 'delete' | null, data?: DriverDTO)

**Propsy**:
```typescript
interface DriversViewProps {
  // Opcjonalnie można przekazać initial data z Astro SSR
}
```

---

### DriversHeader

**Opis**: Nagłówek strony z tytułem widoku i głównym call-to-action przyciskiem dodawania nowego kierowcy.

**Główne elementy**:
- `<h1 className="text-2xl font-bold">Kierowcy</h1>`
- `<AddDriverButton />` – przycisk "+ Dodaj kierowcę"

**Obsługiwane interakcje**:
- Kliknięcie przycisku "Dodaj" wywołuje callback `onAddClick`

**Walidacja**: Brak.

**Typy**: Brak specjalnych typów.

**Propsy**:
```typescript
interface DriversHeaderProps {
  onAddClick: () => void;
}
```

---

### DriversFiltersBar

**Opis**: Pasek narzędzi zawierający kontrolki do filtrowania, wyszukiwania i sortowania listy kierowców. Wszystkie zmiany są synchronizowane z URL i wywołują refetch danych.

**Główne elementy**:
- `<SearchInput />` – pole tekstowe z ikoną lupy, debounce 300ms
- `<ActiveFilterToggle />` – radio group lub select: "Wszyscy" / "Aktywni" / "Nieaktywni"
- `<ShowDeletedToggle />` – checkbox "Pokaż usuniętych"
- `<SortControls />` – dropdown z opcjami sortowania (Nazwa A-Z, Nazwa Z-A, Najnowsi, Najstarsi)

**Obsługiwane interakcje**:
- Zmiana wartości w wyszukiwarce (debounced) → update URL param `q`
- Zmiana filtra aktywności → update URL param `isActive`
- Toggle "Pokaż usuniętych" → update URL param `includeDeleted`
- Zmiana sortowania → update URL params `sortBy` i `sortDir`

**Walidacja**:
- Wyszukiwarka: min. 2 znaki aby uruchomić filtrowanie (opcjonalnie)

**Typy**:
- `DriversFiltersState`
- `SortOption` (value, label)

**Propsy**:
```typescript
interface DriversFiltersBarProps {
  filters: DriversFiltersState;
  onFiltersChange: (filters: Partial<DriversFiltersState>) => void;
  resultsCount?: number; // opcjonalnie do wyświetlenia liczby wyników
}
```

---

### DriversTable (Desktop)

**Opis**: Tabela prezentująca listę kierowców z sortowalnymi kolumnami, widoczna tylko na urządzeniach desktop (≥768px). Wykorzystuje komponent `<Table>` z shadcn/ui.

**Główne elementy**:
- `<Table>` z shadcn/ui
- `<TableHeader>` z kolumnami: Imię, E-mail, Strefa czasowa, Status, Data dodania, Akcje
- `<TableBody>` z wierszami `<DriverRow />`
- `<TablePagination />` – przyciski Poprzednia/Następna strona

**Obsługiwane interakcje**:
- Kliknięcie nagłówka kolumny → zmiana sortowania
- Hover na wierszu → highlight
- Kliknięcie wiersza → otwarcie szczegółów (opcjonalnie)

**Walidacja**: Brak.

**Typy**:
- `DriverDTO[]`
- `PaginationState` (hasNext, hasPrev, cursor)

**Propsy**:
```typescript
interface DriversTableProps {
  drivers: DriverDTO[];
  sortBy: 'name' | 'createdAt';
  sortDir: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortDir: string) => void;
  onEditClick: (driver: DriverDTO) => void;
  onToggleActiveClick: (driver: DriverDTO) => void;
  onDeleteClick: (driver: DriverDTO) => void;
  pagination: {
    hasNext: boolean;
    hasPrev: boolean;
    onNext: () => void;
    onPrev: () => void;
  };
}
```

---

### DriverRow

**Opis**: Pojedynczy wiersz tabeli reprezentujący kierowcę. Zawiera podstawowe informacje oraz menu akcji.

**Główne elementy**:
- `<TableCell>` dla nazwy kierowcy
- `<TableCell>` dla e-maila
- `<TableCell>` dla strefy czasowej
- `<TableCell>` z `<StatusBadge />` (Aktywny/Nieaktywny)
- `<TableCell>` z datą dodania (sformatowaną)
- `<TableCell>` z `<RowActionsMenu />`

**Obsługiwane interakcje**:
- Hover → highlight
- Kliknięcie całego wiersza → opcjonalnie otwarcie szczegółów

**Walidacja**: Brak.

**Typy**:
- `DriverDTO`

**Propsy**:
```typescript
interface DriverRowProps {
  driver: DriverDTO;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}
```

---

### RowActionsMenu

**Opis**: Dropdown menu (z shadcn/ui `DropdownMenu`) z akcjami dla pojedynczego kierowcy. Ikona trzech kropek (⋮) otwiera menu z opcjami: Edytuj, Zmień status (Aktywuj/Dezaktywuj), Usuń.

**Główne elementy**:
- `<DropdownMenu>` z shadcn/ui
- `<DropdownMenuTrigger>` – przycisk z ikoną `MoreVertical`
- `<DropdownMenuContent>`:
  - `<DropdownMenuItem>` Edytuj (ikona: Edit)
  - `<DropdownMenuItem>` Aktywuj/Dezaktywuj (ikona: Power)
  - `<DropdownMenuSeparator />`
  - `<DropdownMenuItem>` Usuń (ikona: Trash, kolor czerwony)

**Obsługiwane interakcje**:
- Kliknięcie "Edytuj" → callback onEdit
- Kliknięcie "Aktywuj/Dezaktywuj" → callback onToggleActive
- Kliknięcie "Usuń" → callback onDelete

**Walidacja**: Brak (akcje są delegowane wyżej).

**Typy**: Brak specjalnych typów.

**Propsy**:
```typescript
interface RowActionsMenuProps {
  driver: DriverDTO;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}
```

---

### DriversCardList (Mobile)

**Opis**: Lista kart prezentująca kierowców na urządzeniach mobilnych (<768px). Każda karta zawiera kluczowe informacje i akcje.

**Główne elementy**:
- `<div className="grid gap-4">` – kontener kart
- Wiele komponentów `<DriverCard />`
- `<CardsPagination />` – przyciski paginacji

**Obsługiwane interakcje**:
- Kliknięcie karty → opcjonalnie otwarcie szczegółów
- Paginacja

**Walidacja**: Brak.

**Typy**:
- `DriverDTO[]`
- `PaginationState`

**Propsy**:
```typescript
interface DriversCardListProps {
  drivers: DriverDTO[];
  onEditClick: (driver: DriverDTO) => void;
  onToggleActiveClick: (driver: DriverDTO) => void;
  onDeleteClick: (driver: DriverDTO) => void;
  pagination: {
    hasNext: boolean;
    hasPrev: boolean;
    onNext: () => void;
    onPrev: () => void;
  };
}
```

---

### DriverCard

**Opis**: Karta przedstawiająca pojedynczego kierowcę na urządzeniach mobilnych. Zawiera avatar (inicjały), nazwę, email, strefę czasową, status i akcje.

**Główne elementy**:
- `<Card>` z shadcn/ui
- `<CardHeader>`:
  - `<Avatar>` z inicjałami
  - Nazwa kierowcy
  - `<StatusBadge />`
- `<CardContent>`:
  - Email (z ikoną)
  - Strefa czasowa (z ikoną)
  - Data dodania
- `<CardFooter>`:
  - Przyciski akcji: Edytuj, Aktywuj/Dezaktywuj, Usuń

**Obsługiwane interakcje**:
- Kliknięcie "Edytuj" → callback onEdit
- Kliknięcie "Aktywuj/Dezaktywuj" → callback onToggleActive
- Kliknięcie "Usuń" → callback onDelete

**Walidacja**: Brak.

**Typy**:
- `DriverDTO`

**Propsy**:
```typescript
interface DriverCardProps {
  driver: DriverDTO;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}
```

---

### StatusBadge

**Opis**: Komponent badge wyświetlający status aktywności kierowcy (Aktywny/Nieaktywny) z odpowiednim kolorem i ikoną.

**Główne elementy**:
- `<Badge>` z shadcn/ui
- Ikona statusu (Check dla aktywnego, X dla nieaktywnego)
- Tekst: "Aktywny" lub "Nieaktywny"

**Obsługiwane interakcje**: Brak (tylko prezentacja).

**Walidacja**: Brak.

**Typy**: `isActive: boolean`

**Propsy**:
```typescript
interface StatusBadgeProps {
  isActive: boolean;
  variant?: 'default' | 'compact'; // opcjonalnie różne rozmiary
}
```

---

### AddEditDriverModal

**Opis**: Modal (Dialog z shadcn/ui) służący zarówno do dodawania nowego kierowcy, jak i edycji istniejącego. Zawiera formularz z walidacją zbudowany z React Hook Form + Zod. W trybie edycji pola są wstępnie wypełnione danymi kierowcy.

**Główne elementy**:
- `<Dialog>` z shadcn/ui
- `<DialogContent>`:
  - `<DialogHeader>`:
    - `<DialogTitle>` – "Dodaj kierowcę" lub "Edytuj kierowcę"
    - `<DialogDescription>` – krótki opis
  - `<DriverForm />` – formularz
  - `<DialogFooter>`:
    - `<Button variant="outline">Anuluj</Button>`
    - `<Button type="submit">Zapisz</Button>` (loading spinner gdy mutation w toku)

**Obsługiwane interakcje**:
- Otwarcie/zamknięcie modalu
- Wypełnienie formularza
- Submit formularza → wywołanie mutation (POST lub PATCH)
- Anulowanie → zamknięcie modalu z potwierdzeniem jeśli formularz zmieniony (unsaved changes guard)

**Walidacja**:
- Wszystkie pola wymagane
- Email: format emaila, unikalne w ramach firmy (błąd 409 z API)
- Nazwa: min. 2 znaki, max. 100 znaków
- Strefa czasowa: wybór z listy IANA timezones
- Walidacja inline (onBlur) i przy submit

**Typy**:
- `DriverFormData` (model formularza)
- `CreateDriverCommand` | `UpdateDriverCommand`
- `DriverDTO` (w trybie edycji)

**Propsy**:
```typescript
interface AddEditDriverModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  driver?: DriverDTO; // required when mode='edit'
  onClose: () => void;
  onSuccess: () => void; // callback po udanym zapisie
}
```

---

### DriverForm

**Opis**: Formularz dodawania/edycji kierowcy zbudowany z React Hook Form i Zod schema. Zawiera pola: nazwa, email, strefa czasowa, status aktywności.

**Główne elementy**:
- `<Form>` provider z React Hook Form
- `<FormField name="name">`:
  - `<Label>Imię i nazwisko *</Label>`
  - `<Input />`
  - `<FormMessage />` – błędy walidacji
- `<FormField name="email">`:
  - `<Label>Adres e-mail *</Label>`
  - `<Input type="email" />`
  - `<FormMessage />`
- `<FormField name="timezone">`:
  - `<Label>Strefa czasowa *</Label>`
  - `<TimezoneCombobox />` – searchable combobox
  - `<FormMessage />`
- `<FormField name="isActive">`:
  - `<Label>Status</Label>`
  - `<Switch />` – toggle Aktywny/Nieaktywny
  - `<FormDescription>` – opis wpływu statusu

**Obsługiwane interakcje**:
- Wprowadzanie danych w pola
- Walidacja inline (onBlur)
- Submit formularza
- Obsługa błędów z API (setError)

**Walidacja** (Zod schema):
```typescript
const driverFormSchema = z.object({
  name: z.string()
    .min(2, "Imię musi mieć minimum 2 znaki")
    .max(100, "Imię może mieć maksymalnie 100 znaków"),
  email: z.string()
    .email("Nieprawidłowy format adresu e-mail")
    .max(255),
  timezone: z.string()
    .refine(val => isValidTimezone(val), "Nieprawidłowa strefa czasowa"),
  isActive: z.boolean().default(true)
});
```

**Warunki szczegółowe**:
- `name`: wymagane, 2-100 znaków
- `email`: wymagane, format email, unikalne (sprawdzane przez API, błąd 409)
- `timezone`: wymagane, musi być prawidłową strefą IANA (np. "Europe/Warsaw")
- `isActive`: boolean, domyślnie `true`

**Typy**:
- `DriverFormData` = `z.infer<typeof driverFormSchema>`
- `CreateDriverCommand` | `UpdateDriverCommand`

**Propsy**:
```typescript
interface DriverFormProps {
  defaultValues?: Partial<DriverFormData>;
  onSubmit: (data: DriverFormData) => Promise<void>;
  isSubmitting: boolean;
}
```

---

### TimezoneCombobox

**Opis**: Searchable combobox (Combobox z shadcn/ui) do wyboru strefy czasowej z listy IANA timezones. Wspiera wyszukiwanie i filtrowanie.

**Główne elementy**:
- `<Popover>` + `<Command>` z shadcn/ui
- `<CommandInput>` – pole wyszukiwania
- `<CommandList>`:
  - `<CommandEmpty>Nie znaleziono strefy czasowej</CommandEmpty>`
  - `<CommandGroup>`:
    - Multiple `<CommandItem>` dla każdej strefy czasowej

**Obsługiwane interakcje**:
- Wpisywanie w pole wyszukiwania → filtrowanie listy
- Wybór opcji → zamknięcie popover i ustawienie wartości
- Obsługa klawiatury (Arrow Up/Down, Enter, Escape)

**Walidacja**: Wartość musi być z listy dostępnych stref czasowych.

**Typy**:
- `TimezoneOption` (value, label, offset)
- Lista stref można wygenerować z biblioteki np. `date-fns-tz` lub `Intl.supportedValuesOf('timeZone')`

**Propsy**:
```typescript
interface TimezoneComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}
```

---

### DeleteConfirmationDialog

**Opis**: Dialog potwierdzenia przed usunięciem kierowcy (soft delete). Wyświetla ostrzeżenie, że kierowca zostanie dezaktywowany i ukryty, ale historyczne raporty pozostaną.

**Główne elementy**:
- `<AlertDialog>` z shadcn/ui
- `<AlertDialogContent>`:
  - `<AlertDialogHeader>`:
    - `<AlertDialogTitle>Usuń kierowcę</AlertDialogTitle>`
    - `<AlertDialogDescription>` – ostrzeżenie o skutkach
  - Informacja o nazwie kierowcy do usunięcia
  - `<AlertDialogFooter>`:
    - `<AlertDialogCancel>Anuluj</AlertDialogCancel>`
    - `<AlertDialogAction variant="destructive">Usuń</AlertDialogAction>` (loading spinner gdy mutation w toku)

**Obsługiwane interakcje**:
- Kliknięcie "Usuń" → wywołanie mutation DELETE
- Kliknięcie "Anuluj" → zamknięcie dialogu
- Focus trap – focus na przycisku Anuluj po otwarciu (bezpieczniejsze)

**Walidacja**: Brak (potwierdzenie użytkownika).

**Typy**:
- `DriverDTO` (kierowca do usunięcia)

**Propsy**:
```typescript
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  driver: DriverDTO | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}
```

---

### EmptyState

**Opis**: Komunikat wyświetlany gdy lista kierowców jest pusta. Różne warianty w zależności od kontekstu: brak kierowców w systemie, brak wyników po filtrowaniu.

**Główne elementy**:
- Ikona (Users lub Search)
- Nagłówek: "Brak kierowców" lub "Brak wyników"
- Opis: odpowiedni komunikat
- Opcjonalnie przycisk "Dodaj pierwszego kierowcę" (gdy brak kierowców w systemie)
- Opcjonalnie przycisk "Wyczyść filtry" (gdy brak wyników po filtrowaniu)

**Obsługiwane interakcje**:
- Kliknięcie "Dodaj kierowcę" → otwarcie modalu dodawania
- Kliknięcie "Wyczyść filtry" → reset filtrów

**Walidacja**: Brak.

**Typy**:
- `EmptyStateVariant` ('no-drivers' | 'no-results')

**Propsy**:
```typescript
interface EmptyStateProps {
  variant: 'no-drivers' | 'no-results';
  onAddClick?: () => void;
  onClearFilters?: () => void;
}
```

---

### LoadingSkeletons

**Opis**: Komponenty skeleton (Skeleton z shadcn/ui) wyświetlane podczas ładowania danych. Imitują strukturę tabeli lub kart.

**Główne elementy**:
- Desktop: skeleton tabeli (wiersze z komórkami)
- Mobile: skeleton kart

**Obsługiwane interakcje**: Brak (tylko prezentacja).

**Walidacja**: Brak.

**Typy**: Brak.

**Propsy**:
```typescript
interface LoadingSkeletonsProps {
  count?: number; // liczba skeletonów do wyświetlenia, domyślnie 5
}
```

---

### ErrorState

**Opis**: Komunikat błędu wyświetlany gdy nie udało się załadować danych. Zawiera przycisk ponownego próbowania.

**Główne elementy**:
- Ikona błędu (AlertCircle)
- Nagłówek: "Nie udało się załadować kierowców"
- Opis błędu (jeśli dostępny)
- Przycisk "Spróbuj ponownie"

**Obsługiwane interakcje**:
- Kliknięcie "Spróbuj ponownie" → refetch danych

**Walidacja**: Brak.

**Typy**:
- `Error` (obiekt błędu)

**Propsy**:
```typescript
interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}
```

---

## 5. Typy

### Istniejące typy (z `src/types.ts`):

```typescript
// DTO kierowcy zwracane przez API
export type DriverDTO = {
  uuid: string;
  name: string;
  email: string;
  timezone: string;
  isActive: boolean;
  createdAt: string; // ISO 8601
  deletedAt: string | null; // ISO 8601 lub null
};

// Command tworzenia kierowcy (POST /api/drivers)
export type CreateDriverCommand = {
  name: string;
  email: string;
  timezone: string;
  isActive: boolean;
};

// Command aktualizacji kierowcy (PATCH /api/drivers/{uuid})
export type UpdateDriverCommand = Partial<CreateDriverCommand>;

// Response listy kierowców (GET /api/drivers)
export type DriversListResponseDTO = {
  items: DriverDTO[];
  nextCursor: string | null;
};
```

### Nowe typy ViewModel (do utworzenia w komponencie lub osobnym pliku):

```typescript
// Stan filtrów w widoku
export interface DriversFiltersState {
  q: string; // wyszukiwarka
  isActive?: boolean; // filtr aktywności: undefined = wszystkie, true = aktywni, false = nieaktywni
  includeDeleted: boolean; // czy pokazywać usuniętych
  sortBy: 'name' | 'createdAt'; // pole sortowania
  sortDir: 'asc' | 'desc'; // kierunek sortowania
  cursor?: string; // cursor paginacji
}

// Domyślne wartości filtrów
export const defaultFilters: DriversFiltersState = {
  q: '',
  isActive: undefined,
  includeDeleted: false,
  sortBy: 'name',
  sortDir: 'asc',
};

// Stan modalu
export type ModalState = 
  | { type: null }
  | { type: 'add' }
  | { type: 'edit'; driver: DriverDTO }
  | { type: 'delete'; driver: DriverDTO };

// Dane formularza (React Hook Form)
export interface DriverFormData {
  name: string;
  email: string;
  timezone: string;
  isActive: boolean;
}

// Opcja strefy czasowej dla combobox
export interface TimezoneOption {
  value: string; // np. "Europe/Warsaw"
  label: string; // np. "Europe/Warsaw (UTC+01:00)"
  offset: string; // np. "+01:00"
}

// Stan paginacji
export interface PaginationState {
  hasNext: boolean;
  hasPrev: boolean;
  currentCursor?: string;
  nextCursor?: string;
  prevCursors: string[]; // stack kursorów poprzednich stron
}

// Parametry query dla API
export interface DriversQueryParams {
  q?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  cursor?: string;
  sortBy?: 'name' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}
```

### Schema walidacji Zod:

```typescript
import { z } from 'zod';

export const driverFormSchema = z.object({
  name: z.string()
    .min(2, "Imię musi mieć minimum 2 znaki")
    .max(100, "Imię może mieć maksymalnie 100 znaków")
    .trim(),
  email: z.string()
    .email("Nieprawidłowy format adresu e-mail")
    .max(255, "Email może mieć maksymalnie 255 znaków")
    .trim()
    .toLowerCase(),
  timezone: z.string()
    .min(1, "Strefa czasowa jest wymagana")
    .refine(
      (val) => {
        try {
          // Walidacja czy strefa czasowa jest prawidłowa
          Intl.DateTimeFormat(undefined, { timeZone: val });
          return true;
        } catch {
          return false;
        }
      },
      "Nieprawidłowa strefa czasowa"
    ),
  isActive: z.boolean().default(true),
});

export type DriverFormData = z.infer<typeof driverFormSchema>;
```

---

## 6. Zarządzanie stanem

### 6.1 Stan lokalny komponentów (React useState)

- **modalState**: `useState<ModalState>({ type: null })` – kontrola otwartych modali
- **isDeleteDialogOpen**: `useState<boolean>(false)` – stan dialogu potwierdzenia usunięcia

### 6.2 Stan filtrów (synchronizowany z URL)

Wykorzystanie custom hook `useDriversFilters`:

```typescript
function useDriversFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filters: DriversFiltersState = {
    q: searchParams.get('q') || '',
    isActive: searchParams.get('isActive') 
      ? searchParams.get('isActive') === 'true' 
      : undefined,
    includeDeleted: searchParams.get('includeDeleted') === 'true',
    sortBy: (searchParams.get('sortBy') as 'name' | 'createdAt') || 'name',
    sortDir: (searchParams.get('sortDir') as 'asc' | 'desc') || 'asc',
    cursor: searchParams.get('cursor') || undefined,
  };
  
  const updateFilters = (updates: Partial<DriversFiltersState>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    
    // Reset cursor przy zmianie filtrów (oprócz samej zmiany cursor)
    if (!('cursor' in updates)) {
      newParams.delete('cursor');
    }
    
    setSearchParams(newParams, { replace: true });
  };
  
  const resetFilters = () => {
    setSearchParams({}, { replace: true });
  };
  
  return { filters, updateFilters, resetFilters };
}
```

### 6.3 Debounced search

Custom hook `useDebouncedValue` dla wyszukiwarki:

```typescript
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
```

### 6.4 Zarządzanie danymi (TanStack Query)

#### Hook `useDriversList`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { driversService } from '@/lib/services/driversService';
import type { DriversQueryParams } from './types';

export function useDriversList(params: DriversQueryParams) {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: () => driversService.list(params),
    staleTime: 30_000, // 30s
    refetchInterval: 60_000, // auto-refetch co 60s
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
```

#### Hook `useCreateDriver`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { driversService } from '@/lib/services/driversService';
import { toast } from 'sonner';
import type { CreateDriverCommand } from '@/types';

export function useCreateDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateDriverCommand) => driversService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Kierowca został dodany pomyślnie');
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error('Kierowca z tym adresem e-mail już istnieje');
      } else {
        toast.error('Nie udało się dodać kierowcy');
      }
    },
  });
}
```

#### Hook `useUpdateDriver`:

```typescript
export function useUpdateDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: UpdateDriverCommand }) => 
      driversService.update(uuid, data),
    onMutate: async ({ uuid, data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['drivers'] });
      
      const previousData = queryClient.getQueryData(['drivers']);
      
      queryClient.setQueriesData(
        { queryKey: ['drivers'] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((driver: DriverDTO) =>
              driver.uuid === uuid ? { ...driver, ...data } : driver
            ),
          };
        }
      );
      
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback na błąd
      if (context?.previousData) {
        queryClient.setQueryData(['drivers'], context.previousData);
      }
      toast.error('Nie udało się zaktualizować kierowcy');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Kierowca został zaktualizowany');
    },
  });
}
```

#### Hook `useDeleteDriver`:

```typescript
export function useDeleteDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (uuid: string) => driversService.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Kierowca został usunięty');
    },
    onError: () => {
      toast.error('Nie udało się usunąć kierowcy');
    },
  });
}
```

### 6.5 Stan paginacji

Custom hook `usePagination`:

```typescript
function usePagination() {
  const [prevCursors, setPrevCursors] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>();
  
  const goToNext = (nextCursor: string) => {
    if (currentCursor) {
      setPrevCursors(prev => [...prev, currentCursor]);
    }
    setCurrentCursor(nextCursor);
  };
  
  const goToPrev = () => {
    const newPrevCursors = [...prevCursors];
    const prevCursor = newPrevCursors.pop();
    setPrevCursors(newPrevCursors);
    setCurrentCursor(prevCursor);
  };
  
  const hasNext = (nextCursor: string | null) => nextCursor !== null;
  const hasPrev = prevCursors.length > 0;
  
  return {
    currentCursor,
    goToNext,
    goToPrev,
    hasNext,
    hasPrev,
    reset: () => {
      setPrevCursors([]);
      setCurrentCursor(undefined);
    },
  };
}
```

---

## 7. Integracja API

### 7.1 Service Layer

Utworzenie serwisu `driversService` w `src/lib/services/driversService.ts`:

```typescript
import { supabaseClient } from '@/db/supabase.client';
import type {
  DriverDTO,
  CreateDriverCommand,
  UpdateDriverCommand,
  DriversListResponseDTO,
} from '@/types';
import type { DriversQueryParams } from './types';

export const driversService = {
  /**
   * GET /api/drivers
   * Lista kierowców z filtrowaniem, sortowaniem i paginacją
   */
  async list(params: DriversQueryParams): Promise<DriversListResponseDTO> {
    const queryParams = new URLSearchParams();
    
    if (params.q) queryParams.set('q', params.q);
    if (params.isActive !== undefined) queryParams.set('isActive', String(params.isActive));
    if (params.includeDeleted) queryParams.set('includeDeleted', 'true');
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.cursor) queryParams.set('cursor', params.cursor);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortDir) queryParams.set('sortDir', params.sortDir);
    
    const response = await fetch(`/api/drivers?${queryParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch drivers: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * POST /api/drivers
   * Utworzenie nowego kierowcy
   */
  async create(data: CreateDriverCommand): Promise<DriverDTO> {
    const response = await fetch('/api/drivers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw { response: { status: response.status, data: error } };
    }
    
    return response.json();
  },
  
  /**
   * GET /api/drivers/{uuid}
   * Szczegóły pojedynczego kierowcy
   */
  async get(uuid: string): Promise<DriverDTO> {
    const response = await fetch(`/api/drivers/${uuid}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch driver: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * PATCH /api/drivers/{uuid}
   * Aktualizacja kierowcy
   */
  async update(uuid: string, data: UpdateDriverCommand): Promise<DriverDTO> {
    const response = await fetch(`/api/drivers/${uuid}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw { response: { status: response.status, data: error } };
    }
    
    return response.json();
  },
  
  /**
   * DELETE /api/drivers/{uuid}
   * Soft delete kierowcy
   */
  async delete(uuid: string): Promise<void> {
    const response = await fetch(`/api/drivers/${uuid}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete driver: ${response.statusText}`);
    }
  },
};
```

### 7.2 Mapowanie Request/Response

**Request (Create)**:
```typescript
// Frontend → API
const createDriverData: CreateDriverCommand = {
  name: formData.name,
  email: formData.email,
  timezone: formData.timezone,
  isActive: formData.isActive,
};
```

**Request (Update)**:
```typescript
// Frontend → API (tylko zmienione pola)
const updateDriverData: UpdateDriverCommand = {
  name: formData.name !== driver.name ? formData.name : undefined,
  email: formData.email !== driver.email ? formData.email : undefined,
  timezone: formData.timezone !== driver.timezone ? formData.timezone : undefined,
  isActive: formData.isActive !== driver.isActive ? formData.isActive : undefined,
};
```

**Response (List)**:
```typescript
// API → Frontend
interface DriversListResponse {
  items: DriverDTO[]; // tablica kierowców
  nextCursor: string | null; // cursor kolejnej strony lub null
}
```

**Response (Single)**:
```typescript
// API → Frontend
const driver: DriverDTO = {
  uuid: "...",
  name: "Jan Kowalski",
  email: "jan.kowalski@example.com",
  timezone: "Europe/Warsaw",
  isActive: true,
  createdAt: "2025-01-15T10:00:00Z",
  deletedAt: null,
};
```

### 7.3 Obsługa błędów API

| Status | Znaczenie | Akcja frontendu |
|--------|-----------|-----------------|
| 200 | OK | Przetworzenie odpowiedzi |
| 201 | Created | Toast sukcesu, zamknięcie modalu, invalidate queries |
| 204 | No Content | Toast sukcesu (usunięcie), invalidate queries |
| 400 | Bad Request | Toast błędu z komunikatem, podświetlenie pól formularza |
| 401 | Unauthorized | Redirect na `/signin` |
| 403 | Forbidden | Toast "Brak uprawnień" |
| 404 | Not Found | Toast "Kierowca nie został znaleziony" |
| 409 | Conflict | Toast "Kierowca z tym emailem już istnieje", setError na polu email |
| 422 | Unprocessable Entity | Toast błędu walidacji, podświetlenie pól |
| 429 | Too Many Requests | Toast "Zbyt wiele żądań, spróbuj ponownie za chwilę" |
| 500 | Internal Server Error | Toast "Wystąpił błąd serwera", ErrorState |

---

## 8. Interakcje użytkownika

### 8.1 Podstawowe akcje

1. **Przeglądanie listy kierowców**:
   - Użytkownik wchodzi na `/drivers`
   - System ładuje listę kierowców (GET /api/drivers)
   - Wyświetlana jest tabela (desktop) lub karty (mobile)
   - Auto-refresh co 60s

2. **Wyszukiwanie kierowców**:
   - Użytkownik wpisuje tekst w pole wyszukiwania
   - Po 300ms debounce wysłane jest zapytanie z parametrem `q`
   - Lista odświeża się z wynikami wyszukiwania
   - URL jest aktualizowany (np. `/drivers?q=kowalski`)

3. **Filtrowanie po statusie aktywności**:
   - Użytkownik wybiera opcję z filtra (Wszyscy/Aktywni/Nieaktywni)
   - Zapytanie z parametrem `isActive=true|false` lub bez parametru
   - Lista odświeża się
   - URL aktualizowany

4. **Wyświetlanie usuniętych kierowców**:
   - Użytkownik włącza toggle "Pokaż usuniętych"
   - Zapytanie z parametrem `includeDeleted=true`
   - Lista zawiera usuniętych kierowców (oznaczonych specjalnym badge)
   - URL aktualizowany

5. **Sortowanie**:
   - Użytkownik klika nagłówek kolumny (desktop) lub wybiera z dropdown (mobile)
   - Zapytanie z parametrami `sortBy` i `sortDir`
   - Lista odświeża się w nowej kolejności
   - URL aktualizowany

6. **Paginacja**:
   - Użytkownik klika "Następna strona"
   - Zapytanie z parametrem `cursor` (z poprzedniej odpowiedzi)
   - Lista odświeża się z kolejnymi wynikami
   - Użytkownik klika "Poprzednia strona" → powrót do poprzedniego cursor

### 8.2 Akcje CRUD

7. **Dodawanie kierowcy**:
   - Użytkownik klika "+ Dodaj kierowcę"
   - Otwiera się modal z pustym formularzem
   - Użytkownik wypełnia pola (nazwa, email, strefa czasowa, status)
   - Walidacja inline przy onBlur
   - Użytkownik klika "Zapisz"
   - Wysłane zapytanie POST /api/drivers
   - Na sukces: toast, zamknięcie modalu, odświeżenie listy
   - Na błąd 409: toast "Email już istnieje", setError na polu email
   - Na inne błędy: toast z komunikatem

8. **Edycja kierowcy**:
   - Użytkownik klika "Edytuj" w menu akcji wiersza/karty
   - Otwiera się modal z wypełnionym formularzem
   - Użytkownik modyfikuje pola
   - Walidacja inline
   - Użytkownik klika "Zapisz"
   - Wysłane zapytanie PATCH /api/drivers/{uuid}
   - Optimistic update (natychmiastowa aktualizacja UI)
   - Na sukces: toast, zamknięcie modalu
   - Na błąd: rollback, toast z komunikatem

9. **Zmiana statusu aktywności (toggle)**:
   - Użytkownik klika "Aktywuj" lub "Dezaktywuj" w menu akcji
   - Wysłane zapytanie PATCH /api/drivers/{uuid} z `isActive: true|false`
   - Optimistic update
   - Na sukces: toast "Kierowca został aktywowany/dezaktywowany"
   - Na błąd: rollback, toast

10. **Usunięcie kierowcy**:
    - Użytkownik klika "Usuń" w menu akcji
    - Otwiera się dialog potwierdzenia
    - Focus na przycisku "Anuluj" (bezpieczniejsze)
    - Użytkownik czyta ostrzeżenie o skutkach
    - Użytkownik klika "Usuń" (czerwony przycisk)
    - Wysłane zapytanie DELETE /api/drivers/{uuid}
    - Na sukces: toast, zamknięcie dialogu, usunięcie z listy, invalidate queries
    - Na błąd: toast z komunikatem

### 8.3 Obsługa klawiaturowa

- **Tab**: nawigacja między elementami
- **Enter**: submit formularza, wybór opcji w menu
- **Escape**: zamknięcie modali i dropdown
- **Arrow Up/Down**: nawigacja w combobox i dropdown
- **Space**: toggle checkboxów i switchów
- Focus trap w modalach (Tab nie wychodzi poza modal)
- Focus restore po zamknięciu modalu (powrót do elementu, który otworzył modal)

### 8.4 Responsywność

- Desktop (≥768px): tabela z pełnymi informacjami, dropdown menu akcji
- Mobile (<768px): karty z najważniejszymi informacjami, przyciski akcji w footer karty
- Touch-friendly: przyciski min. 44x44px
- Swipe na mobile: opcjonalnie swipe na karcie → akcje (np. swipe left → delete)

---

## 9. Warunki i walidacja

### 9.1 Walidacja formularza (dodawanie/edycja kierowcy)

**Pole: Imię i nazwisko (name)**
- Wymagane: ✅
- Min. długość: 2 znaki
- Max. długość: 100 znaków
- Walidacja: onBlur i onSubmit
- Komunikat błędu: "Imię musi mieć minimum 2 znaki" / "Imię może mieć maksymalnie 100 znaków"
- Komponent: `<Input />` z `<FormMessage />`

**Pole: Adres e-mail (email)**
- Wymagane: ✅
- Format: valid email address
- Max. długość: 255 znaków
- Unikalność: sprawdzana przez API (błąd 409)
- Walidacja: onBlur i onSubmit
- Komunikat błędu: "Nieprawidłowy format adresu e-mail" / "Kierowca z tym emailem już istnieje" (409)
- Komponent: `<Input type="email" />` z `<FormMessage />`

**Pole: Strefa czasowa (timezone)**
- Wymagane: ✅
- Wartość: musi być prawidłową strefą IANA (np. "Europe/Warsaw")
- Walidacja: w combobox (tylko dostępne opcje), dodatkowa walidacja przez API (błąd 400)
- Komunikat błędu: "Strefa czasowa jest wymagana" / "Nieprawidłowa strefa czasowa"
- Komponent: `<TimezoneCombobox />` z `<FormMessage />`

**Pole: Status aktywności (isActive)**
- Wymagane: ✅ (domyślnie `true`)
- Wartość: boolean
- Komponent: `<Switch />` z etykietą "Aktywny"
- Opis wpływu: gdy nieaktywny, kierowca nie otrzyma linków raportowych

### 9.2 Warunki biznesowe weryfikowane przez API

1. **Unikalność email w ramach firmy**:
   - API zwraca 409 Conflict gdy email już istnieje dla aktywnego kierowcy w tej samej firmie
   - Frontend: setError na pole email, toast "Kierowca z tym emailem już istnieje"

2. **Prawidłowa strefa czasowa**:
   - API zwraca 400 Bad Request gdy strefa czasowa jest nieprawidłowa
   - Frontend: setError na pole timezone, toast błędu

3. **Autoryzacja**:
   - API zwraca 401 Unauthorized gdy brak sesji
   - Frontend: redirect na `/signin`
   - API zwraca 403 Forbidden gdy brak uprawnień
   - Frontend: toast "Brak uprawnień do wykonania tej akcji"

4. **Soft delete - zachowanie historii raportów**:
   - DELETE /api/drivers/{uuid} ustawia `deleted_at` i `is_active=false`
   - Historyczne raporty pozostają widoczne (powiązane przez `driver_uuid`)
   - Frontend: dialog potwierdzenia informuje o tym

### 9.3 Warunki UI

1. **Lista pusta (brak kierowców)**:
   - Warunek: `data.items.length === 0 && filters.q === ''`
   - Wyświetlenie: `<EmptyState variant="no-drivers" />`
   - CTA: "Dodaj pierwszego kierowcę"

2. **Brak wyników po filtrowaniu**:
   - Warunek: `data.items.length === 0 && (filters.q !== '' || filters.isActive !== undefined)`
   - Wyświetlenie: `<EmptyState variant="no-results" />`
   - CTA: "Wyczyść filtry"

3. **Loading state**:
   - Warunek: `isLoading && !data`
   - Wyświetlenie: `<LoadingSkeletons />`

4. **Error state**:
   - Warunek: `isError`
   - Wyświetlenie: `<ErrorState error={error} onRetry={refetch} />`

5. **Disabled actions podczas operacji**:
   - Przyciski "Zapisz" disabled gdy `isSubmitting`
   - Przyciski "Usuń" disabled gdy `isDeleting`
   - Loading spinner w przyciskach

6. **Unsaved changes guard**:
   - Jeśli formularz zmieniony (`isDirty`) i użytkownik próbuje zamknąć modal
   - Wyświetlenie alertu: "Masz niezapisane zmiany. Czy na pewno chcesz zamknąć?"

7. **Paginacja**:
   - Przycisk "Następna strona" disabled gdy `nextCursor === null`
   - Przycisk "Poprzednia strona" disabled gdy `prevCursors.length === 0`

8. **Status badge dla usuniętych kierowców**:
   - Warunek: `driver.deletedAt !== null`
   - Wyświetlenie dodatkowego badge "Usunięty" (kolor szary)
   - Akcje "Edytuj" i "Usuń" disabled lub ukryte

---

## 10. Obsługa błędów

### 10.1 Błędy API

**401 Unauthorized**:
- Przyczyna: Brak ważnej sesji, token wygasł
- Akcja: Automatyczne przekierowanie na `/signin` z zapytaniem `?redirect=/drivers`
- Implementacja: w interceptorze fetch lub w middleware Astro

**403 Forbidden**:
- Przyczyna: Użytkownik nie ma uprawnień do zarządzania kierowcami
- Akcja: Toast "Brak uprawnień do wykonania tej akcji"
- Opcjonalnie: wyświetlenie banneru z informacją o ograniczonych uprawnieniach

**404 Not Found** (GET /api/drivers/{uuid}):
- Przyczyna: Kierowca nie istnieje lub został usunięty
- Akcja: Toast "Kierowca nie został znaleziony", zamknięcie modalu edycji
- Invalidate queries

**409 Conflict** (POST/PATCH /api/drivers):
- Przyczyna: Email już istnieje dla innego aktywnego kierowcy w firmie
- Akcja: 
  - Toast "Kierowca z tym adresem e-mail już istnieje"
  - setError na pole email w formularzu
  - Focus na polu email
  - Podświetlenie pola (czerwona ramka)

**422 Unprocessable Entity**:
- Przyczyna: Błędy walidacji schematu (niezgodność z API)
- Akcja:
  - Parsowanie błędów z response body
  - Mapowanie błędów na odpowiednie pola formularza (setError)
  - Toast z ogólnym komunikatem "Sprawdź poprawność formularza"

**429 Too Many Requests**:
- Przyczyna: Przekroczony limit żądań (rate limiting)
- Akcja:
  - Toast "Zbyt wiele żądań. Spróbuj ponownie za chwilę"
  - Disable przycisku na 5 sekund
  - Opcjonalnie: countdown w toaście

**500 Internal Server Error**:
- Przyczyna: Błąd serwera
- Akcja:
  - Toast "Wystąpił błąd serwera. Spróbuj ponownie"
  - Wyświetlenie `<ErrorState />` z przyciskiem "Spróbuj ponownie"
  - Logowanie błędu do telemetrii

**Błąd sieci (Network Error)**:
- Przyczyna: Brak połączenia z internetem
- Akcja:
  - Toast "Brak połączenia z internetem"
  - Wyświetlenie `<OfflineBanner />` (komponent z layout)
  - Próba ponownego połączenia co 10s

### 10.2 Błędy walidacji formularza (klient)

**Walidacja nie powiodła się (Zod errors)**:
- Akcja:
  - Automatyczne ustawienie błędów na polach (React Hook Form)
  - Wyświetlenie komunikatów pod polami (`<FormMessage />`)
  - Fokus na pierwszym polu z błędem
  - Scroll do pierwszego błędu (jeśli poza viewport)
  - Disable przycisku submit do czasu poprawienia błędów

**Pole wymagane pozostało puste**:
- Komunikat: "To pole jest wymagane"
- Kolor: czerwony tekst i ramka

**Nieprawidłowy format email**:
- Komunikat: "Nieprawidłowy format adresu e-mail"

**Nazwa za krótka (<2 znaki)**:
- Komunikat: "Imię musi mieć minimum 2 znaki"

**Nazwa za długa (>100 znaków)**:
- Komunikat: "Imię może mieć maksymalnie 100 znaków"

### 10.3 Błędy stanu aplikacji

**Optimistic update nie powiódł się**:
- Przyczyna: PATCH/DELETE zwróciło błąd po optimistic update
- Akcja:
  - Rollback do poprzedniego stanu (context.previousData)
  - Toast z komunikatem błędu
  - Optymistycznie zmienione dane wracają do oryginalnych wartości

**Query failed (błąd ładowania listy)**:
- Akcja:
  - Wyświetlenie `<ErrorState />` z przyciskiem "Spróbuj ponownie"
  - Retry automatyczny (TanStack Query: retry: 2)
  - Po wyczerpaniu prób: ręczny retry przez użytkownika

**Modal nie może się otworzyć (brak danych)**:
- Przyczyna: Próba edycji kierowcy, którego dane nie są dostępne
- Akcja:
  - Toast "Nie można załadować danych kierowcy"
  - Pozostanie na liście, brak otwarcia modalu

### 10.4 Edge cases

**Użytkownik zmienia URL ręcznie (nieprawidłowy cursor)**:
- Akcja:
  - API zwróci 400 Bad Request
  - Reset cursor do undefined
  - Toast "Nieprawidłowy parametr paginacji"
  - Ładowanie pierwszej strony

**Użytkownik próbuje edytować usuniętego kierowcę**:
- Akcja:
  - API może zwrócić 404 lub 403
  - Toast "Nie można edytować usuniętego kierowcy"
  - Opcjonalnie: disable akcji edycji dla usuniętych w UI

**Dane się zmieniły podczas edycji (concurrent modification)**:
- Akcja:
  - API może zwrócić 409 Conflict
  - Toast "Dane kierowcy zostały zmienione przez innego użytkownika. Odśwież stronę"
  - Opcjonalnie: merge lub force refresh

**Session wygasła podczas wypełniania formularza**:
- Akcja:
  - API zwróci 401
  - Toast "Sesja wygasła. Zaloguj się ponownie"
  - Zapisanie danych formularza w sessionStorage (opcjonalnie)
  - Redirect na `/signin?redirect=/drivers`

### 10.5 Logowanie błędów

**Telemetria**:
- Wszystkie błędy API (4xx, 5xx) logowane do telemetrii
- Błędy renderowania (ErrorBoundary) logowane
- Parametry: error code, message, endpoint, timestamp, user context

**Console logs (dev mode)**:
- Szczegółowe logi błędów w konsoli przeglądarki (tylko dev)
- Stack traces dla debugowania

---

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików i typów

1.1. Utworzyć plik typów dla widoku:
- `src/lib/drivers/types.ts` – typy ViewModel (DriversFiltersState, ModalState, DriverFormData, TimezoneOption, PaginationState, DriversQueryParams)

1.2. Utworzyć schema walidacji Zod:
- `src/lib/drivers/validation.ts` – driverFormSchema

1.3. Przygotować listę stref czasowych:
- `src/lib/drivers/timezones.ts` – funkcja `getTimezoneOptions()` zwracająca `TimezoneOption[]`
- Wykorzystać `Intl.supportedValuesOf('timeZone')` lub bibliotekę `date-fns-tz`

### Krok 2: Implementacja Service Layer

2.1. Utworzyć serwis API:
- `src/lib/services/driversService.ts` – implementacja metod: list, create, get, update, delete
- Obsługa query params, błędów, transformacja danych

2.2. Utworzyć query keys:
- `src/lib/drivers/queryKeys.ts` – funkcje generujące klucze dla TanStack Query:
  ```typescript
  export const driversKeys = {
    all: ['drivers'] as const,
    lists: () => [...driversKeys.all, 'list'] as const,
    list: (filters: DriversQueryParams) => [...driversKeys.lists(), filters] as const,
    details: () => [...driversKeys.all, 'detail'] as const,
    detail: (uuid: string) => [...driversKeys.details(), uuid] as const,
  };
  ```

### Krok 3: Implementacja Custom Hooks

3.1. Utworzyć hooki zarządzania danymi:
- `src/lib/drivers/useDriversList.ts` – hook useQuery dla listy
- `src/lib/drivers/useCreateDriver.ts` – hook useMutation dla tworzenia
- `src/lib/drivers/useUpdateDriver.ts` – hook useMutation dla aktualizacji z optimistic update
- `src/lib/drivers/useDeleteDriver.ts` – hook useMutation dla usuwania

3.2. Utworzyć hooki pomocnicze:
- `src/lib/drivers/useDriversFilters.ts` – synchronizacja filtrów z URL
- `src/lib/drivers/useDebouncedValue.ts` – debounce dla wyszukiwarki
- `src/lib/drivers/usePagination.ts` – zarządzanie cursorami paginacji

### Krok 4: Implementacja komponentów UI (od atomowych do złożonych)

4.1. **Komponenty atomowe**:

Utworzyć `src/components/drivers/StatusBadge.tsx`:
- Props: `{ isActive: boolean, variant?: 'default' | 'compact' }`
- Wykorzystać `<Badge>` z shadcn/ui
- Wariantowe style: zielony dla aktywny, szary dla nieaktywny

Utworzyć `src/components/drivers/EmptyState.tsx`:
- Props: `{ variant: 'no-drivers' | 'no-results', onAddClick?, onClearFilters? }`
- Ikony z `lucide-react`
- Warunkowe przyciski CTA

Utworzyć `src/components/drivers/LoadingSkeletons.tsx`:
- Props: `{ count?: number }`
- Wykorzystać `<Skeleton>` z shadcn/ui
- Osobne komponenty dla desktop (tabela) i mobile (karty)

Utworzyć `src/components/drivers/ErrorState.tsx`:
- Props: `{ error: Error, onRetry: () => void }`
- Ikona `AlertCircle`
- Przycisk "Spróbuj ponownie"

4.2. **Komponenty formularza**:

Utworzyć `src/components/drivers/TimezoneCombobox.tsx`:
- Props: `{ value: string, onChange: (value: string) => void, disabled?: boolean }`
- Wykorzystać `<Popover>` + `<Command>` z shadcn/ui
- Wyszukiwanie i filtrowanie stref czasowych
- Wyświetlanie offsetu UTC

Utworzyć `src/components/drivers/DriverForm.tsx`:
- Props: `{ defaultValues?: Partial<DriverFormData>, onSubmit: (data: DriverFormData) => Promise<void>, isSubmitting: boolean }`
- Użyć React Hook Form + Zod resolver
- Pola: name (Input), email (Input), timezone (TimezoneCombobox), isActive (Switch)
- Obsługa błędów z API (setError)

4.3. **Modals**:

Utworzyć `src/components/drivers/AddEditDriverModal.tsx`:
- Props: `{ isOpen: boolean, mode: 'add' | 'edit', driver?: DriverDTO, onClose: () => void, onSuccess: () => void }`
- Wykorzystać `<Dialog>` z shadcn/ui
- Osadzić `<DriverForm />`
- Focus trap, unsaved changes guard
- Obsługa mutation hooks

Utworzyć `src/components/drivers/DeleteConfirmationDialog.tsx`:
- Props: `{ isOpen: boolean, driver: DriverDTO | null, onClose: () => void, onConfirm: () => Promise<void>, isDeleting: boolean }`
- Wykorzystać `<AlertDialog>` z shadcn/ui
- Focus na przycisku "Anuluj"
- Tekst ostrzeżenia o skutkach

4.4. **Komponenty listy (desktop)**:

Utworzyć `src/components/drivers/RowActionsMenu.tsx`:
- Props: `{ driver: DriverDTO, onEdit, onToggleActive, onDelete }`
- Wykorzystać `<DropdownMenu>` z shadcn/ui
- Menu items z ikonami

Utworzyć `src/components/drivers/DriverRow.tsx`:
- Props: `{ driver: DriverDTO, onEdit, onToggleActive, onDelete }`
- Wykorzystać `<TableRow>`, `<TableCell>` z shadcn/ui
- Osadzić `<StatusBadge />` i `<RowActionsMenu />`

Utworzyć `src/components/drivers/DriversTable.tsx`:
- Props: `{ drivers: DriverDTO[], sortBy, sortDir, onSortChange, onEditClick, onToggleActiveClick, onDeleteClick, pagination }`
- Wykorzystać `<Table>` z shadcn/ui
- Sortowalne nagłówki kolumn
- Mapowanie `drivers` na `<DriverRow />`
- Przyciski paginacji

4.5. **Komponenty listy (mobile)**:

Utworzyć `src/components/drivers/DriverCard.tsx`:
- Props: `{ driver: DriverDTO, onEdit, onToggleActive, onDelete }`
- Wykorzystać `<Card>` z shadcn/ui
- Avatar z inicjałami (użyć `<Avatar>` z shadcn/ui)
- Przyciski akcji w CardFooter

Utworzyć `src/components/drivers/DriversCardList.tsx`:
- Props: `{ drivers: DriverDTO[], onEditClick, onToggleActiveClick, onDeleteClick, pagination }`
- Grid layout kart
- Mapowanie `drivers` na `<DriverCard />`
- Przyciski paginacji

4.6. **Komponenty filtrów i nagłówka**:

Utworzyć `src/components/drivers/DriversFiltersBar.tsx`:
- Props: `{ filters: DriversFiltersState, onFiltersChange, resultsCount? }`
- Pola: SearchInput (debounced), ActiveFilterToggle, ShowDeletedToggle, SortControls
- Synchronizacja z URL przez callback `onFiltersChange`

Utworzyć `src/components/drivers/DriversHeader.tsx`:
- Props: `{ onAddClick: () => void }`
- Nagłówek h1 + przycisk "Dodaj kierowcę"

4.7. **Główny komponent widoku**:

Utworzyć `src/components/drivers/DriversView.tsx`:
- Główny kontener React
- Użycie hooków: useDriversFilters, useDriversList, usePagination, useCreateDriver, useUpdateDriver, useDeleteDriver
- Stan modalów: useState<ModalState>
- Warunkowe renderowanie: Loading, Error, Empty, Success
- Responsive: useMediaQuery dla przełączania Table/CardList
- Przekazanie callbacków do komponentów dzieci

### Krok 5: Utworzenie strony Astro

5.1. Utworzyć `src/pages/drivers.astro`:
```astro
---
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout.astro';
import { DriversViewWithProvider } from '@/components/drivers';
---

<AuthenticatedLayout title="Kierowcy">
  <DriversViewWithProvider client:only="react" />
</AuthenticatedLayout>
```

5.2. Utworzyć wrapper z QueryClientProvider (jeśli nie globalny):
- `src/components/drivers/DriversViewWithProvider.tsx` – opakowuje `<DriversView />` w provider

5.3. Utworzyć barrel export:
- `src/components/drivers/index.ts` – eksport wszystkich komponentów

### Krok 6: Stylowanie i responsywność

6.1. Dostosować breakpointy w Tailwind config (jeśli potrzebne):
- Desktop: `≥768px` (md)
- Mobile: `<768px`

6.2. Dodać responsive classes do głównych komponentów:
- DriversView: toggle między `<DriversTable />` (hidden md:block) i `<DriversCardList />` (block md:hidden)

6.3. Sprawdzić kontrast i ARIA:
- Przyciski: min. contrast ratio 4.5:1
- Focus indicators: widoczne dla keyboard navigation
- ARIA labels dla icon buttons

### Krok 7: Testy

7.1. Utworzyć testy jednostkowe dla hooków:
- `src/lib/drivers/__tests__/useDriversFilters.test.ts`
- `src/lib/drivers/__tests__/usePagination.test.ts`

7.2. Utworzyć testy komponentów:
- `src/components/drivers/__tests__/StatusBadge.test.tsx`
- `src/components/drivers/__tests__/DriverForm.test.tsx`
- `src/components/drivers/__tests__/DriversTable.test.tsx`
- Wykorzystać @testing-library/react, vitest

7.3. Utworzyć testy integracyjne:
- Mock API responses
- Testowanie flow: dodawanie, edycja, usuwanie kierowcy
- Testowanie filtrowania, sortowania, paginacji

7.4. Testy E2E (opcjonalnie):
- Wykorzystać Playwright lub Cypress
- Scenariusze: pełny flow CRUD, walidacja, obsługa błędów

### Krok 8: Dokumentacja i finalizacja

8.1. Dodać komentarze JSDoc do komponentów i hooków:
- Opisać props, zwracane wartości, przykłady użycia

8.2. Utworzyć stories dla Storybook (opcjonalnie):
- Stories dla głównych komponentów (DriverCard, DriverForm, itp.)

8.3. Aktualizować README:
- Sekcja "Widoki" z opisem `/drivers`

8.4. Code review i refactoring:
- Sprawdzić duplicates (DRY)
- Sprawdzić performance (React.memo gdzie potrzebne)
- Sprawdzić accessibility (ARIA, keyboard navigation)

### Krok 9: Deploy i monitoring

9.1. Merge do main branch

9.2. CI/CD pipeline:
- Linting, testy, build
- Deploy na staging → QA
- Deploy na production

9.3. Monitorowanie:
- Telemetria: czas ładowania, błędy API, konwersja dodawania kierowców
- Logi błędów: Sentry lub podobne narzędzie

---

## Podsumowanie

Plan implementacji widoku Listy Kierowców jest kompleksowy i obejmuje:
- **Routing**: `/drivers` w AuthenticatedLayout
- **23 komponenty**: od atomowych (StatusBadge) po złożone (DriversView)
- **8 custom hooków**: zarządzanie danymi (TanStack Query), filtrami, paginacją
- **7 typów ViewModel**: czytelna struktura danych
- **Pełna integracja API**: 5 endpointów, obsługa wszystkich kodów HTTP
- **Zaawansowana walidacja**: Zod schema + API, obsługa konfliktów (409)
- **Responsywność**: tabela na desktop, karty na mobile
- **Optimistic updates**: natychmiastowa reakcja UI
- **Obsługa błędów**: 10+ scenariuszy z przyjaznymi komunikatami
- **A11y**: focus trap, keyboard navigation, ARIA
- **Testowanie**: jednostkowe, komponentowe, integracyjne

Implementacja powinna zająć około **3-5 dni** dla doświadczonego programisty frontendowego, z kolejnymi 1-2 dniami na testy i dopracowanie szczegółów.

