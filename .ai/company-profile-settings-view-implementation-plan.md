# Plan implementacji widoku Ustawienia – Profil firmy

## 1. Przegląd

Widok „Ustawienia – Profil firmy" (`/settings/profile`) umożliwia zalogowanym użytkownikom (spedytorom) przeglądanie i edycję podstawowych danych firmy. Widok prezentuje informacje tylko do odczytu (UUID, data utworzenia) oraz umożliwia edycję nazwy firmy z walidacją i zapisem do backendu. Realizuje wymagania US-001 (utrzymanie danych firmy) i FR-01 (zarządzanie kontem). Widok działa w kontekście `AuthenticatedLayout`, który zapewnia nawigację i guard dla niezalogowanych użytkowników.

## 2. Routing widoku

- **Ścieżka:** `/settings/profile`
- **Layout:** Odziedziczony z `AuthenticatedLayout.astro`
- **Dostęp:** Wymaga zalogowania (Supabase JWT); nieautoryzowany dostęp przekieruje do `/signin` przez middleware

## 3. Struktura komponentów

Hierarchia komponentów widoku:

```
SettingsProfilePage (Astro)
├── SettingsLayout (Astro) [opcjonalny wrapper dla settings]
│   ├── SettingsSidebar / SettingsTabs
│   └── <slot>
├── CompanyProfileView (React)
    ├── PageHeader
    ├── CompanyInfoCard (React)
    │   ├── InfoRow (name, uuid, createdAt)
    │   └── HelpLink
    └── EditCompanyNameForm (React)
        ├── Label + Input (shadcn/ui)
        ├── ValidationMessage
        ├── Button (Zapisz)
        └── Toast (Sonner)
```

**Uwagi:**

- `SettingsLayout` może być dodatkową warstwą dla zakładek (`Profil`, `Alerty`, `Konto`) jeśli aplikacja posiada wiele ustawień; opcjonalnie w MVP może być zintegrowany bezpośrednio w `AuthenticatedLayout`.
- `CompanyProfileView` to główny komponent React odpowiedzialny za logikę, komunikację z API i zarządzanie stanem.

## 4. Szczegóły komponentów

### 4.1 SettingsProfilePage (Astro)

**Opis:**
Strona Astro dla `/settings/profile`; wrapper dla komponentu React. Odpowiada za preload danych firmy z API w server-side rendering i przekazanie ich jako props do React.

**Główne elementy:**

- Odczyt sesji użytkownika z `Astro.locals.user` (z middleware)
- Wywołanie `GET /api/companies/me` w server-side Astro
- Przekazanie danych `CompanyDTO` do `CompanyProfileView` jako props
- Obsługa błędów 404/500 (fallback do widoku błędu)

**Obsługiwane zdarzenia:**

- Nie dotyczy (strona statyczna Astro, logika w React)

**Warunki walidacji:**

- Weryfikacja obecności sesji przed renderowaniem (guard middleware)

**Typy:**

- `CompanyDTO` (import z `src/types.ts`)

**Propsy:**

- Brak (strona główna)

---

### 4.2 CompanyProfileView (React)

**Opis:**
Główny komponent widoku; zarządza stanem lokalnym edycji nazwy firmy oraz wywołaniami API do aktualizacji danych. Wyświetla informacje o firmie i formularz edycji nazwy. Obsługuje feedback użytkownika (toasty sukcesu/błędu). Wykorzystuje TanStack Query do synchronizacji danych z backendem.

**Główne elementy:**

```tsx
<div className="container mx-auto p-6 space-y-8">
  <PageHeader title="Profil firmy" description="Zarządzaj danymi swojej firmy" />
  <CompanyInfoCard company={company} />
  <EditCompanyNameForm company={company} onUpdate={handleUpdate} />
</div>
```

**Obsługiwane zdarzenia:**

- `onUpdate` – callback wywoływany po pomyślnej aktualizacji nazwy (rewalidacja danych w TanStack Query)

**Warunki walidacji:**

- Brak (delegowane do `EditCompanyNameForm`)

**Typy:**

- `CompanyDTO` (wejście)
- `UpdateCompanyCommand` (wyjście do API)

**Propsy:**

```tsx
interface CompanyProfileViewProps {
  initialCompany: CompanyDTO;
}
```

---

### 4.3 CompanyInfoCard (React)

**Opis:**
Prezentuje informacje o firmie tylko do odczytu: nazwa, UUID, data utworzenia. Widoczne w formacie karty z odpowiednim stylowaniem (shadcn/ui Card). Zapewnia użytkownikowi kontekst i wgląd w dane firmowe, które nie są edytowalne w tym widoku (UUID, created_at).

**Główne elementy:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Dane firmy</CardTitle>
  </CardHeader>
  <CardContent>
    <InfoRow label="Nazwa" value={company.name} />
    <InfoRow label="Identyfikator" value={company.uuid} copyable />
    <InfoRow label="Data utworzenia" value={formatDate(company.createdAt)} />
  </CardContent>
  <CardFooter>
    <HelpLink href="/help" />
  </CardFooter>
</Card>
```

**Obsługiwane zdarzenia:**

- Kliknięcie na `copyable` dla UUID (kopiowanie do schowka z feedbackiem toast)

**Warunki walidacji:**

- Brak (widok tylko do odczytu)

**Typy:**

- `CompanyDTO`

**Propsy:**

```tsx
interface CompanyInfoCardProps {
  company: CompanyDTO;
}
```

---

### 4.4 InfoRow (React)

**Opis:**
Pojedynczy wiersz informacji klucz–wartość, używany w `CompanyInfoCard`. Opcjonalnie wspiera kopiowanie wartości do schowka (np. dla UUID).

**Główne elementy:**

```tsx
<div className="flex justify-between items-center py-2 border-b last:border-0">
  <span className="text-sm font-medium text-muted-foreground">{label}</span>
  <div className="flex items-center gap-2">
    <span className="text-sm font-semibold">{value}</span>
    {copyable && (
      <Button variant="ghost" size="icon" onClick={handleCopy}>
        <CopyIcon />
      </Button>
    )}
  </div>
</div>
```

**Obsługiwane zdarzenia:**

- `onClick` (kopiowanie wartości przy `copyable=true`)

**Warunki walidacji:**

- Brak

**Typy:**

- `string` dla label i value

**Propsy:**

```tsx
interface InfoRowProps {
  label: string;
  value: string;
  copyable?: boolean;
}
```

---

### 4.5 EditCompanyNameForm (React)

**Opis:**
Formularz edycji nazwy firmy. Używa React Hook Form + Zod do walidacji. Wyświetla pole tekstowe dla nazwy oraz przycisk „Zapisz". Po pomyślnym zapisie wyświetla toast z potwierdzeniem i rewaliduje dane w cache TanStack Query. Obsługuje stany ładowania i błędy API (400, 403).

**Główne elementy:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Edytuj nazwę firmy</CardTitle>
    <CardDescription>Zmień nazwę wyświetlaną w aplikacji</CardDescription>
  </CardHeader>
  <CardContent>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nazwa firmy</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Wprowadź nazwę firmy" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
          {isSubmitting ? <Spinner /> : "Zapisz"}
        </Button>
      </form>
    </Form>
  </CardContent>
</Card>
```

**Obsługiwane zdarzenia:**

- `onSubmit` – walidacja formularza i wywołanie `PATCH /api/companies/me`
- Zmiana wartości pola (`onChange`)

**Warunki walidacji:**

- **Pole `name` (wymagane):**
  - Minimum 2 znaki
  - Maksimum 100 znaków
  - Nie może być puste (tylko białe znaki)
- Przycisk „Zapisz" wyłączony, gdy formularz nie jest zmieniony (`isDirty=false`) lub w trakcie wysyłania

**Typy:**

- `UpdateCompanyCommand` (zod schema dla walidacji)
- `CompanyDTO` (dane wejściowe dla initialValues)

**Propsy:**

```tsx
interface EditCompanyNameFormProps {
  company: CompanyDTO;
  onUpdate: (updatedCompany: CompanyDTO) => void;
}
```

---

### 4.6 PageHeader (React)

**Opis:**
Uniwersalny nagłówek strony z tytułem i opcjonalnym opisem. Używany na górze widoku settings i innych widoków aplikacji dla spójności UI.

**Główne elementy:**

```tsx
<div className="space-y-1">
  <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
  {description && <p className="text-muted-foreground">{description}</p>}
</div>
```

**Obsługiwane zdarzenia:**

- Brak

**Warunki walidacji:**

- Brak

**Typy:**

- `string` dla title i description

**Propsy:**

```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
}
```

---

### 4.7 HelpLink (React)

**Opis:**
Link do strony pomocy lub kontaktu. Wyświetlany w stopce `CompanyInfoCard` jako prosty text link z ikoną.

**Główne elementy:**

```tsx
<a href={href} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
  <HelpCircleIcon className="w-4 h-4" />
  {children || "Potrzebujesz pomocy?"}
</a>
```

**Obsługiwane zdarzenia:**

- `onClick` (nawigacja do strony pomocy)

**Warunki walidacji:**

- Brak

**Typy:**

- `string` dla href

**Propsy:**

```tsx
interface HelpLinkProps {
  href: string;
  children?: React.ReactNode;
}
```

---

## 5. Typy

### 5.1 Typy z `src/types.ts` (już zdefiniowane)

```typescript
// DTO dla firmy z API
export type CompanyDTO = PickCamel<Tables<"companies">, "uuid" | "name" | "created_at"> & {
  // createdAt jest w formacie camelCase
};

// Komenda aktualizacji firmy
export interface UpdateCompanyCommand {
  name: string;
}
```

### 5.2 Nowe typy ViewModel

```typescript
// src/lib/settings/types.ts

import type { CompanyDTO } from "@/types";

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
```

### 5.3 Schemat walidacji Zod

```typescript
// src/lib/settings/validation.ts

import { z } from "zod";

export const editCompanyNameSchema = z.object({
  name: z
    .string()
    .min(2, "Nazwa firmy musi mieć co najmniej 2 znaki")
    .max(100, "Nazwa firmy może mieć maksymalnie 100 znaków")
    .trim()
    .refine((val) => val.length > 0, "Nazwa firmy nie może być pusta"),
});

export type EditCompanyNameFormValues = z.infer<typeof editCompanyNameSchema>;
```

## 6. Zarządzanie stanem

### 6.1 Stan lokalny komponentu

Komponenty `CompanyInfoCard` i `PageHeader` są bezstanowe (stateless) – otrzymują dane jako props i renderują je.

`EditCompanyNameForm` zarządza stanem formularza poprzez React Hook Form:

```typescript
const form = useForm<EditCompanyNameFormValues>({
  resolver: zodResolver(editCompanyNameSchema),
  defaultValues: {
    name: company.name,
  },
});
```

### 6.2 Stan globalny (TanStack Query)

Widok używa TanStack Query do zarządzania stanem danych firmy i synchronizacji z API:

```typescript
// src/lib/settings/queries.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CompanyDTO, UpdateCompanyCommand } from "@/types";

// Query key factory
export const companyKeys = {
  all: ["companies"] as const,
  me: () => [...companyKeys.all, "me"] as const,
};

// Hook do pobierania danych firmy
export function useCompany() {
  return useQuery({
    queryKey: companyKeys.me(),
    queryFn: async () => {
      const response = await fetch("/api/companies/me", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json() as Promise<CompanyDTO>;
    },
    staleTime: 5 * 60 * 1000, // 5 minut
  });
}

// Hook do aktualizacji nazwy firmy
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: UpdateCompanyCommand) => {
      const response = await fetch("/api/companies/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const error = await response.json();
        throw error;
      }

      return response.json() as Promise<CompanyDTO>;
    },
    onSuccess: (updatedCompany) => {
      // Aktualizacja cache
      queryClient.setQueryData(companyKeys.me(), updatedCompany);

      // Opcjonalnie invalidate dla pewności
      queryClient.invalidateQueries({ queryKey: companyKeys.me() });
    },
  });
}
```

### 6.3 Custom Hook dla formularza

```typescript
// src/lib/settings/useCompanyNameForm.ts

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { editCompanyNameSchema, type EditCompanyNameFormValues } from "./validation";
import { useUpdateCompany } from "./queries";
import type { CompanyDTO } from "@/types";

export function useCompanyNameForm(company: CompanyDTO) {
  const { mutateAsync: updateCompany, isPending } = useUpdateCompany();

  const form = useForm<EditCompanyNameFormValues>({
    resolver: zodResolver(editCompanyNameSchema),
    defaultValues: {
      name: company.name,
    },
  });

  const onSubmit = async (values: EditCompanyNameFormValues) => {
    try {
      const updated = await updateCompany({ name: values.name });

      toast.success("Nazwa firmy została zaktualizowana", {
        description: `Nowa nazwa: ${updated.name}`,
      });

      form.reset({ name: updated.name });
    } catch (error) {
      const apiError = error as CompanyApiError;

      if (apiError.code === "forbidden") {
        toast.error("Nie masz uprawnień do edycji profilu firmy");
      } else if (apiError.code === "validation_error") {
        toast.error("Błąd walidacji", {
          description: apiError.message,
        });
      } else {
        toast.error("Nie udało się zaktualizować nazwy firmy", {
          description: "Spróbuj ponownie później",
        });
      }
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isPending,
  };
}
```

## 7. Integracja API

### 7.1 Endpoint: GET /api/companies/me

**Opis:** Pobiera dane firmy zalogowanego użytkownika.

**Request:**

```http
GET /api/companies/me
Authorization: Bearer <supabase_jwt>
Content-Type: application/json
```

**Response (200 OK):**

```typescript
CompanyDTO {
  uuid: string;
  name: string;
  createdAt: string; // ISO 8601
}
```

**Możliwe błędy:**

- `401 Unauthorized` – brak lub nieprawidłowy JWT
- `404 Not Found` – brak firmy dla użytkownika (nie powinno wystąpić w prawidłowym flow)
- `500 Internal Server Error` – błąd serwera

**Wykorzystanie w widoku:**

- Wywołanie w server-side Astro przy SSR strony (opcjonalnie)
- Wywołanie w React poprzez `useCompany()` hook dla odświeżenia danych

---

### 7.2 Endpoint: PATCH /api/companies/me

**Opis:** Aktualizuje nazwę firmy zalogowanego użytkownika.

**Request:**

```http
PATCH /api/companies/me
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "name": "Nowa nazwa firmy"
}
```

**Request Type:** `UpdateCompanyCommand`

**Response (200 OK):**

```typescript
CompanyDTO {
  uuid: string;
  name: string;
  createdAt: string;
}
```

**Możliwe błędy:**

- `400 Bad Request` – walidacja nie powiodła się (np. nazwa za krótka, za długa)
  ```json
  {
    "code": "validation_error",
    "message": "Nazwa firmy musi mieć co najmniej 2 znaki",
    "details": { "name": "too_short" }
  }
  ```
- `401 Unauthorized` – brak lub nieprawidłowy JWT
- `403 Forbidden` – użytkownik nie ma uprawnień do edycji (rzadkie w MVP z jednym kontem)
- `500 Internal Server Error` – błąd serwera

**Wykorzystanie w widoku:**

- Wywołanie przez `useUpdateCompany()` mutation w reakcji na submit formularza

---

## 8. Interakcje użytkownika

### 8.1 Przeglądanie danych firmy

**Ścieżka:**

1. Użytkownik nawiguje do `/settings/profile` przez menu nawigacji (`Ustawienia → Profil`)
2. Widok ładuje się z preloadowanymi danymi firmy (SSR Astro)
3. Użytkownik widzi kartę z danymi firmy: nazwą, UUID, datą utworzenia

**Rezultat:**

- Dane są wyświetlone w czytelnym formacie
- UUID jest kopiowalne do schowka (kliknięcie ikony kopiowania)

---

### 8.2 Kopiowanie UUID do schowka

**Ścieżka:**

1. Użytkownik klika ikonę kopiowania obok UUID w `CompanyInfoCard`
2. UUID jest kopiowane do schowka systemowego
3. Wyświetla się toast z potwierdzeniem: "UUID skopiowano do schowka"

**Rezultat:**

- UUID jest w schowku użytkownika
- Toast znika po 3 sekundach

---

### 8.3 Edycja nazwy firmy (happy path)

**Ścieżka:**

1. Użytkownik widzi formularz edycji z aktualną nazwą firmy
2. Użytkownik modyfikuje nazwę w polu tekstowym
3. Przycisk „Zapisz" staje się aktywny (zmiana wykryta przez `isDirty`)
4. Użytkownik klika „Zapisz" lub naciska Enter
5. Formularz przechodzi walidację Zod (długość 2-100 znaków)
6. Wywołanie API `PATCH /api/companies/me` z nową nazwą
7. API zwraca 200 OK z zaktualizowanymi danymi
8. Toast sukcesu: "Nazwa firmy została zaktualizowana"
9. Formularz resetuje stan `isDirty` i przycisk staje się nieaktywny

**Rezultat:**

- Nazwa firmy jest zaktualizowana w bazie danych i w UI
- Cache TanStack Query jest zaktualizowany
- Użytkownik widzi potwierdzenie

---

### 8.4 Edycja nazwy firmy (błąd walidacji)

**Ścieżka:**

1. Użytkownik wprowadza nazwę za krótką (np. 1 znak) lub za długą (>100 znaków)
2. Użytkownik klika „Zapisz"
3. Walidacja Zod wykrywa błąd po stronie klienta
4. Pod polem tekstowym pojawia się komunikat błędu: "Nazwa firmy musi mieć co najmniej 2 znaki"
5. Formularz nie jest wysyłany do API

**Rezultat:**

- Błąd jest wyświetlony inline pod polem
- Użytkownik może poprawić wartość bez ponownego wysyłania

---

### 8.5 Edycja nazwy firmy (błąd API)

**Ścieżka:**

1. Użytkownik wprowadza poprawną nazwę i klika „Zapisz"
2. API zwraca błąd (np. 403 Forbidden – brak uprawnień, lub 500 Internal Server Error)
3. Hook mutation przechwytuje błąd
4. Wyświetla się toast błędu: "Nie udało się zaktualizować nazwy firmy. Spróbuj ponownie później."
5. Formularz pozostaje w stanie edycji

**Rezultat:**

- Użytkownik jest informowany o błędzie
- Może spróbować ponownie po chwili

---

### 8.6 Link do pomocy

**Ścieżka:**

1. Użytkownik klika link „Potrzebujesz pomocy?" w stopce karty
2. Nawigacja do strony `/help` (lub zewnętrzny URL do dokumentacji)

**Rezultat:**

- Użytkownik jest przekierowany do strony pomocy

---

## 9. Warunki i walidacja

### 9.1 Warunki frontendowe (Zod schema)

**Pole: `name` (nazwa firmy)**

| Warunek                                | Walidacja                               | Komunikat błędu                                |
| -------------------------------------- | --------------------------------------- | ---------------------------------------------- |
| Wymagane                               | `z.string()`                            | "Pole jest wymagane" (domyślny)                |
| Min długość                            | `.min(2)`                               | "Nazwa firmy musi mieć co najmniej 2 znaki"    |
| Max długość                            | `.max(100)`                             | "Nazwa firmy może mieć maksymalnie 100 znaków" |
| Nie może być puste (tylko białe znaki) | `.trim().refine(val => val.length > 0)` | "Nazwa firmy nie może być pusta"               |

**Komponent:** `EditCompanyNameForm`

**Wpływ na UI:**

- Jeśli walidacja nie przechodzi, komunikat błędu jest wyświetlany pod polem (`FormMessage`)
- Przycisk „Zapisz" jest wyłączony, gdy formularz nie jest zmieniony (`isDirty=false`)
- Podczas wysyłania (`isPending=true`) przycisk pokazuje spinner i jest wyłączony

---

### 9.2 Warunki backendowe (API)

**Endpoint:** `PATCH /api/companies/me`

| Warunek                                    | Kod błędu | Reakcja UI                                                                             |
| ------------------------------------------ | --------- | -------------------------------------------------------------------------------------- |
| JWT brak lub nieprawidłowy                 | 401       | Redirect do `/signin` (middleware)                                                     |
| Nazwa za krótka/długa (backend validation) | 400       | Toast błędu z treścią z API                                                            |
| Brak uprawnień (403)                       | 403       | Toast: "Nie masz uprawnień do edycji profilu firmy" + baner informacyjny (opcjonalnie) |
| Firma nie istnieje                         | 404       | Toast ogólnego błędu (rzadki przypadek)                                                |
| Błąd serwera                               | 500       | Toast: "Nie udało się zaktualizować nazwy firmy. Spróbuj ponownie później."            |

**Komponent:** `EditCompanyNameForm` + `useUpdateCompany` mutation

**Wpływ na UI:**

- Błędy 400/403/500 wyświetlają toast z odpowiednim komunikatem
- W przypadku 403 można dodatkowo wyświetlić trwały baner (Alert z shadcn/ui) informujący o braku uprawnień
- Użytkownik pozostaje na stronie i może spróbować ponownie

---

### 9.3 Warunki UX

| Warunek                       | Komponent             | Reakcja                                             |
| ----------------------------- | --------------------- | --------------------------------------------------- |
| Formularz nie zmieniony       | `EditCompanyNameForm` | Przycisk „Zapisz" wyłączony (`disabled={!isDirty}`) |
| Formularz w trakcie wysyłania | `EditCompanyNameForm` | Przycisk wyłączony, spinner, `isPending=true`       |
| Sukces zapisu                 | `EditCompanyNameForm` | Toast sukcesu, reset `isDirty`, przycisk nieaktywny |
| Błąd zapisu                   | `EditCompanyNameForm` | Toast błędu, formularz pozostaje w stanie edycji    |

---

## 10. Obsługa błędów

### 10.1 Błędy autoryzacji

**Scenariusz:** Użytkownik niezalogowany lub sesja wygasła

**Obsługa:**

- Middleware Astro wykrywa brak JWT i przekierowuje do `/signin`
- Po zalogowaniu użytkownik jest kierowany z powrotem do `/settings/profile` (jeśli zapisano `returnUrl`)

---

### 10.2 Błędy API (GET /api/companies/me)

**Scenariusz:** Błąd podczas ładowania danych firmy (SSR lub CSR)

**Obsługa w Astro SSR:**

```typescript
try {
  const response = await fetch(`${Astro.url.origin}/api/companies/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    // Redirect do strony błędu lub wyświetl fallback
    return Astro.redirect("/error?code=500");
  }

  const company = await response.json();
} catch (error) {
  // Fallback UI
  return Astro.redirect("/error?code=500");
}
```

**Obsługa w React (TanStack Query):**

```typescript
const { data: company, isLoading, error } = useCompany();

if (isLoading) {
  return <CompanyProfileSkeleton />;
}

if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Błąd ładowania danych</AlertTitle>
      <AlertDescription>
        Nie udało się pobrać danych firmy. <Button variant="link" onClick={() => refetch()}>Spróbuj ponownie</Button>
      </AlertDescription>
    </Alert>
  );
}
```

---

### 10.3 Błędy API (PATCH /api/companies/me)

**Scenariusz:** Błąd podczas zapisywania nazwy firmy

**Obsługa w mutation:**

```typescript
const { mutateAsync: updateCompany } = useUpdateCompany();

try {
  await updateCompany({ name: "..." });
  toast.success("...");
} catch (error) {
  const apiError = error as CompanyApiError;

  // Mapowanie błędów na komunikaty
  if (apiError.code === "validation_error") {
    toast.error("Błąd walidacji", { description: apiError.message });
  } else if (apiError.code === "forbidden") {
    toast.error("Brak uprawnień");
    // Opcjonalnie: pokaż baner z informacją o braku uprawnień
  } else {
    toast.error("Nie udało się zapisać zmian");
  }
}
```

---

### 10.4 Błędy walidacji formularza (Zod)

**Scenariusz:** Użytkownik wprowadza nieprawidłowe dane (np. za krótka nazwa)

**Obsługa:**

- React Hook Form + Zod automatycznie wyświetla błędy walidacji pod polem tekstowym
- Użytkownik nie może wysłać formularza, dopóki błędy nie zostaną poprawione

---

### 10.5 Błędy sieci (offline)

**Scenariusz:** Użytkownik traci połączenie internetowe podczas próby zapisu

**Obsługa:**

- TanStack Query mutation wykrywa błąd sieci
- Toast błędu: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- Opcjonalnie: mechanizm retry (TanStack Query retry)

---

### 10.6 Przypadki brzegowe

| Przypadek                                                        | Obsługa                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Firma nie istnieje w bazie (404 na GET)                          | Redirect do strony błędu lub wyświetlenie komunikatu z linkiem do kontaktu         |
| Duplikat nazwy firmy (jeśli backend wymusza unikalność, rzadkie) | Toast błędu z komunikatem z API                                                    |
| Sesja wygasła podczas edycji                                     | Middleware przekierowuje do `/signin`, po zalogowaniu użytkownik wraca do settings |
| Bardzo długa nazwa (>100 znaków)                                 | Walidacja Zod blokuje submit, komunikat błędu pod polem                            |

---

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów i walidacji

1.1. Sprawdź, czy `CompanyDTO` i `UpdateCompanyCommand` są już zdefiniowane w `src/types.ts` (powinny być)

1.2. Utwórz folder `src/lib/settings/`

1.3. Utwórz plik `src/lib/settings/types.ts` z typami ViewModel:

- `EditCompanyNameFormValues`
- `UseUpdateCompanyOptions`
- `CompanyApiError`

1.4. Utwórz plik `src/lib/settings/validation.ts` ze schematem Zod:

- `editCompanyNameSchema`

---

### Krok 2: Implementacja query i mutation (TanStack Query)

2.1. Utwórz plik `src/lib/settings/queries.ts`

2.2. Zaimplementuj query key factory:

```typescript
export const companyKeys = {
  all: ["companies"] as const,
  me: () => [...companyKeys.all, "me"] as const,
};
```

2.3. Zaimplementuj `useCompany()` hook:

- `queryKey: companyKeys.me()`
- `queryFn`: wywołanie `GET /api/companies/me`
- `staleTime: 5 * 60 * 1000` (5 minut)

2.4. Zaimplementuj `useUpdateCompany()` mutation:

- `mutationFn`: wywołanie `PATCH /api/companies/me`
- `onSuccess`: aktualizacja cache (`setQueryData` + opcjonalnie `invalidateQueries`)

2.5. Dodaj obsługę błędów HTTP w obu funkcjach (sprawdź `response.ok`, parsuj JSON error)

---

### Krok 3: Implementacja custom hooka formularza

3.1. Utwórz plik `src/lib/settings/useCompanyNameForm.ts`

3.2. Zaimplementuj hook `useCompanyNameForm(company: CompanyDTO)`:

- Inicjalizuj React Hook Form z `zodResolver` i `defaultValues`
- Wykorzystaj `useUpdateCompany()` mutation
- Zaimplementuj funkcję `onSubmit`:
  - Wywołaj `updateCompany()`
  - W przypadku sukcesu: wyświetl toast, zresetuj formularz
  - W przypadku błędu: wyświetl toast z odpowiednim komunikatem (mapowanie kodów błędów)
- Zwróć `{ form, onSubmit, isPending }`

---

### Krok 4: Implementacja komponentów pomocniczych

4.1. Utwórz folder `src/components/settings/`

4.2. Utwórz `src/components/settings/PageHeader.tsx`:

- Props: `title`, `description?`
- Renderuj nagłówek z h1 i opcjonalnym paragrafem
- Użyj Tailwind dla stylowania

4.3. Utwórz `src/components/settings/HelpLink.tsx`:

- Props: `href`, `children?`
- Renderuj link z ikoną `HelpCircleIcon` z `lucide-react`
- Użyj stylów shadcn/ui dla linków

4.4. Utwórz `src/components/settings/InfoRow.tsx`:

- Props: `label`, `value`, `copyable?`
- Renderuj wiersz klucz-wartość
- Jeśli `copyable=true`, dodaj przycisk kopiowania z obsługą `navigator.clipboard.writeText()`
- Po skopiowaniu wyświetl toast: "Skopiowano do schowka"

---

### Krok 5: Implementacja CompanyInfoCard

5.1. Utwórz `src/components/settings/CompanyInfoCard.tsx`

5.2. Zaimportuj `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` z `@/components/ui/card`

5.3. Props: `company: CompanyDTO`

5.4. Renderuj:

- `CardHeader` z tytułem "Dane firmy"
- `CardContent` z trzema `InfoRow`:
  - Nazwa: `company.name`
  - Identyfikator: `company.uuid` (copyable)
  - Data utworzenia: `formatDate(company.createdAt)` (użyj helpera do formatowania daty)
- `CardFooter` z `HelpLink`

5.5. Utwórz helper do formatowania daty:

```typescript
// src/lib/utils/date.ts
export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(isoString));
}
```

---

### Krok 6: Implementacja EditCompanyNameForm

6.1. Utwórz `src/components/settings/EditCompanyNameForm.tsx`

6.2. Props: `company: CompanyDTO`, `onUpdate?: (company: CompanyDTO) => void`

6.3. Użyj `useCompanyNameForm(company)` hook

6.4. Zaimportuj komponenty formularza z shadcn/ui:

- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` z `@/components/ui/form`
- `Input` z `@/components/ui/input`
- `Button` z `@/components/ui/button`
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` z `@/components/ui/card`

6.5. Renderuj formularz w strukturze:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Edytuj nazwę firmy</CardTitle>
    <CardDescription>Zmień nazwę wyświetlaną w aplikacji</CardDescription>
  </CardHeader>
  <CardContent>
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <FormField name="name" ... />
        <Button type="submit" disabled={isDisabled}>
          {isPending ? <Loader2 className="animate-spin" /> : "Zapisz"}
        </Button>
      </form>
    </Form>
  </CardContent>
</Card>
```

6.6. Ustaw warunek `isDisabled = isPending || !form.formState.isDirty`

---

### Krok 7: Implementacja CompanyProfileView

7.1. Utwórz `src/components/settings/CompanyProfileView.tsx`

7.2. Props: `initialCompany: CompanyDTO`

7.3. Użyj `useCompany()` hook do zarządzania danymi (z `initialData: initialCompany`)

7.4. Renderuj strukturę:

```tsx
<div className="container mx-auto p-6 space-y-8 max-w-4xl">
  <PageHeader title="Profil firmy" description="Zarządzaj podstawowymi danymi swojej firmy" />
  {isLoading && <Skeleton ... />}
  {error && <Alert variant="destructive" ... />}
  {company && (
    <>
      <CompanyInfoCard company={company} />
      <EditCompanyNameForm company={company} />
    </>
  )}
</div>
```

7.5. Dodaj skeletony ładowania dla lepszej UX podczas refetch

---

### Krok 8: Implementacja strony Astro

8.1. Utwórz `src/pages/settings/profile.astro`

8.2. Zaimportuj `AuthenticatedLayout` i `CompanyProfileView`

8.3. W części frontmatter (server-side):

```typescript
---
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout.astro";
import CompanyProfileView from "@/components/settings/CompanyProfileView";
import { createServerSupabaseClient } from "@/db/supabase.client";

// Guard: sprawdź sesję (middleware powinien to obsłużyć, ale dla pewności)
const supabase = createServerSupabaseClient(Astro);
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  return Astro.redirect("/signin?returnUrl=/settings/profile");
}

// Pobierz dane firmy
let company;
try {
  const response = await fetch(`${Astro.url.origin}/api/companies/me`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  company = await response.json();
} catch (error) {
  console.error("Failed to fetch company:", error);
  return Astro.redirect("/error?code=500&message=company_fetch_failed");
}
---
```

8.4. W części template:

```astro
<AuthenticatedLayout title="Profil firmy">
  <CompanyProfileView client:load initialCompany={company} />
</AuthenticatedLayout>
```

---

### Krok 9: Dodanie do nawigacji

9.1. Otwórz komponent nawigacji w `AuthenticatedLayout` lub dedykowanym komponencie sidebara/menu

9.2. Dodaj link do `/settings/profile` w sekcji „Ustawienia":

```tsx
<NavigationItem
  href="/settings/profile"
  icon={<UserIcon />}
  label="Profil firmy"
  active={currentPath === "/settings/profile"}
/>
```

9.3. Jeśli istnieją inne widoki settings (Alerty, Konto), rozważ dodanie zakładek (tabs) w layoutcie settings

---

### Krok 10: Implementacja endpointów API (jeśli nie istnieją)

10.1. Sprawdź, czy endpointy `GET /api/companies/me` i `PATCH /api/companies/me` są już zaimplementowane

10.2. Jeśli nie, utwórz `src/pages/api/companies/me.ts`:

```typescript
import type { APIRoute } from "astro";
import { createServerSupabaseClient } from "@/db/supabase.client";
import type { CompanyDTO, UpdateCompanyCommand, ProblemDetail } from "@/types";
import { z } from "zod";

// Zod schema dla walidacji backendu
const updateCompanySchema = z.object({
  name: z.string().min(2).max(100).trim(),
});

// GET /api/companies/me
export const GET: APIRoute = async ({ request, locals }) => {
  const supabase = createServerSupabaseClient({ request, locals });

  // Pobierz company_uuid z pomocnika RLS
  const { data: user, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(
      JSON.stringify({
        code: "unauthorized",
        message: "Musisz być zalogowany",
      } as ProblemDetail),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Pobierz company_uuid z tabeli users
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("company_uuid")
    .eq("uuid", user.user.id)
    .single();

  if (userDataError || !userData) {
    return new Response(
      JSON.stringify({
        code: "not_found",
        message: "Nie znaleziono danych użytkownika",
      } as ProblemDetail),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Pobierz firmę
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("uuid, name, created_at")
    .eq("uuid", userData.company_uuid)
    .single();

  if (companyError || !company) {
    return new Response(
      JSON.stringify({
        code: "not_found",
        message: "Nie znaleziono firmy",
      } as ProblemDetail),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Mapuj na DTO (camelCase)
  const dto: CompanyDTO = {
    uuid: company.uuid,
    name: company.name,
    createdAt: company.created_at,
  };

  return new Response(JSON.stringify(dto), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

// PATCH /api/companies/me
export const PATCH: APIRoute = async ({ request, locals }) => {
  const supabase = createServerSupabaseClient({ request, locals });

  // Pobierz body
  let body: UpdateCompanyCommand;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        code: "invalid_json",
        message: "Nieprawidłowy format JSON",
      } as ProblemDetail),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Walidacja
  const validation = updateCompanySchema.safeParse(body);
  if (!validation.success) {
    return new Response(
      JSON.stringify({
        code: "validation_error",
        message: "Błąd walidacji danych",
        details: validation.error.flatten().fieldErrors,
      } as ProblemDetail),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Pobierz company_uuid użytkownika
  const { data: user, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(
      JSON.stringify({
        code: "unauthorized",
        message: "Musisz być zalogowany",
      } as ProblemDetail),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const { data: userData } = await supabase.from("users").select("company_uuid").eq("uuid", user.user.id).single();

  if (!userData) {
    return new Response(
      JSON.stringify({
        code: "not_found",
        message: "Nie znaleziono użytkownika",
      } as ProblemDetail),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Aktualizuj firmę
  const { data: updated, error: updateError } = await supabase
    .from("companies")
    .update({ name: validation.data.name })
    .eq("uuid", userData.company_uuid)
    .select("uuid, name, created_at")
    .single();

  if (updateError) {
    console.error("Failed to update company:", updateError);
    return new Response(
      JSON.stringify({
        code: "internal_error",
        message: "Nie udało się zaktualizować firmy",
      } as ProblemDetail),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Mapuj na DTO
  const dto: CompanyDTO = {
    uuid: updated.uuid,
    name: updated.name,
    createdAt: updated.created_at,
  };

  return new Response(JSON.stringify(dto), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

---

### Krok 11: Testy manualne

11.1. Uruchom aplikację lokalnie (`npm run dev`)

11.2. Zaloguj się jako użytkownik

11.3. Nawiguj do `/settings/profile`

11.4. Sprawdź, czy dane firmy są wyświetlane poprawnie

11.5. Przetestuj kopiowanie UUID do schowka

11.6. Przetestuj edycję nazwy firmy:

- Wprowadź poprawną nazwę → sprawdź toast sukcesu
- Wprowadź nazwę za krótką (1 znak) → sprawdź komunikat walidacji
- Wprowadź nazwę za długą (>100 znaków) → sprawdź komunikat walidacji
- Nie zmieniaj nazwy → sprawdź, czy przycisk jest wyłączony

11.7. Symuluj błędy API (np. odłącz sieć) → sprawdź toasty błędów

---

### Krok 12: Testy jednostkowe (opcjonalnie)

12.1. Utwórz `src/lib/settings/__tests__/validation.test.ts`:

- Przetestuj schema `editCompanyNameSchema` dla różnych przypadków (poprawne, za krótkie, za długie, puste)

12.2. Utwórz `src/components/settings/__tests__/EditCompanyNameForm.test.tsx`:

- Przetestuj renderowanie formularza
- Przetestuj walidację (używając `@testing-library/react`)
- Przetestuj submit i obsługę błędów (mockuj `useUpdateCompany`)

12.3. Uruchom testy: `npm test`

---

### Krok 13: Dokumentacja i cleanup

13.1. Dodaj komentarze JSDoc do kluczowych funkcji i komponentów

13.2. Zaktualizuj `README.md` (jeśli potrzeba) z informacją o nowym widoku

13.3. Sprawdź, czy nie ma nieużywanych importów ani zmiennych (linter)

13.4. Uruchom linter: `npm run lint`

13.5. Sformatuj kod: `npm run format` (jeśli używany Prettier)

---

### Krok 14: Commit i deploy

14.1. Dodaj zmiany do gita:

```bash
git add .
git commit -m "feat: implement company profile settings view"
```

14.2. Push do repozytorium:

```bash
git push origin feature/company-profile-settings
```

14.3. Utwórz Pull Request i poproś o review

14.4. Po akceptacji zmerguj do `main` i wdróż na środowisko produkcyjne

---

## Podsumowanie

Ten plan implementacji obejmuje kompletny widok Ustawień – Profil firmy, zgodny z wymaganiami PRD i User Story US-001. Widok umożliwia przeglądanie danych firmy oraz edycję nazwy z pełną walidacją, obsługą błędów i feedback użytkownika. Implementacja wykorzystuje nowoczesny stack technologiczny (Astro, React, TanStack Query, shadcn/ui) i jest zgodna z najlepszymi praktykami UX/A11y.

Kluczowe elementy:

- **Komponenty:** Modułowe, reużywalne komponenty React z shadcn/ui
- **Zarządzanie stanem:** TanStack Query dla synchronizacji z API
- **Walidacja:** Zod schema dla frontendowej i backendowej walidacji
- **UX:** Toasty, walidacja inline, disabled states, loading states
- **Dostępność:** ARIA labels, focus management, keyboard navigation
- **Bezpieczeństwo:** JWT-based auth, RLS w Supabase, walidacja na każdym poziomie
