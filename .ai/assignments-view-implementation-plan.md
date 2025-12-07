# Plan implementacji widoku Przypisań kierowca-pojazd

## 1. Przegląd

Widok Przypisań kierowca-pojazd (`/assignments`) umożliwia zarządzanie harmonogramem przypisań kierowców do pojazdów z walidacją zakresów dat. Jest to moduł opcjonalny (feature flag), rozszerzający funkcjonalność MVP o bardziej zaawansowane zarządzanie logistyką. Głównym celem jest zapewnienie, że:

- Każdy kierowca może być przypisany tylko do jednego pojazdu w danym okresie
- Każdy pojazd może być przypisany tylko do jednego kierowcy w danym okresie
- System wykrywa i zapobiega nakładającym się przypisaniom

Widok oferuje pełną funkcjonalność CRUD z walidacją konfliktów po stronie serwera i przejrzystą prezentacją błędów dla użytkownika.

## 2. Routing widoku

- **Ścieżka:** `/assignments`
- **Layout:** `AuthenticatedLayout.astro`
- **Strona Astro:** `src/pages/assignments.astro`
- **Główny komponent React:** `src/components/assignments/AssignmentsViewWithProvider.tsx`
- **Guard:** Wymaga uwierzytelnienia, opcjonalnie kontrolowany przez feature flag

## 3. Struktura komponentów

```
assignments.astro (Astro page)
└── AssignmentsViewWithProvider.tsx (React island z QueryClientProvider)
    ├── AssignmentsHeader.tsx
    │   ├── PageTitle
    │   ├── AddAssignmentButton
    │   └── ViewToggle (opcjonalnie: tabela/timeline)
    ├── AssignmentsFiltersBar.tsx
    │   ├── DriverSelect (Shadcn Select)
    │   ├── VehicleSelect (Shadcn Select)
    │   ├── DatePicker (activeOn) (Shadcn Popover + Calendar)
    │   └── ClearFiltersButton
    ├── AssignmentsContent.tsx
    │   ├── AssignmentsTable.tsx (desktop, Shadcn Table)
    │   │   └── AssignmentRow.tsx
    │   │       ├── DriverCell
    │   │       ├── VehicleCell
    │   │       ├── DateRangeCell
    │   │       ├── StatusBadge (aktywne/zakończone/przyszłe)
    │   │       └── ActionsMenu (Shadcn DropdownMenu)
    │   └── AssignmentCards.tsx (mobile, responsive cards)
    │       └── AssignmentCard.tsx
    │           └── ActionsMenu
    ├── AssignmentFormModal.tsx (Shadcn Dialog/Sheet)
    │   ├── FormHeader
    │   ├── Form (react-hook-form + Zod)
    │   │   ├── DriverSelect
    │   │   ├── VehicleSelect
    │   │   ├── DatePicker (startDate)
    │   │   ├── DatePicker (endDate)
    │   │   └── ConflictErrorAlert (przy 409)
    │   └── FormActions
    │       ├── CancelButton
    │       └── SubmitButton
    ├── DeleteAssignmentDialog.tsx (Shadcn AlertDialog)
    │   ├── DialogHeader
    │   ├── AssignmentDetails
    │   └── DialogActions
    │       ├── CancelButton
    │       └── ConfirmButton
    └── EmptyState.tsx (gdy brak przypisań)
        ├── EmptyIllustration
        ├── EmptyMessage
        └── AddFirstAssignmentButton
```

## 4. Szczegóły komponentów

### AssignmentsViewWithProvider.tsx

**Opis:** Główny kontener widoku, opakowuje całą funkcjonalność w QueryClientProvider i zarządza stanem globalnym widoku (otwarte modale, tryb formularza).

**Główne elementy:**

- `<QueryClientProvider>` z klientem TanStack Query
- `<div>` główny kontener z układem flex column
- Komponenty potomne: Header, FiltersBar, Content, modals

**Obsługiwane interakcje:**

- Otwieranie/zamykanie formularza dodawania
- Otwieranie/zamykanie formularza edycji
- Otwieranie/zamykanie dialogu usuwania
- Przełączanie trybu widoku (table/timeline - opcjonalnie)

**Walidacja:** Brak (zarządza tylko stanem UI)

**Typy:**

- `AssignmentsListResponseDTO`
- `AssignmentViewModel`
- `AssignmentFilters`

**Propsy:** Brak (root component)

### AssignmentsHeader.tsx

**Opis:** Nagłówek strony zawierający tytuł, przycisk dodawania i opcjonalny toggle widoku.

**Główne elementy:**

- `<div>` z flexbox layout
- `<h1>` tytuł "Przypisania kierowca-pojazd"
- `<Button>` "Dodaj przypisanie" (Plus icon)
- `<Tabs>` lub toggle dla przełączania widoku (opcjonalnie)

**Obsługiwane interakcje:**

- `onAddClick` - otwiera formularz w trybie tworzenia
- `onViewChange` - przełącza tryb widoku

**Walidacja:** Brak

**Typy:** Brak specyficznych

**Propsy:**

```typescript
interface AssignmentsHeaderProps {
  onAddClick: () => void;
  viewMode?: "table" | "timeline";
  onViewModeChange?: (mode: "table" | "timeline") => void;
}
```

### AssignmentsFiltersBar.tsx

**Opis:** Pasek filtrów umożliwiający zawężenie listy przypisań według kierowcy, pojazdu lub daty aktywności.

**Główne elementy:**

- `<div>` kontener z grid layout
- `<Select>` dla kierowcy (Shadcn Select z wyszukiwaniem)
- `<Select>` dla pojazdu (Shadcn Select z wyszukiwaniem)
- `<Popover>` z `<Calendar>` dla activeOn
- `<Button>` "Wyczyść filtry"

**Obsługiwane interakcje:**

- `onFilterChange` - aktualizuje stan filtrów
- Debounce dla wyszukiwania w selectach

**Walidacja:**

- `activeOn` - jeśli podane, musi być poprawną datą w formacie YYYY-MM-DD

**Typy:**

- `AssignmentFilters`
- `DriverDTO[]` (dla opcji)
- `VehicleDTO[]` (dla opcji)

**Propsy:**

```typescript
interface AssignmentsFiltersBarProps {
  filters: AssignmentFilters;
  onFiltersChange: (filters: AssignmentFilters) => void;
  drivers: DriverDTO[];
  vehicles: VehicleDTO[];
  isLoading?: boolean;
}
```

### AssignmentsTable.tsx

**Opis:** Tabela desktop wyświetlająca listę przypisań z sortowaniem i akcjami w wierszach.

**Główne elementy:**

- `<Table>` (Shadcn Table)
- `<TableHeader>` z kolumnami: Kierowca, Pojazd, Data rozpoczęcia, Data zakończenia, Status, Akcje
- `<TableBody>` z `<AssignmentRow>` dla każdego przypisania
- Sortowanie w nagłówkach kolumn (chevron icons)

**Obsługiwane interakcje:**

- `onSort` - zmienia sortowanie
- `onEdit` - otwiera formularz edycji
- `onDelete` - otwiera dialog usuwania

**Walidacja:** Brak

**Typy:**

- `AssignmentViewModel[]`

**Propsy:**

```typescript
interface AssignmentsTableProps {
  assignments: AssignmentViewModel[];
  sortBy: "startDate" | "endDate" | "createdAt";
  sortDir: "asc" | "desc";
  onSortChange: (sortBy: string, sortDir: "asc" | "desc") => void;
  onEdit: (assignment: AssignmentDTO) => void;
  onDelete: (assignment: AssignmentDTO) => void;
  isLoading?: boolean;
}
```

### AssignmentRow.tsx

**Opis:** Pojedynczy wiersz tabeli reprezentujący jedno przypisanie.

**Główne elementy:**

- `<TableRow>`
- `<TableCell>` dla każdej kolumny (driver name, vehicle registration, start date, end date)
- `<Badge>` dla statusu (aktywne/zakończone/przyszłe)
- `<DropdownMenu>` z akcjami (Edytuj, Usuń)

**Obsługiwane interakcje:**

- `onEdit` - przekazuje przypisanie do edycji
- `onDelete` - przekazuje przypisanie do usunięcia

**Walidacja:** Brak

**Typy:**

- `AssignmentViewModel`

**Propsy:**

```typescript
interface AssignmentRowProps {
  assignment: AssignmentViewModel;
  onEdit: (assignment: AssignmentDTO) => void;
  onDelete: (assignment: AssignmentDTO) => void;
}
```

### AssignmentCards.tsx

**Opis:** Responsywna lista kart dla widoku mobilnego.

**Główne elementy:**

- `<div>` kontener z grid layout
- `<AssignmentCard>` dla każdego przypisania

**Obsługiwane interakcje:**

- Przekazywane do kart potomnych

**Walidacja:** Brak

**Typy:**

- `AssignmentViewModel[]`

**Propsy:**

```typescript
interface AssignmentCardsProps {
  assignments: AssignmentViewModel[];
  onEdit: (assignment: AssignmentDTO) => void;
  onDelete: (assignment: AssignmentDTO) => void;
  isLoading?: boolean;
}
```

### AssignmentCard.tsx

**Opis:** Pojedyncza karta przedstawiająca przypisanie w widoku mobilnym.

**Główne elementy:**

- `<Card>` (Shadcn Card)
- `<CardHeader>` z nazwą kierowcy i badge statusu
- `<CardContent>` z numerem pojazdu i zakresem dat
- `<CardFooter>` z menu akcji

**Obsługiwane interakcje:**

- `onEdit`
- `onDelete`

**Walidacja:** Brak

**Typy:**

- `AssignmentViewModel`

**Propsy:**

```typescript
interface AssignmentCardProps {
  assignment: AssignmentViewModel;
  onEdit: (assignment: AssignmentDTO) => void;
  onDelete: (assignment: AssignmentDTO) => void;
}
```

### AssignmentFormModal.tsx

**Opis:** Modal z formularzem dodawania lub edycji przypisania. Wykorzystuje React Hook Form + Zod do walidacji.

**Główne elementy:**

- `<Dialog>` lub `<Sheet>` (responsive)
- `<DialogHeader>` z tytułem ("Dodaj przypisanie" / "Edytuj przypisanie")
- `<Form>` z polami:
  - `<FormField>` dla DriverSelect
  - `<FormField>` dla VehicleSelect
  - `<FormField>` dla startDate (DatePicker)
  - `<FormField>` dla endDate (DatePicker, opcjonalne)
- `<Alert>` dla błędów konfliktu (409)
- `<DialogFooter>` z przyciskami Anuluj/Zapisz

**Obsługiwane interakcje:**

- `onSubmit` - waliduje i wysyła dane
- `onCancel` - zamyka modal z potwierdzeniem jeśli formularz zmieniony
- Wybór kierowcy z listy aktywnych
- Wybór pojazdu z listy aktywnych
- Wybór daty z kalendarza
- Wyświetlanie błędów walidacji inline

**Walidacja:**

- `driverUuid` - wymagane, musi być UUID z listy aktywnych kierowców
- `vehicleUuid` - wymagane, musi być UUID z listy aktywnych pojazdów
- `startDate` - wymagane, format YYYY-MM-DD, nie może być puste
- `endDate` - opcjonalne, format YYYY-MM-DD, jeśli podane musi być >= startDate
- Sprawdzenie zakresu dat: endDate >= startDate (błąd kliencki)
- Sprawdzenie konfliktów: obsługa 409 z serwera

**Typy:**

- `AssignmentFormData`
- `CreateAssignmentCommand` | `UpdateAssignmentCommand`
- `AssignmentDTO` (przy edycji)
- `DriverDTO[]`
- `VehicleDTO[]`

**Propsy:**

```typescript
interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  assignment?: AssignmentDTO; // dla trybu edycji
  drivers: DriverDTO[];
  vehicles: VehicleDTO[];
  onSubmit: (data: AssignmentFormData) => Promise<void>;
}
```

### DeleteAssignmentDialog.tsx

**Opis:** Dialog potwierdzenia usunięcia przypisania.

**Główne elementy:**

- `<AlertDialog>` (Shadcn AlertDialog)
- `<AlertDialogHeader>` z tytułem "Usuń przypisanie"
- `<AlertDialogDescription>` z ostrzeżeniem i szczegółami przypisania
- `<AlertDialogFooter>` z przyciskami:
  - `<AlertDialogCancel>` "Anuluj"
  - `<AlertDialogAction>` "Usuń" (destructive variant)

**Obsługiwane interakcje:**

- `onConfirm` - wykonuje usunięcie
- `onCancel` - zamyka dialog

**Walidacja:** Brak

**Typy:**

- `AssignmentDTO`
- `AssignmentViewModel` (dla wyświetlenia nazw)

**Propsy:**

```typescript
interface DeleteAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentViewModel | null;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}
```

### EmptyState.tsx

**Opis:** Komponent wyświetlany gdy lista przypisań jest pusta.

**Główne elementy:**

- `<div>` kontener z centrowaniem
- Ikona lub ilustracja (np. Calendar icon)
- `<p>` komunikat "Brak przypisań"
- `<p>` podpowiedź "Dodaj pierwsze przypisanie, aby rozpocząć zarządzanie harmonogramem"
- `<Button>` "Dodaj przypisanie"

**Obsługiwane interakcje:**

- `onAddClick` - otwiera formularz dodawania

**Walidacja:** Brak

**Typy:** Brak

**Propsy:**

```typescript
interface EmptyStateProps {
  onAddClick: () => void;
  hasFilters?: boolean; // zmienia komunikat jeśli są aktywne filtry
}
```

## 5. Typy

### Typy z API (już zdefiniowane w types.ts)

```typescript
// src/types.ts (istniejące)
export type AssignmentDTO = PickCamel<
  Tables<"driver_vehicle_assignments">,
  "uuid" | "driver_uuid" | "vehicle_uuid" | "company_uuid" | "start_date" | "end_date"
>;

export type CreateAssignmentCommand = PickCamel<
  TablesInsert<"driver_vehicle_assignments">,
  "driver_uuid" | "vehicle_uuid" | "start_date" | "end_date"
>;

export type UpdateAssignmentCommand = Partial<CreateAssignmentCommand>;

export type AssignmentsListResponseDTO = Paginated<AssignmentDTO>;
```

Po transformacji camelCase:

```typescript
interface AssignmentDTO {
  uuid: Uuid;
  driverUuid: Uuid;
  vehicleUuid: Uuid;
  companyUuid: Uuid;
  startDate: IsoDateOnlyString; // "YYYY-MM-DD"
  endDate: IsoDateOnlyString | null; // "YYYY-MM-DD" or null (ongoing)
}

interface CreateAssignmentCommand {
  driverUuid: Uuid;
  vehicleUuid: Uuid;
  startDate: IsoDateOnlyString;
  endDate: IsoDateOnlyString | null;
}

interface UpdateAssignmentCommand {
  driverUuid?: Uuid;
  vehicleUuid?: Uuid;
  startDate?: IsoDateOnlyString;
  endDate?: IsoDateOnlyString | null;
}

interface AssignmentsListResponseDTO {
  items: AssignmentDTO[];
  nextCursor: string | null;
}
```

### Nowe typy do dodania

```typescript
// src/lib/assignments/assignmentTypes.ts

import type { AssignmentDTO, DriverDTO, VehicleDTO, IsoDateOnlyString } from "@/types";

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
```

## 6. Zarządzanie stanem

### Stan lokalny komponentów

**AssignmentsViewWithProvider:**

```typescript
const [isFormOpen, setIsFormOpen] = useState(false);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [formMode, setFormMode] = useState<"create" | "edit">("create");
const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDTO | null>(null);
const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
const [filters, setFilters] = useState<AssignmentFilters>({
  sortBy: "startDate",
  sortDir: "asc",
  limit: 50,
});
```

**AssignmentFormModal:**

```typescript
// React Hook Form
const form = useForm<AssignmentFormData>({
  resolver: zodResolver(assignmentFormSchema),
  defaultValues: {
    driverUuid: "",
    vehicleUuid: "",
    startDate: "",
    endDate: "",
  },
});

const [conflictError, setConflictError] = useState<AssignmentConflictError | null>(null);
```

### Custom Hooks

#### useAssignments

```typescript
// src/lib/assignments/useAssignments.ts
import { useQuery } from "@tanstack/react-query";
import type { AssignmentFilters, AssignmentViewModel } from "./assignmentTypes";
import type { AssignmentsListResponseDTO, DriverDTO, VehicleDTO } from "@/types";

export function useAssignments(filters: AssignmentFilters) {
  return useQuery({
    queryKey: ["assignments", filters],
    queryFn: async (): Promise<AssignmentViewModel[]> => {
      // 1. Fetch assignments
      const params = new URLSearchParams();
      if (filters.driverUuid) params.set("driverUuid", filters.driverUuid);
      if (filters.vehicleUuid) params.set("vehicleUuid", filters.vehicleUuid);
      if (filters.activeOn) params.set("activeOn", filters.activeOn);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortDir) params.set("sortDir", filters.sortDir);
      if (filters.limit) params.set("limit", filters.limit.toString());
      if (filters.cursor) params.set("cursor", filters.cursor);

      const response = await fetch(`/api/assignments?${params}`);
      if (!response.ok) throw new Error("Failed to fetch assignments");

      const data: AssignmentsListResponseDTO = await response.json();

      // 2. Fetch drivers and vehicles (parallel, cached)
      const [driversRes, vehiclesRes] = await Promise.all([
        fetch("/api/drivers?isActive=true"),
        fetch("/api/vehicles?isActive=true"),
      ]);

      const drivers: DriverDTO[] = (await driversRes.json()).items || [];
      const vehicles: VehicleDTO[] = (await vehiclesRes.json()).items || [];

      // 3. Transform to ViewModels
      const today = new Date().toISOString().split("T")[0];

      return data.items.map((assignment) => {
        const driver = drivers.find((d) => d.uuid === assignment.driverUuid);
        const vehicle = vehicles.find((v) => v.uuid === assignment.vehicleUuid);

        const isActive = assignment.startDate <= today && (!assignment.endDate || assignment.endDate >= today);

        const status =
          assignment.startDate > today
            ? "upcoming"
            : !assignment.endDate || assignment.endDate >= today
              ? "active"
              : "completed";

        const daysRemaining =
          assignment.endDate && status === "active"
            ? Math.ceil((new Date(assignment.endDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
            : null;

        return {
          assignment,
          driverName: driver?.name || "Nieznany kierowca",
          vehicleRegistration: vehicle?.registrationNumber || "Nieznany pojazd",
          isActive,
          status,
          daysRemaining,
        };
      });
    },
    staleTime: 30000, // 30s
    refetchInterval: 60000, // auto-refresh co 60s
  });
}
```

#### useCreateAssignment

```typescript
// src/lib/assignments/useCreateAssignment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateAssignmentCommand, AssignmentDTO } from "@/types";
import { toast } from "sonner";

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssignmentCommand): Promise<AssignmentDTO> => {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Przypisanie zostało dodane");
    },
    onError: (error: any) => {
      if (error.code === "ASSIGNMENT_OVERLAP") {
        // Error handled in form component
        return;
      }
      toast.error(error.message || "Nie udało się dodać przypisania");
    },
  });
}
```

#### useUpdateAssignment

```typescript
// src/lib/assignments/useUpdateAssignment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateAssignmentCommand, AssignmentDTO, Uuid } from "@/types";
import { toast } from "sonner";

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data }: { uuid: Uuid; data: UpdateAssignmentCommand }): Promise<AssignmentDTO> => {
      const response = await fetch(`/api/assignments/${uuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Przypisanie zostało zaktualizowane");
    },
    onError: (error: any) => {
      if (error.code === "ASSIGNMENT_OVERLAP") {
        return;
      }
      toast.error(error.message || "Nie udało się zaktualizować przypisania");
    },
  });
}
```

#### useDeleteAssignment

```typescript
// src/lib/assignments/useDeleteAssignment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Uuid } from "@/types";
import { toast } from "sonner";

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: Uuid): Promise<void> => {
      const response = await fetch(`/api/assignments/${uuid}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Przypisanie zostało usunięte");
    },
    onError: (error: any) => {
      toast.error(error.message || "Nie udało się usunąć przypisania");
    },
  });
}
```

#### useDrivers i useVehicles

```typescript
// src/lib/assignments/useDrivers.ts
import { useQuery } from "@tanstack/react-query";
import type { DriverDTO } from "@/types";

export function useDrivers() {
  return useQuery({
    queryKey: ["drivers", "active"],
    queryFn: async (): Promise<DriverDTO[]> => {
      const response = await fetch("/api/drivers?isActive=true");
      if (!response.ok) throw new Error("Failed to fetch drivers");
      const data = await response.json();
      return data.items || [];
    },
    staleTime: 60000, // 1 min
  });
}

// src/lib/assignments/useVehicles.ts
import { useQuery } from "@tanstack/react-query";
import type { VehicleDTO } from "@/types";

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles", "active"],
    queryFn: async (): Promise<VehicleDTO[]> => {
      const response = await fetch("/api/vehicles?isActive=true");
      if (!response.ok) throw new Error("Failed to fetch vehicles");
      const data = await response.json();
      return data.items || [];
    },
    staleTime: 60000, // 1 min
  });
}
```

## 7. Integracja API

### Endpointy

#### GET /api/assignments

**Parametry zapytania:**

- `driverUuid?: string` - filtrowanie po UUID kierowcy
- `vehicleUuid?: string` - filtrowanie po UUID pojazdu
- `activeOn?: string` - filtrowanie po dacie aktywności (YYYY-MM-DD)
- `limit?: number` - limit wyników (domyślnie 50)
- `cursor?: string` - kursor paginacji
- `sortBy?: 'startDate' | 'endDate' | 'createdAt'` - pole sortowania
- `sortDir?: 'asc' | 'desc'` - kierunek sortowania

**Typ odpowiedzi:** `AssignmentsListResponseDTO`

```typescript
{
  items: AssignmentDTO[];
  nextCursor: string | null;
}
```

**Kody odpowiedzi:**

- 200 - sukces
- 401 - nieautoryzowany
- 403 - brak uprawnień

#### POST /api/assignments

**Typ żądania:** `CreateAssignmentCommand`

```typescript
{
  driverUuid: string;
  vehicleUuid: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string | null; // "YYYY-MM-DD" or null
}
```

**Typ odpowiedzi:** `AssignmentDTO` (201 Created)

**Kody odpowiedzi:**

- 201 - utworzono
- 400 - nieprawidłowy zakres dat (endDate < startDate)
- 401 - nieautoryzowany
- 403 - brak uprawnień
- 409 - konflikt (nakładające się przypisanie)

**Struktura błędu 409:**

```typescript
{
  code: "ASSIGNMENT_OVERLAP",
  message: "To przypisanie koliduje z istniejącym",
  details?: {
    conflictingAssignment: {
      uuid: string;
      startDate: string;
      endDate: string | null;
    }
  }
}
```

#### PATCH /api/assignments/{uuid}

**Typ żądania:** `UpdateAssignmentCommand`

```typescript
{
  driverUuid?: string;
  vehicleUuid?: string;
  startDate?: string;
  endDate?: string | null;
}
```

**Typ odpowiedzi:** `AssignmentDTO` (200 OK)

**Kody odpowiedzi:**

- 200 - zaktualizowano
- 400 - nieprawidłowy zakres dat
- 401 - nieautoryzowany
- 403 - brak uprawnień
- 404 - nie znaleziono
- 409 - konflikt

#### DELETE /api/assignments/{uuid}

**Typ żądania:** brak body

**Typ odpowiedzi:** brak (204 No Content)

**Kody odpowiedzi:**

- 204 - usunięto
- 401 - nieautoryzowany
- 403 - brak uprawnień
- 404 - nie znaleziono

## 8. Interakcje użytkownika

### 1. Przeglądanie listy przypisań

**Akcja:** Użytkownik wchodzi na `/assignments`

**Przebieg:**

1. Widok ładuje się z domyślnymi filtrami (sortBy: startDate, sortDir: asc)
2. Hook `useAssignments` wykonuje zapytanie GET `/api/assignments`
3. Podczas ładowania wyświetlane są skeletony
4. Po załadowaniu dane prezentowane w tabeli (desktop) lub kartach (mobile)
5. Każde przypisanie pokazuje: kierowcę, pojazd, zakres dat, status (badge)

**Stany:**

- Loading - skeletony
- Success - tabela/karty z danymi
- Empty - EmptyState component
- Error - komunikat błędu z przyciskiem retry

### 2. Filtrowanie listy

**Akcja:** Użytkownik zmienia filtry (wybiera kierowcę/pojazd/datę)

**Przebieg:**

1. Zmiana wartości w AssignmentsFiltersBar
2. Wywołanie `onFiltersChange` z nowymi filtrami
3. Aktualizacja stanu `filters` w AssignmentsViewWithProvider
4. Hook `useAssignments` automatycznie refetchuje z nowymi parametrami
5. Lista się aktualizuje
6. Opcjonalnie: URL params są aktualizowane dla możliwości udostępniania linka

**Zachowanie:**

- Debounce dla date pickera (200ms)
- Loading state podczas pobierania
- Przycisk "Wyczyść filtry" resetuje wszystkie filtry

### 3. Dodawanie nowego przypisania

**Akcja:** Użytkownik klika "Dodaj przypisanie"

**Przebieg:**

1. Otwiera się AssignmentFormModal w trybie 'create'
2. Formularz jest pusty, focus na pierwszym polu (DriverSelect)
3. Użytkownik wybiera kierowcę (wyszukiwanie w select)
4. Użytkownik wybiera pojazd (wyszukiwanie w select)
5. Użytkownik wybiera datę rozpoczęcia (calendar picker)
6. Użytkownik opcjonalnie wybiera datę zakończenia
7. Użytkownik klika "Zapisz"
8. Walidacja po stronie klienta (Zod schema):
   - Wszystkie wymagane pola wypełnione
   - Daty w poprawnym formacie
   - endDate >= startDate (jeśli podane)
9. Jeśli walidacja przejdzie:
   - Wywołanie `createAssignment.mutate()`
   - POST `/api/assignments`
10. Odpowiedzi:
    - **201 Created:** Toast sukcesu, zamknięcie modala, odświeżenie listy
    - **400 Bad Request:** Wyświetlenie błędu pod odpowiednim polem
    - **409 Conflict:** Wyświetlenie AlertDialog z komunikatem o konflikcie i szczegółami
11. Użytkownik może zamknąć modal (ESC, klik poza, przycisk Anuluj)

**Walidacja Zod:**

```typescript
const assignmentFormSchema = z
  .object({
    driverUuid: z.string().uuid("Wybierz kierowcę"),
    vehicleUuid: z.string().uuid("Wybierz pojazd"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.endDate || data.endDate === "") return true;
      return new Date(data.endDate) >= new Date(data.startDate);
    },
    {
      message: "Data zakończenia musi być późniejsza lub równa dacie rozpoczęcia",
      path: ["endDate"],
    }
  );
```

### 4. Edycja przypisania

**Akcja:** Użytkownik klika "Edytuj" w menu akcji wiersza/karty

**Przebieg:**

1. Otwiera się AssignmentFormModal w trybie 'edit'
2. Formularz jest wstępnie wypełniony danymi z `selectedAssignment`
3. Użytkownik modyfikuje pola (np. zmienia daty)
4. Użytkownik klika "Zapisz"
5. Walidacja (jak przy tworzeniu)
6. Wywołanie `updateAssignment.mutate({ uuid, data })`
7. PATCH `/api/assignments/{uuid}`
8. Odpowiedzi:
   - **200 OK:** Toast sukcesu, zamknięcie modala, odświeżenie listy
   - **400/409:** Obsługa błędów jak przy tworzeniu
   - **404 Not Found:** Toast "Nie znaleziono przypisania", zamknięcie modala, odświeżenie listy

**Szczegóły:**

- Można edytować wszystkie pola (driver, vehicle, dates)
- Edycja historycznych przypisań powinna być możliwa (brak blokady)
- Warning jeśli użytkownik próbuje edytować aktywne przypisanie?

### 5. Usuwanie przypisania

**Akcja:** Użytkownik klika "Usuń" w menu akcji

**Przebieg:**

1. Otwiera się DeleteAssignmentDialog
2. Dialog pokazuje szczegóły przypisania i komunikat:
   - "Czy na pewno chcesz usunąć to przypisanie?"
   - Kierowca: [nazwa]
   - Pojazd: [numer]
   - Okres: [startDate] - [endDate]
3. Focus na przycisku "Anuluj" (bezpieczniejsza opcja)
4. Użytkownik klika "Usuń"
5. Wywołanie `deleteAssignment.mutate(uuid)`
6. DELETE `/api/assignments/{uuid}`
7. Odpowiedzi:
   - **204 No Content:** Toast "Przypisanie zostało usunięte", zamknięcie dialogu, odświeżenie listy
   - **404 Not Found:** Toast "Nie znaleziono przypisania", zamknięcie dialogu, odświeżenie listy
   - **Błąd sieci:** Toast "Błąd połączenia", dialog pozostaje otwarty

**Uwaga:** Hard delete - przypisanie jest całkowicie usuwane z bazy.

### 6. Sortowanie

**Akcja:** Użytkownik klika nagłówek kolumny w tabeli

**Przebieg:**

1. Wywołanie `onSortChange(columnName, newDirection)`
2. Aktualizacja stanu `filters` (sortBy, sortDir)
3. Hook `useAssignments` refetchuje z nowymi parametrami
4. Lista się aktualizuje
5. Ikona sortowania (chevron) w nagłówku wskazuje aktualny kierunek

**Kolumny z sortowaniem:**

- Data rozpoczęcia (startDate)
- Data zakończenia (endDate)
- Domyślnie: startDate asc

### 7. Obsługa pustej listy

**Akcja:** Brak przypisań (lub wyniki filtrowania puste)

**Przebieg:**

1. Sprawdzenie `assignments.length === 0`
2. Jeśli są aktywne filtry: "Brak wyników. Spróbuj zmienić filtry."
3. Jeśli brak filtrów: EmptyState z przyciskiem "Dodaj pierwsze przypisanie"
4. Kliknięcie przycisku otwiera formularz dodawania

## 9. Warunki i walidacja

### Walidacja po stronie klienta (formularze)

**Komponent:** AssignmentFormModal

**Warunki dla driverUuid:**

- Wymagane: `required: true`
- Typ: UUID
- Źródło: wybór z listy aktywnych kierowców (`useDrivers()`)
- Komunikat błędu: "Wybierz kierowcę"
- Walidacja: Zod `.string().uuid()`

**Warunki dla vehicleUuid:**

- Wymagane: `required: true`
- Typ: UUID
- Źródło: wybór z listy aktywnych pojazdów (`useVehicles()`)
- Komunikat błędu: "Wybierz pojazd"
- Walidacja: Zod `.string().uuid()`

**Warunki dla startDate:**

- Wymagane: `required: true`
- Format: YYYY-MM-DD
- Walidacja: Zod `.string().regex(/^\d{4}-\d{2}-\d{2}$/)`
- Komunikat błędu: "Data rozpoczęcia jest wymagana"
- UI: DatePicker (Shadcn Calendar)

**Warunki dla endDate:**

- Wymagane: `optional: true`
- Format: YYYY-MM-DD
- Walidacja: Zod `.string().regex(...).optional().or(z.literal(''))`
- Warunek dodatkowy: `endDate >= startDate` (custom refine)
- Komunikat błędu (jeśli < startDate): "Data zakończenia musi być późniejsza lub równa dacie rozpoczęcia"
- UI: DatePicker (Shadcn Calendar)

**Walidacja kompleksowa (Zod refine):**

```typescript
.refine((data) => {
  if (!data.endDate || data.endDate === '') return true;
  return new Date(data.endDate) >= new Date(data.startDate);
}, {
  message: 'Data zakończenia musi być późniejsza lub równa dacie rozpoczęcia',
  path: ['endDate'],
});
```

### Walidacja po stronie klienta (filtry)

**Komponent:** AssignmentsFiltersBar

**Warunki dla activeOn:**

- Wymagane: `optional: true`
- Format: YYYY-MM-DD
- Walidacja: Podstawowa walidacja daty (DatePicker zapewnia poprawny format)
- UI: DatePicker

**Pozostałe filtry:**

- `driverUuid`, `vehicleUuid` - dropdown select, zawsze poprawne UUID
- `sortBy`, `sortDir` - kontrolowane wartości z enum

### Walidacja po stronie serwera (obsługa błędów)

**Kod 400 - Bad Request:**

- Przyczyna: Nieprawidłowy zakres dat (endDate < startDate) lub nieprawidłowy format
- Obsługa: Wyświetlenie komunikatu błędu w formularzu pod odpowiednim polem
- Komponent: AssignmentFormModal
- Metoda: `setError()` z react-hook-form

**Kod 409 - Conflict:**

- Przyczyna: Nakładające się przypisanie (overlap)
- Obsługa: Wyświetlenie Alert component z szczegółami konfliktu
- Komponent: AssignmentFormModal
- Treść:

  ```
  To przypisanie koliduje z istniejącym:
  - Kierowca/Pojazd: [nazwa/numer]
  - Okres: [startDate] - [endDate]

  Zmień daty lub wybierz innego kierowcę/pojazd.
  ```

- Stan: `conflictError` w komponencie formularza

**Kod 404 - Not Found:**

- Przyczyna: Przypisanie, kierowca lub pojazd nie istnieje
- Obsługa: Toast z komunikatem, zamknięcie modala, odświeżenie listy
- Dotyczy: Edycja, usuwanie

**Kod 403 - Forbidden:**

- Przyczyna: Brak uprawnień do operacji
- Obsługa: Toast "Brak uprawnień do wykonania tej operacji"

### Sprawdzanie warunków w UI

**Wyświetlanie statusu przypisania:**

- Komponent: AssignmentRow, AssignmentCard
- Warunek `active`: `startDate <= today && (!endDate || endDate >= today)`
- Warunek `upcoming`: `startDate > today`
- Warunek `completed`: `endDate && endDate < today`
- Prezentacja: Badge z odpowiednim kolorem

**Blokowanie niedostępnych opcji:**

- Selecty kierowców/pojazdów pokazują tylko aktywnych (`isActive: true`)
- Nieaktywni kierowcy/pojazdy nie są dostępne w formularzu

**Ostrzeżenia:**

- Opcjonalnie: Warning jeśli próba utworzenia przypisania z datą startDate w przeszłości
- Opcjonalnie: Info jeśli endDate jest null ("Przypisanie bezterminowe")

## 10. Obsługa błędów

### Błędy API

#### 1. Błąd 409 - Konflikt przypisań (overlap)

**Miejsce wystąpienia:** POST/PATCH `/api/assignments`

**Obsługa w komponencie AssignmentFormModal:**

```typescript
const createMutation = useCreateAssignment();

const onSubmit = async (data: AssignmentFormData) => {
  try {
    setConflictError(null);

    const command: CreateAssignmentCommand = {
      driverUuid: data.driverUuid,
      vehicleUuid: data.vehicleUuid,
      startDate: data.startDate,
      endDate: data.endDate || null,
    };

    await createMutation.mutateAsync(command);
    onClose();
  } catch (error: any) {
    if (error.code === "ASSIGNMENT_OVERLAP") {
      setConflictError(error);
      // Error wyświetlany w Alert component w formularzu
    } else {
      // Inne błędy obsługiwane przez toast w hooku
    }
  }
};
```

**Prezentacja błędu:**

```tsx
{
  conflictError && (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Konflikt przypisań</AlertTitle>
      <AlertDescription>
        {conflictError.message}
        {conflictError.details?.conflictingAssignment && (
          <div className="mt-2 text-sm">
            <p>Istniejące przypisanie:</p>
            <ul className="list-disc list-inside">
              <li>
                Okres: {conflictError.details.conflictingAssignment.startDate} -
                {conflictError.details.conflictingAssignment.endDate || "bezterminowo"}
              </li>
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

#### 2. Błąd 400 - Nieprawidłowy zakres dat

**Miejsce wystąpienia:** POST/PATCH `/api/assignments`

**Obsługa:**

```typescript
catch (error: any) {
  if (error.code === 'INVALID_DATE_RANGE') {
    form.setError('endDate', {
      type: 'manual',
      message: error.message || 'Data zakończenia musi być późniejsza od daty rozpoczęcia',
    });
  }
}
```

**Prezentacja:** Inline error pod polem `endDate` w formularzu (react-hook-form)

#### 3. Błąd 404 - Nie znaleziono zasobu

**Miejsca wystąpienia:** PATCH/DELETE `/api/assignments/{uuid}`

**Obsługa:**

```typescript
// W hooku useUpdateAssignment / useDeleteAssignment
onError: (error: any) => {
  if (error.status === 404) {
    toast.error("Nie znaleziono przypisania. Mogło zostać już usunięte.");
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
  } else {
    toast.error(error.message || "Wystąpił błąd");
  }
};
```

**Akcja:** Zamknięcie modala/dialogu, odświeżenie listy

#### 4. Błąd 403 - Brak uprawnień

**Obsługa:**

```typescript
if (error.status === 403) {
  toast.error("Brak uprawnień do wykonania tej operacji");
}
```

### Błędy ładowania danych

#### Błąd pobierania listy przypisań

**Hook:** `useAssignments`

**Obsługa w komponencie:**

```tsx
const { data: assignments, isLoading, isError, error, refetch } = useAssignments(filters);

if (isError) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <p className="text-lg font-semibold mb-2">Nie udało się załadować przypisań</p>
      <p className="text-muted-foreground mb-4">{error?.message}</p>
      <Button onClick={() => refetch()}>Spróbuj ponownie</Button>
    </div>
  );
}
```

#### Błąd pobierania kierowców/pojazdów

**Hook:** `useDrivers`, `useVehicles`

**Obsługa:**

```tsx
const { data: drivers, isLoading: driversLoading, isError: driversError } = useDrivers();
const { data: vehicles, isLoading: vehiclesLoading, isError: vehiclesError } = useVehicles();

// W formularzu
{
  driversError && <p className="text-sm text-destructive">Nie udało się załadować listy kierowców</p>;
}

{
  vehiclesError && <p className="text-sm text-destructive">Nie udało się załadować listy pojazdów</p>;
}
```

**Alternatywa:** Wyłączenie formularza jeśli dane nie zostały załadowane:

```tsx
const canSubmit = !driversLoading && !vehiclesLoading && !driversError && !vehiclesError;
```

### Błędy walidacji formularza

**Obsługa przez react-hook-form + Zod:**

- Błędy wyświetlane inline pod polami
- Komponent FormField z shadcn/ui automatycznie renderuje FormMessage
- Przycisk Submit disabled jeśli formularz nieważny

**Przykład:**

```tsx
<FormField
  control={form.control}
  name="startDate"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Data rozpoczęcia</FormLabel>
      <FormControl>
        <DatePicker {...field} />
      </FormControl>
      <FormMessage /> {/* Wyświetla błędy walidacji */}
    </FormItem>
  )}
/>
```

### Błędy sieciowe

**Obsługa:** Globalny error handler w TanStack Query

```typescript
// W query-client.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      onError: (error: any) => {
        if (error.message === "Failed to fetch") {
          toast.error("Błąd połączenia. Sprawdź połączenie z internetem.");
        }
      },
    },
    mutations: {
      onError: (error: any) => {
        if (error.message === "Failed to fetch") {
          toast.error("Błąd połączenia. Sprawdź połączenie z internetem.");
        }
      },
    },
  },
});
```

### Stan pustej listy

**Nie jest błędem, ale wymaga specjalnej obsługi:**

```tsx
if (!isLoading && assignments.length === 0) {
  return <EmptyState onAddClick={handleAddClick} hasFilters={hasActiveFilters(filters)} />;
}
```

**EmptyState powinien różnicować:**

- Brak wyników filtrowania: "Brak wyników. Spróbuj zmienić filtry."
- Całkowicie pusta lista: "Brak przypisań. Dodaj pierwsze przypisanie, aby rozpocząć."

### Obsługa timeout i retry

**TanStack Query automatycznie:**

- Retry failed queries (1x dla queries, 0x dla mutations)
- Timeout po braku odpowiedzi (domyślnie brak, można dodać)

**Opcjonalne ustawienie:**

```typescript
useQuery({
  queryKey: ["assignments", filters],
  queryFn: fetchAssignments,
  retry: 1,
  retryDelay: 1000,
  staleTime: 30000,
});
```

## 11. Kroki implementacji

### Etap 1: Struktura podstawowa i typy

1. **Utworzenie katalogu i plików struktury:**

   ```
   src/components/assignments/
   src/lib/assignments/
   src/pages/assignments.astro
   ```

2. **Definicja typów (src/lib/assignments/assignmentTypes.ts):**
   - `AssignmentViewModel`
   - `AssignmentFilters`
   - `AssignmentFormData`
   - `AssignmentConflictError`
   - `AssignmentsSearchParams`

3. **Utworzenie strony Astro (src/pages/assignments.astro):**

   ```astro
   ---
   import AuthenticatedLayout from "@/layouts/AuthenticatedLayout.astro";
   import AssignmentsViewWithProvider from "@/components/assignments/AssignmentsViewWithProvider";
   ---

   <AuthenticatedLayout title="Przypisania">
     <AssignmentsViewWithProvider client:only="react" />
   </AuthenticatedLayout>
   ```

### Etap 2: Custom hooks do komunikacji z API

4. **Implementacja `useAssignments` (src/lib/assignments/useAssignments.ts):**
   - Fetch assignments z filtrami
   - Join z drivers i vehicles dla nazw
   - Transform do AssignmentViewModel

5. **Implementacja `useDrivers` (src/lib/assignments/useDrivers.ts):**
   - Fetch aktywnych kierowców

6. **Implementacja `useVehicles` (src/lib/assignments/useVehicles.ts):**
   - Fetch aktywnych pojazdów

7. **Implementacja `useCreateAssignment` (src/lib/assignments/useCreateAssignment.ts):**
   - Mutation dla POST
   - Obsługa sukcesu (toast, invalidate queries)
   - Obsługa błędów (409, 400)

8. **Implementacja `useUpdateAssignment` (src/lib/assignments/useUpdateAssignment.ts):**
   - Mutation dla PATCH
   - Analogiczna obsługa jak create

9. **Implementacja `useDeleteAssignment` (src/lib/assignments/useDeleteAssignment.ts):**
   - Mutation dla DELETE
   - Obsługa sukcesu i błędów

### Etap 3: Komponenty główne

10. **Implementacja `AssignmentsViewWithProvider` (src/components/assignments/AssignmentsViewWithProvider.tsx):**
    - Stan: filters, isFormOpen, isDeleteDialogOpen, formMode, selectedAssignment
    - Wywołanie hooków danych
    - Renderowanie komponentów potomnych
    - Obsługa otwarcia/zamknięcia modali

11. **Implementacja `AssignmentsHeader` (src/components/assignments/AssignmentsHeader.tsx):**
    - Tytuł strony
    - Przycisk "Dodaj przypisanie"
    - Opcjonalnie: toggle widoku

12. **Implementacja `AssignmentsFiltersBar` (src/components/assignments/AssignmentsFiltersBar.tsx):**
    - Select dla kierowcy (shadcn Select z Command dla wyszukiwania)
    - Select dla pojazdu
    - DatePicker dla activeOn
    - Przycisk "Wyczyść filtry"
    - Propagacja zmian do rodzica

### Etap 4: Komponenty listy

13. **Implementacja `AssignmentsTable` (src/components/assignments/AssignmentsTable.tsx):**
    - Shadcn Table
    - Nagłówki z sortowaniem
    - Mapowanie assignments do AssignmentRow
    - Responsywność (ukrywanie na mobile)

14. **Implementacja `AssignmentRow` (src/components/assignments/AssignmentRow.tsx):**
    - Komórki tabeli
    - StatusBadge dla statusu
    - DropdownMenu z akcjami (Edytuj, Usuń)

15. **Implementacja `AssignmentCards` (src/components/assignments/AssignmentCards.tsx):**
    - Grid layout dla mobile
    - Mapowanie do AssignmentCard
    - Widoczne tylko na mobile (Tailwind breakpoints)

16. **Implementacja `AssignmentCard` (src/components/assignments/AssignmentCard.tsx):**
    - Shadcn Card
    - CardHeader z nazwą kierowcy i badge
    - CardContent z pojazdem i datami
    - CardFooter z menu akcji

17. **Implementacja `EmptyState` (src/components/assignments/EmptyState.tsx):**
    - Ilustracja (Calendar icon)
    - Komunikat
    - Przycisk "Dodaj przypisanie"
    - Warianty dla pustej listy vs. brak wyników filtrowania

### Etap 5: Formularz dodawania/edycji

18. **Utworzenie schematu walidacji Zod (src/lib/assignments/assignmentFormSchema.ts):**

    ```typescript
    export const assignmentFormSchema = z.object({
      driverUuid: z.string().uuid('Wybierz kierowcę'),
      vehicleUuid: z.string().uuid('Wybierz pojazd'),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy format daty'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Nieprawidłowy format daty').optional().or(z.literal('')),
    }).refine(...);
    ```

19. **Implementacja `AssignmentFormModal` (src/components/assignments/AssignmentFormModal.tsx):**
    - Dialog (desktop) / Sheet (mobile) z shadcn
    - React Hook Form z zodResolver
    - FormFields dla każdego pola
    - DriverSelect - select z wyszukiwaniem (Command)
    - VehicleSelect - select z wyszukiwaniem
    - DatePicker dla startDate (required)
    - DatePicker dla endDate (optional)
    - Alert dla konfliktów (state: conflictError)
    - Przyciski: Anuluj, Zapisz (loading state)
    - Logika submit: walidacja → mutation → obsługa odpowiedzi
    - Pre-populacja przy edycji (useEffect gdy mode === 'edit')

20. **Implementacja komponentów pomocniczych formularza:**
    - DatePicker wrapper (jeśli nie istnieje)
    - Combobox dla selectów z wyszukiwaniem (jeśli nie istnieje w ui/)

### Etap 6: Dialog usuwania

21. **Implementacja `DeleteAssignmentDialog` (src/components/assignments/DeleteAssignmentDialog.tsx):**
    - AlertDialog z shadcn
    - Wyświetlenie szczegółów przypisania
    - Ostrzeżenie
    - Focus na przycisku Anuluj
    - Obsługa potwierdzenia (mutation delete)
    - Loading state podczas usuwania

### Etap 7: Integracja i polish

22. **Dodanie routingu:**
    - Aktualizacja nawigacji w `DesktopSidebar.tsx` i `MobileLayout.tsx`
    - Ikona: np. Calendar z lucide-react
    - Opcjonalnie: feature flag (warunkowe renderowanie)

23. **Stylowanie i responsywność:**
    - Tailwind classes dla layoutu
    - Breakpointy dla mobile/desktop views
    - Dark mode compatibility (jeśli stosowane)

24. **Accessibility:**
    - ARIA labels dla akcji
    - Focus management w modalach (focus trap)
    - Keyboard navigation w tabelach i menu
    - Screen reader friendly labels

25. **Loading states:**
    - Skeletony dla tabeli podczas ładowania (Shadcn Skeleton)
    - Disabled state przycisków podczas mutacji
    - Spinners w przyciskach submit (LoaderCircle icon)

26. **Error states:**
    - Wyświetlanie błędów zgodnie z sekcją 10
    - Toasty dla globalnych błędów (Sonner)
    - Inline errors w formularzach

### Etap 8: Testowanie i debugowanie

27. **Testy manualne:**
    - Tworzenie przypisania (happy path)
    - Tworzenie z konfliktem (409)
    - Tworzenie z nieprawidłowym zakresem dat (400)
    - Edycja przypisania
    - Usuwanie przypisania
    - Filtrowanie (każdy filtr osobno i w kombinacji)
    - Sortowanie
    - Paginacja (jeśli > 50 wyników)
    - Responsywność mobile/desktop
    - Pusta lista (empty state)
    - Błędy sieciowe (offline)

28. **Edge cases:**
    - Przypisanie bez endDate (bezterminowe)
    - Edycja aktywnego przypisania
    - Usuwanie przyszłego przypisania
    - Filtry bez wyników
    - Bardzo długie nazwy kierowców/pojazdów
    - Szybkie wielokrotne kliknięcia (debounce, disabled buttons)

29. **Performance:**
    - Sprawdzenie czasu ładowania listy
    - Optymalizacja renderowania (React.memo jeśli potrzebne)
    - Cache TanStack Query działa poprawnie

30. **Accessibility audit:**
    - Test keyboard navigation
    - Test screen reader (NVDA/VoiceOver)
    - Sprawdzenie kontrastu kolorów (WCAG AA)
    - Focus indicators widoczne

### Etap 9: Dokumentacja i finalizacja

31. **Dokumentacja:**
    - Komentarze JSDoc w kluczowych funkcjach
    - README w katalogu lib/assignments/ (jeśli stosowane)

32. **Code review:**
    - Sprawdzenie zgodności z guidelines projektu
    - Usunięcie console.logs
    - Formatowanie (Prettier)
    - Linting (ESLint)

33. **Git:**
    - Commit z opisowym message
    - Opcjonalnie: PR z opisem zmian

---

## Podsumowanie

Ten plan implementacji dostarcza szczegółowy przewodnik do stworzenia widoku Przypisań kierowca-pojazd w aplikacji RouteLog. Widok jest zgodny z architekturą aplikacji (Astro + React islands, TanStack Query, Shadcn/ui) i realizuje wszystkie wymagania opisane w dokumentacji API oraz UI.

Kluczowe aspekty implementacji:

- **Walidacja** na poziomie klienta (Zod) i obsługa błędów serwera (409, 400)
- **Responsywność** (desktop: tabela, mobile: karty)
- **Accessibility** (ARIA, focus management, keyboard navigation)
- **UX** (czytelne błędy konfliktów, empty states, loading states)
- **Bezpieczeństwo** (authenticated layout, guard, RLS przez Supabase)

Czas implementacji: około 2-3 dni roboczych dla doświadczonego frontend developera.
