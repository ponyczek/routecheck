# Plan implementacji widoku Ustawienia – Alerty i Telemetria

## 1. Przegląd

Widok **Ustawienia – Alerty i Telemetria** (`/settings/alerts`) umożliwia spedytorom zarządzanie konfiguracją alertów e-mail (US-014) oraz wgląd w agregowane dane telemetryczne dotyczące użyteczności formularza kierowcy (US-017). Widok składa się z trzech głównych sekcji:

1. **Konfiguracja alertów 24h** – przełącznik włączania/wyłączania powiadomień e-mail o brakujących raportach z informacjami o konsekwencjach.
2. **Historia wysyłek e-mail** – opcjonalny podgląd ostatnich alertów z linkiem do pełnych logów (`GET /api/email-logs`).
3. **Telemetria UX** – wizualizacja zagregowanych metryk, w szczególności mediany czasu wypełnienia formularza kierowcy, z opcjonalnym mini wykresem.

Cel: zapewnić spedytorom kontrolę nad powiadomieniami o brakujących raportach oraz wgląd w metryki jakości UX, wspierając tym samym ciągłe doskonalenie procesu raportowania.

## 2. Routing widoku

- **Ścieżka:** `/settings/alerts`
- **Strona Astro:** `src/pages/settings/alerts.astro`
- **Główny komponent React:** `AlertsAndTelemetryViewWithProvider` (client:load)
- **Wymaga uwierzytelnienia:** Tak (middleware przekierowuje niezalogowanych na `/signin?returnUrl=/settings/alerts`)

Widok jest częścią obszaru Settings i powinien wykorzystywać wspólny układ nawigacji zakładkowej widoczny w `profile.astro`.

## 3. Struktura komponentów

```
alerts.astro (Astro page)
└─ AuthenticatedLayout
   └─ AlertsAndTelemetryViewWithProvider (client:load)
      ├─ PageHeader
      ├─ AlertsConfigSection
      │  ├─ AlertToggleCard
      │  │  ├─ Card (shadcn/ui)
      │  │  ├─ Switch (shadcn/ui)
      │  │  └─ InfoBanner (inline)
      │  └─ ManualTriggerSection (opcjonalne)
      │     ├─ Button
      │     └─ toast (sonner)
      ├─ EmailLogsSection (opcjonalne w MVP)
      │  ├─ Card
      │  ├─ EmailLogsList
      │  └─ Button (link do pełnych logów)
      └─ TelemetrySection
         ├─ Card
         ├─ TelemetryMetricCard (karty metryk)
         └─ TelemetryChart (opcjonalny mini wykres)
```

### Hierarchia komponentów

1. **alerts.astro** – strona Astro; obsługuje SSR, sprawdza sesję, przekazuje initial data do komponentu React.
2. **AlertsAndTelemetryViewWithProvider** – wrapper z `QueryClientProvider`, ładuje dane za pomocą TanStack Query, zarządza stanem i przekazuje propsy do widoku.
3. **AlertsAndTelemetryView** – główny komponent widoku, renderuje sekcje i zarządza layoutem.
4. **AlertsConfigSection** – sekcja konfiguracji alertów z toggle i info bannerem.
5. **EmailLogsSection** – opcjonalna sekcja z podglądem ostatnich logów e-mail.
6. **TelemetrySection** – sekcja z metrykami UX (mediana czasu, liczba wypełnień, etc.).

## 4. Szczegóły komponentów

### 4.1 AlertsAndTelemetryViewWithProvider

**Opis:**  
Wrapper komponent odpowiedzialny za zapewnienie kontekstu TanStack Query (`QueryClientProvider`) oraz przekazanie initial data do głównego widoku. Ten komponent jest oznaczony jako `client:load` w Astro.

**Główne elementy:**
- `QueryClientProvider` z `queryClient` zainicjalizowanym w `src/lib/query-client.tsx`.
- Renderuje `AlertsAndTelemetryView` z przekazaniem initial props.

**Obsługiwane zdarzenia:**
- Brak (komponent tylko wrapper).

**Warunki walidacji:**
- Brak (tylko przekazanie danych).

**Typy:**
- Propsy: `{ initialTelemetryData?: TelemetryAggregatesDTO | null; initialEmailLogs?: EmailLogDTO[] | null }`

**Propsy:**
```typescript
interface AlertsAndTelemetryViewWithProviderProps {
  initialTelemetryData?: TelemetryAggregatesDTO | null;
  initialEmailLogs?: EmailLogDTO[] | null;
}
```

---

### 4.2 AlertsAndTelemetryView

**Opis:**  
Główny komponent widoku. Zarządza stanem alertów (włączone/wyłączone), pobiera dane telemetryczne i logi e-mail za pomocą TanStack Query, i renderuje poszczególne sekcje (PageHeader, AlertsConfigSection, EmailLogsSection, TelemetrySection).

**Główne elementy:**
- `PageHeader` z tytułem "Alerty i telemetria" i opisem.
- `AlertsConfigSection` – sekcja z przełącznikiem alertów.
- `EmailLogsSection` (opcjonalne) – lista ostatnich wysłanych e-maili.
- `TelemetrySection` – metryki UX.
- `Alert` (shadcn/ui) dla wyświetlania błędów API.
- `Skeleton` dla stanów ładowania.

**Obsługiwane zdarzenia:**
- Brak bezpośrednich zdarzeń (deleguje do children).

**Warunki walidacji:**
- Brak (walidacja w sekcjach child).

**Typy:**
- Propsy: `AlertsAndTelemetryViewProps`
- Wewnętrzne: `TelemetryAggregatesDTO`, `EmailLogDTO[]`

**Propsy:**
```typescript
interface AlertsAndTelemetryViewProps {
  initialTelemetryData?: TelemetryAggregatesDTO | null;
  initialEmailLogs?: EmailLogDTO[] | null;
}
```

---

### 4.3 PageHeader

**Opis:**  
Komponent nagłówka strony, wyświetla tytuł i opis widoku.

**Główne elementy:**
- `<h1>` z tytułem.
- `<p>` z opisem (muted-foreground).

**Obsługiwane zdarzenia:**
- Brak.

**Warunki walidacji:**
- Brak.

**Typy:**
- Propsy: `{ title: string; description?: string }`

**Propsy:**
```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
}
```

---

### 4.4 AlertsConfigSection

**Opis:**  
Sekcja zarządzania konfiguracją alertów 24h. Zawiera `AlertToggleCard` z przełącznikiem (Switch) włączania/wyłączania alertów oraz `InfoBanner` z informacją o konsekwencjach i adresie docelowym. Opcjonalnie może zawierać `ManualTriggerSection` dla ręcznego wyzwalania generowania linków (`POST /api/report-links:generate`), jeśli będzie to udostępnione w MVP.

**Główne elementy:**
- `AlertToggleCard` – karta z konfiguracją.
- `InfoBanner` (inline) – baner informacyjny o działaniu alertów.
- `ManualTriggerSection` (opcjonalny) – przycisk do ręcznego uruchomienia generowania linków (dry-run preview).

**Obsługiwane zdarzenia:**
- Zmiana stanu przełącznika (toggle alerts on/off).
- Kliknięcie przycisku ręcznego triggera (jeśli włączone).

**Warunki walidacji:**
- Brak bezpośredniej walidacji (tylko zmiana stanu boolean).

**Typy:**
- `AlertsConfigDTO` (nowy typ do utworzenia, zawierający: `alertsEnabled: boolean`, `alertRecipientEmail: string`).

**Propsy:**
```typescript
interface AlertsConfigSectionProps {
  // Brak props, pobiera dane z hooka
}
```

---

### 4.5 AlertToggleCard

**Opis:**  
Karta (Card) zawierająca przełącznik (Switch) do włączania/wyłączania alertów e-mail o brakujących raportach. Wyświetla aktualny stan, opis działania alertów, adres docelowy (info-only) oraz przełącznik. Zmiana stanu wywołuje mutację API (update company settings lub dedykowany endpoint).

**Główne elementy:**
- `Card` (shadcn/ui).
- `CardHeader` z tytułem "Alerty o brakujących raportach".
- `CardContent`:
  - `InfoBanner` z informacją o działaniu (alert wysyłany raz na brakujący raport, 24h od planowanego terminu).
  - `InfoRow` z adresem e-mail docelowym (read-only, pobierany z konta użytkownika).
  - `Switch` (shadcn/ui) do toggle alertów.
  - Label i opis konsekwencji.
- `toast` (sonner) dla feedbacku 202 accepted lub błędu.

**Obsługiwane zdarzenia:**
- `onToggle` – zmiana stanu przełącznika, wywołuje mutację API.

**Warunki walidacji:**
- Brak (boolean toggle).

**Typy:**
- `AlertsConfigDTO` (nowy).

**Propsy:**
```typescript
interface AlertToggleCardProps {
  alertsEnabled: boolean;
  recipientEmail: string;
  onToggle: (enabled: boolean) => Promise<void>;
  isPending: boolean;
}
```

---

### 4.6 InfoBanner

**Opis:**  
Inline komponent baneru informacyjnego, wyświetla komunikat z ikoną (info circle) i tekstem. Używany w `AlertToggleCard` do wyświetlania informacji o działaniu alertów.

**Główne elementy:**
- `Alert` (shadcn/ui) z wariantem `default` lub `info`.
- `AlertTitle` (opcjonalny).
- `AlertDescription` z tekstem.

**Obsługiwane zdarzenia:**
- Brak.

**Warunki walidacji:**
- Brak.

**Typy:**
- Propsy: `{ title?: string; description: string; variant?: "default" | "info" }`

**Propsy:**
```typescript
interface InfoBannerProps {
  title?: string;
  description: string;
  variant?: "default" | "info";
}
```

---

### 4.7 ManualTriggerSection (opcjonalne)

**Opis:**  
Opcjonalna sekcja pozwalająca na ręczne wyzwolenie generowania linków raportowych (`POST /api/report-links:generate`). Wyświetla przycisk "Wygeneruj linki teraz" z informacją o dry-run (podgląd). Po kliknięciu wysyła żądanie i wyświetla toast z podsumowaniem (`{ generated: int, skipped: int }`).

**Główne elementy:**
- `Card` lub inline div.
- `Button` z ikoną (np. `RefreshCw` z lucide-react).
- `toast` (sonner) z wynikiem.

**Obsługiwane zdarzenia:**
- `onClick` – wywołuje mutację POST `/api/report-links:generate` z parametrem `dryRun: false`.

**Warunki walidacji:**
- Brak.

**Typy:**
- `GenerateReportLinksCommand`, `ReportLinksGenerateResponseDTO` (z `types.ts`).

**Propsy:**
```typescript
interface ManualTriggerSectionProps {
  onGenerate: () => Promise<void>;
  isPending: boolean;
}
```

---

### 4.8 EmailLogsSection (opcjonalne)

**Opis:**  
Sekcja wyświetlająca ostatnie logi e-mail (np. ostatnie 5-10 wysyłek). Zawiera kartę z listą (`EmailLogsList`) i przyciskiem/linkiem do pełnych logów (`/settings/email-logs` lub modal). Dane pobierane z `GET /api/email-logs?limit=10&sortBy=sentAt&sortDir=desc`.

**Główne elementy:**
- `Card` (shadcn/ui).
- `CardHeader` z tytułem "Ostatnie alerty".
- `CardContent`:
  - `EmailLogsList` – lista logów (recipient, subject, status, sentAt).
  - Link "Zobacz wszystkie logi".
- `Skeleton` dla stanu ładowania.

**Obsługiwane zdarzenia:**
- Kliknięcie "Zobacz wszystkie" – nawigacja do `/settings/email-logs` (opcjonalnie).

**Warunki walidacji:**
- Brak.

**Typy:**
- `EmailLogDTO[]` (z `types.ts`).

**Propsy:**
```typescript
interface EmailLogsSectionProps {
  initialLogs?: EmailLogDTO[] | null;
}
```

---

### 4.9 EmailLogsList

**Opis:**  
Lista ostatnich logów e-mail, wyświetla w formie karty lub tabeli (responsive): recipient, subject, status (badge), sentAt (formatowany timestamp).

**Główne elementy:**
- `<ul>` lub `<table>` (responsive).
- `EmailLogItem` dla każdego logu.
- `Badge` (shadcn/ui) dla statusu (SENT – zielony, FAILED – czerwony).

**Obsługiwane zdarzenia:**
- Brak.

**Warunki walidacji:**
- Brak.

**Typy:**
- `EmailLogDTO[]`.

**Propsy:**
```typescript
interface EmailLogsListProps {
  logs: EmailLogDTO[];
}
```

---

### 4.10 EmailLogItem

**Opis:**  
Pojedynczy wiersz/karta reprezentująca log e-mail.

**Główne elementy:**
- `<li>` lub `<tr>`.
- Wyświetla: recipient (e-mail), subject, status badge, sentAt (formatowana data).
- Opcjonalnie: `errorMessage` (jeśli status FAILED).

**Obsługiwane zdarzenia:**
- Brak.

**Warunki walidacji:**
- Brak.

**Typy:**
- `EmailLogDTO`.

**Propsy:**
```typescript
interface EmailLogItemProps {
  log: EmailLogDTO;
}
```

---

### 4.11 TelemetrySection

**Opis:**  
Sekcja z agregowanymi metrykami telemetrycznymi UX, w szczególności median czasu wypełnienia formularza kierowcy. Zawiera kartę z metrykami (`TelemetryMetricCard`) i opcjonalny mini wykres (`TelemetryChart`). Dane pobierane z `GET /api/telemetry?eventType=FORM_SUBMIT&bucket=day&from=<7dni>&to=<today>`.

**Główne elementy:**
- `Card` (shadcn/ui).
- `CardHeader` z tytułem "Telemetria UX".
- `CardContent`:
  - `TelemetryMetricCard` – karty z metrykami (mediana czasu, liczba wypełnień, konwersja, etc.).
  - `TelemetryChart` (opcjonalny) – mini wykres trendu (np. recharts lub sparkline).
- `Skeleton` dla stanu ładowania.

**Obsługiwane zdarzenia:**
- Brak bezpośrednich zdarzeń.

**Warunki walidacji:**
- Brak.

**Typy:**
- `TelemetryAggregatesDTO` (nowy typ do utworzenia).

**Propsy:**
```typescript
interface TelemetrySectionProps {
  initialData?: TelemetryAggregatesDTO | null;
}
```

---

### 4.12 TelemetryMetricCard

**Opis:**  
Karta metryki telemetrycznej, wyświetla pojedynczą agregowaną wartość (np. "Mediana czasu wypełnienia: 85s"). Podobna do `MetricCard` z dashboardu, ale z inną stylistyką (mniejsza, inline).

**Główne elementy:**
- `Card` (shadcn/ui) lub inline div z border.
- `<h3>` z labelą metryki.
- `<p>` z wartością (duża liczba, bold).
- Opcjonalnie: `Badge` z trendem (np. "↑ 5% vs poprzedni tydzień").

**Obsługiwane zdarzenia:**
- Brak.

**Warunki walidacji:**
- Brak.

**Typy:**
- `TelemetryMetric` (nowy typ).

**Propsy:**
```typescript
interface TelemetryMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { direction: "up" | "down"; value: string };
}
```

---

### 4.13 TelemetryChart (opcjonalny)

**Opis:**  
Mini wykres (sparkline lub bar chart) prezentujący trend mediany czasu wypełnienia formularza w ciągu ostatnich 7 dni. Opcjonalny w MVP, można użyć prostej biblioteki jak recharts lub plotly.js lite.

**Główne elementy:**
- `ResponsiveContainer` (recharts).
- `LineChart` lub `BarChart` z osią X (dni) i osią Y (czas w sekundach).
- Tooltip z wartością.

**Obsługiwane zdarzenia:**
- Hover na wykresie (tooltip).

**Warunki walidacji:**
- Brak.

**Typy:**
- `TelemetryDataPoint[]` (nowy typ: `{ date: IsoDateOnlyString; medianDuration: number }`).

**Propsy:**
```typescript
interface TelemetryChartProps {
  data: TelemetryDataPoint[];
}
```

---

## 5. Typy

### 5.1 Nowe typy DTO (do dodania w `src/types.ts`)

```typescript
/**
 * Konfiguracja alertów firmy (wewnętrzny ViewModel, nie pochodzący z API w MVP)
 * W MVP można przechowywać w company metadata lub dedykowanej tabeli settings.
 */
export interface AlertsConfigDTO {
  alertsEnabled: boolean;
  alertRecipientEmail: string; // info-only, z auth.users
}

/**
 * Agregowane metryki telemetryczne UX.
 * Odpowiedź z GET /api/telemetry z parametrami aggregate.
 */
export interface TelemetryAggregatesDTO {
  /**
   * Mediana czasu wypełnienia formularza (w sekundach)
   */
  medianFormDurationSeconds: number;
  
  /**
   * Łączna liczba wypełnień formularza w analizowanym okresie
   */
  totalFormSubmissions: number;
  
  /**
   * Konwersja: % linków, które doprowadziły do wysłania raportu
   */
  conversionRate: number; // np. 0.73 = 73%
  
  /**
   * Trend w porównaniu do poprzedniego okresu (opcjonalny)
   */
  trend?: {
    medianDurationChange: number; // zmiana w sekundach (+ lub -)
    conversionRateChange: number; // zmiana w % (+ lub -)
  };
  
  /**
   * Dane do wykresu (opcjonalne)
   */
  dailyData?: TelemetryDataPoint[];
}

/**
 * Punkt danych telemetrycznych dla wykresu
 */
export interface TelemetryDataPoint {
  date: IsoDateOnlyString; // "YYYY-MM-DD"
  medianDurationSeconds: number;
  submissionCount: number;
}

/**
 * Komenda aktualizacji konfiguracji alertów (do API)
 */
export interface UpdateAlertsConfigCommand {
  alertsEnabled: boolean;
}
```

### 5.2 Istniejące typy (wykorzystywane)

Z `src/types.ts`:
- `EmailLogDTO` – już zdefiniowany (uuid, recipient, subject, status, sentAt, errorMessage, companyUuid).
- `EmailLogsListResponseDTO` – już zdefiniowany (Paginated<EmailLogDTO>).
- `GenerateReportLinksCommand` – już zdefiniowany (at, dryRun, driverUuids).
- `ReportLinksGenerateResponseDTO` – już zdefiniowany (generated, skipped).

### 5.3 Typy komponentów (lokalne)

```typescript
/**
 * Props dla głównego widoku
 */
export interface AlertsAndTelemetryViewProps {
  initialTelemetryData?: TelemetryAggregatesDTO | null;
  initialEmailLogs?: EmailLogDTO[] | null;
}

/**
 * Props dla AlertToggleCard
 */
export interface AlertToggleCardProps {
  alertsEnabled: boolean;
  recipientEmail: string;
  onToggle: (enabled: boolean) => Promise<void>;
  isPending: boolean;
}

/**
 * Props dla TelemetryMetricCard
 */
export interface TelemetryMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { direction: "up" | "down"; value: string };
}

/**
 * Props dla TelemetryChart
 */
export interface TelemetryChartProps {
  data: TelemetryDataPoint[];
}
```

---

## 6. Zarządzanie stanem

### 6.1 Stan lokalny

- **alertsEnabled** – boolean, przechowywany w state komponentu `AlertsConfigSection` lub pobierany z hooka.
- **isPending** – boolean, stan ładowania podczas mutacji (toggle alerts, manual trigger).

### 6.2 TanStack Query

Widok wykorzystuje TanStack Query do zarządzania stanem danych telemetrycznych i logów e-mail:

1. **useAlertsConfig** (nowy hook):
   - Klucz: `["alerts-config"]`
   - Endpoint: `GET /api/companies/me` lub dedykowany `GET /api/settings/alerts` (jeśli zaimplementowany)
   - Zwraca: `{ alertsEnabled: boolean, recipientEmail: string }`
   - Initial data: pobierana server-side w `alerts.astro` i przekazywana jako prop.

2. **useTelemetryAggregates** (nowy hook):
   - Klucz: `["telemetry-aggregates", { from, to, eventType }]`
   - Endpoint: `GET /api/telemetry?eventType=FORM_SUBMIT&bucket=day&from=<7dni>&to=<today>`
   - Zwraca: `TelemetryAggregatesDTO`
   - Initial data: pobierana server-side w `alerts.astro`.
   - staleTime: 5 minut (dane telemetryczne zmieniają się rzadko).

3. **useEmailLogs** (nowy hook):
   - Klucz: `["email-logs", { limit, sortBy, sortDir }]`
   - Endpoint: `GET /api/email-logs?limit=10&sortBy=sentAt&sortDir=desc`
   - Zwraca: `EmailLogsListResponseDTO`
   - Initial data: pobierana server-side.
   - staleTime: 1 minuta.

4. **useUpdateAlertsConfig** (mutacja):
   - Endpoint: `PATCH /api/settings/alerts` lub `PATCH /api/companies/me` (update metadata)
   - Optimistic update: natychmiastowe przełączenie toggle, rollback w przypadku błędu.
   - Invalidacja: `["alerts-config"]` po sukcesie.
   - Toast: 202 feedback "Ustawienia alertów zaktualizowane" lub błąd.

5. **useGenerateReportLinks** (mutacja, opcjonalna):
   - Endpoint: `POST /api/report-links:generate`
   - Body: `{ dryRun: false }`
   - Response: `{ generated: int, skipped: int }`
   - Toast: "Wygenerowano {generated} linków, pominięto {skipped}".

### 6.3 Custom hooki

Lokacja: `src/lib/settings/`

1. **useAlertsConfig**
   ```typescript
   export function useAlertsConfig(initialData?: AlertsConfigDTO) {
     return useQuery({
       queryKey: ["alerts-config"],
       queryFn: async () => {
         const response = await fetch("/api/settings/alerts");
         if (!response.ok) throw new Error("Failed to fetch alerts config");
         return response.json() as Promise<AlertsConfigDTO>;
       },
       initialData,
       staleTime: 5 * 60 * 1000, // 5 min
     });
   }
   ```

2. **useUpdateAlertsConfig**
   ```typescript
   export function useUpdateAlertsConfig() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: async (config: UpdateAlertsConfigCommand) => {
         const response = await fetch("/api/settings/alerts", {
           method: "PATCH",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(config),
         });
         if (!response.ok) throw new Error("Failed to update alerts config");
         return response.json();
       },
       onMutate: async (newConfig) => {
         await queryClient.cancelQueries({ queryKey: ["alerts-config"] });
         const previous = queryClient.getQueryData<AlertsConfigDTO>(["alerts-config"]);
         queryClient.setQueryData<AlertsConfigDTO>(["alerts-config"], (old) => ({
           ...old!,
           alertsEnabled: newConfig.alertsEnabled,
         }));
         return { previous };
       },
       onError: (err, variables, context) => {
         queryClient.setQueryData(["alerts-config"], context?.previous);
         toast.error("Nie udało się zaktualizować ustawień alertów", {
           description: err.message,
         });
       },
       onSuccess: () => {
         toast.success("Ustawienia alertów zaktualizowane");
       },
       onSettled: () => {
         queryClient.invalidateQueries({ queryKey: ["alerts-config"] });
       },
     });
   }
   ```

3. **useTelemetryAggregates**
   ```typescript
   export function useTelemetryAggregates(initialData?: TelemetryAggregatesDTO) {
     const from = new Date();
     from.setDate(from.getDate() - 7);
     const to = new Date();
     
     return useQuery({
       queryKey: ["telemetry-aggregates", { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] }],
       queryFn: async () => {
         const params = new URLSearchParams({
           eventType: "FORM_SUBMIT",
           bucket: "day",
           from: from.toISOString().split("T")[0],
           to: to.toISOString().split("T")[0],
         });
         const response = await fetch(`/api/telemetry?${params}`);
         if (!response.ok) throw new Error("Failed to fetch telemetry");
         return response.json() as Promise<TelemetryAggregatesDTO>;
       },
       initialData,
       staleTime: 5 * 60 * 1000, // 5 min
     });
   }
   ```

4. **useEmailLogs**
   ```typescript
   export function useEmailLogs(initialData?: EmailLogDTO[]) {
     return useQuery({
       queryKey: ["email-logs", { limit: 10, sortBy: "sentAt", sortDir: "desc" }],
       queryFn: async () => {
         const params = new URLSearchParams({
           limit: "10",
           sortBy: "sentAt",
           sortDir: "desc",
         });
         const response = await fetch(`/api/email-logs?${params}`);
         if (!response.ok) throw new Error("Failed to fetch email logs");
         const data: EmailLogsListResponseDTO = await response.json();
         return data.items;
       },
       initialData,
       staleTime: 60 * 1000, // 1 min
     });
   }
   ```

---

## 7. Integracja API

### 7.1 Endpointy wykorzystywane

1. **GET /api/settings/alerts** (nowy endpoint do implementacji, alternatywnie GET /api/companies/me z polem alerts)
   - Opis: Pobiera konfigurację alertów firmy.
   - Request: brak body, auth z JWT.
   - Response:
     ```json
     {
       "alertsEnabled": true,
       "alertRecipientEmail": "dispatcher@company.com"
     }
     ```
   - Typ odpowiedzi: `AlertsConfigDTO`
   - Błędy: 401 unauthorized, 404 not found, 500 internal error.

2. **PATCH /api/settings/alerts** (nowy endpoint do implementacji)
   - Opis: Aktualizuje konfigurację alertów.
   - Request:
     ```json
     {
       "alertsEnabled": false
     }
     ```
   - Typ żądania: `UpdateAlertsConfigCommand`
   - Response: 202 Accepted lub 200 OK z zaktualizowaną konfiguracją.
   - Typ odpowiedzi: `AlertsConfigDTO`
   - Błędy: 400 validation, 401 unauthorized, 429 rate limited, 500 internal error.

3. **POST /api/report-links:generate** (istniejący, opcjonalne użycie)
   - Opis: Ręczne generowanie linków raportowych (do preview/test).
   - Request:
     ```json
     {
       "dryRun": false,
       "driverUuids": []
     }
     ```
   - Typ żądania: `GenerateReportLinksCommand`
   - Response: 202 Accepted z podsumowaniem.
     ```json
     {
       "generated": 15,
       "skipped": 3
     }
     ```
   - Typ odpowiedzi: `ReportLinksGenerateResponseDTO`
   - Błędy: 400 validation, 401 unauthorized, 429 rate limited, 500 internal error.

4. **GET /api/email-logs** (istniejący, opcjonalne)
   - Opis: Pobiera logi wysłanych e-maili (paginowane).
   - Request params: `?limit=10&sortBy=sentAt&sortDir=desc&status=SENT|FAILED`
   - Response:
     ```json
     {
       "items": [
         {
           "uuid": "...",
           "recipient": "driver@example.com",
           "subject": "Alert: Brakujący raport dzienny",
           "status": "SENT",
           "sentAt": "2025-01-15T08:30:00Z",
           "errorMessage": null,
           "companyUuid": "..."
         }
       ],
       "nextCursor": null
     }
     ```
   - Typ odpowiedzi: `EmailLogsListResponseDTO`
   - Błędy: 401 unauthorized, 403 forbidden (jeśli restricted role), 429 rate limited.

5. **GET /api/telemetry** (istniejący, opcjonalne)
   - Opis: Pobiera zagregowane metryki telemetryczne.
   - Request params: `?eventType=FORM_SUBMIT&bucket=day&from=2025-01-08&to=2025-01-15`
   - Response (format do ustalenia w implementacji API):
     ```json
     {
       "medianFormDurationSeconds": 85,
       "totalFormSubmissions": 142,
       "conversionRate": 0.73,
       "trend": {
         "medianDurationChange": -5,
         "conversionRateChange": 0.02
       },
       "dailyData": [
         { "date": "2025-01-08", "medianDurationSeconds": 90, "submissionCount": 20 },
         { "date": "2025-01-09", "medianDurationSeconds": 87, "submissionCount": 21 }
       ]
     }
     ```
   - Typ odpowiedzi: `TelemetryAggregatesDTO`
   - Błędy: 400 validation (invalid date range), 401 unauthorized, 429 rate limited.

### 7.2 Obsługa błędów API

- **401 Unauthorized:** Przekierowanie na `/signin?returnUrl=/settings/alerts`.
- **403 Forbidden:** Wyświetlenie baneru "Brak uprawnień do tej funkcji".
- **404 Not Found:** Komunikat "Dane nie znalezione" z przyciskiem "Spróbuj ponownie".
- **429 Too Many Requests:** Toast "Przekroczono limit żądań. Spróbuj ponownie za chwilę" z `Retry-After`.
- **500 Internal Server Error:** Alert "Wystąpił błąd serwera. Spróbuj ponownie później".

---

## 8. Interakcje użytkownika

### 8.1 Włączanie/wyłączanie alertów

1. Użytkownik wchodzi na `/settings/alerts`.
2. Widzi sekcję "Alerty o brakujących raportach" z przełącznikiem (Switch).
3. Przełącznik jest w stanie "Włączony" (checked) lub "Wyłączony" (unchecked) zgodnie z aktualną konfiguracją.
4. Użytkownik klika przełącznik, aby zmienić stan.
5. Frontend natychmiast zmienia stan przełącznika (optimistic update).
6. Wysyłane jest żądanie `PATCH /api/settings/alerts` z nowym stanem.
7. Jeśli sukces (202/200):
   - Toast "Ustawienia alertów zaktualizowane".
   - Stan przełącznika pozostaje zmieniony.
8. Jeśli błąd (4xx/5xx):
   - Rollback: przełącznik wraca do poprzedniego stanu.
   - Toast z komunikatem błędu.

### 8.2 Przeglądanie logów e-mail (opcjonalne)

1. Użytkownik widzi sekcję "Ostatnie alerty" z listą 5-10 ostatnich wysłanych e-maili.
2. Lista pokazuje: odbiorca, temat, status (badge), data wysłania.
3. Jeśli status "FAILED", użytkownik widzi badge czerwony i opcjonalnie komunikat błędu (tooltip lub inline).
4. Użytkownik klika "Zobacz wszystkie logi" – nawigacja do `/settings/email-logs` (opcjonalny pełny widok lub modal).

### 8.3 Przeglądanie metryk telemetrycznych

1. Użytkownik widzi sekcję "Telemetria UX" z kartami metryk:
   - "Mediana czasu wypełnienia: 85s"
   - "Łączna liczba wypełnień: 142"
   - "Konwersja linków: 73%"
2. Opcjonalnie widzi mini wykres trendu mediany czasu w ciągu ostatnich 7 dni.
3. Hover na wykresie pokazuje tooltip z wartością dla danego dnia.
4. Jeśli brak danych telemetrycznych (np. nowa instalacja), widzi komunikat "Brak danych do wyświetlenia. Dane pojawią się po pierwszych raportach kierowców."

### 8.4 Ręczne generowanie linków (opcjonalne)

1. Użytkownik widzi przycisk "Wygeneruj linki teraz" w sekcji "Konfiguracja alertów" (jeśli włączone w MVP).
2. Klika przycisk.
3. Frontend wysyła `POST /api/report-links:generate` z `dryRun: false`.
4. Przycisk zmienia stan na "Generowanie..." z ikoną loadera.
5. Po sukcesie (202):
   - Toast "Wygenerowano 15 linków, pominięto 3".
   - Przycisk wraca do stanu aktywnego.
6. Po błędzie:
   - Toast z komunikatem błędu.

---

## 9. Warunki i walidacja

### 9.1 Walidacja włączania alertów

- **Warunek:** alertsEnabled to boolean (true/false).
- **Weryfikacja:** brak walidacji po stronie UI (boolean toggle).
- **API:** endpoint `/api/settings/alerts` przyjmuje `{ "alertsEnabled": boolean }`.
- **Wpływ:** Zmiana stanu przełącznika natychmiastowo wywołuje mutację.

### 9.2 Walidacja zakresu dat telemetrii

- **Warunek:** zakres dat dla telemetrii to ostatnie 7 dni (ustalony w hook).
- **Weryfikacja:** brak walidacji po stronie UI (zakres ustalony w kodzie).
- **API:** endpoint `/api/telemetry` wymaga `from` i `to` w formacie YYYY-MM-DD.
- **Wpływ:** Jeśli API zwróci 400 (invalid range), wyświetlany jest komunikat błędu.

### 9.3 Walidacja logów e-mail

- **Warunek:** limit logów to max 10 na stronę.
- **Weryfikacja:** brak walidacji po stronie UI (ustalony w hook).
- **API:** endpoint `/api/email-logs` akceptuje `limit` do 100 (zgodnie z API plan).
- **Wpływ:** Jeśli API zwróci 429 (rate limited), wyświetlany jest komunikat.

### 9.4 Walidacja ręcznego generowania linków (opcjonalne)

- **Warunek:** endpoint `/api/report-links:generate` wymaga uwierzytelnienia.
- **Weryfikacja:** frontend sprawdza, czy użytkownik jest zalogowany (middleware).
- **API:** 401 unauthorized jeśli brak JWT.
- **Wpływ:** Redirect na `/signin` jeśli utrata sesji podczas kliknięcia.

---

## 10. Obsługa błędów

### 10.1 Błędy pobierania danych (GET requests)

- **401 Unauthorized:**
  - Opis: Utrata sesji podczas ładowania danych.
  - Obsługa: Redirect na `/signin?returnUrl=/settings/alerts`.
  
- **403 Forbidden:**
  - Opis: Brak uprawnień do przeglądania logów e-mail.
  - Obsługa: Wyświetlenie baneru "Brak uprawnień do tej funkcji. Skontaktuj się z administratorem."
  
- **404 Not Found:**
  - Opis: Dane nie istnieją (np. konfiguracja alertów nie została jeszcze utworzona).
  - Obsługa: Wyświetlenie komunikatu "Brak konfiguracji alertów. Użyj przełącznika, aby włączyć alerty."
  
- **429 Too Many Requests:**
  - Opis: Przekroczenie limitu żądań.
  - Obsługa: Toast "Przekroczono limit żądań. Spróbuj ponownie za {Retry-After} sekund."
  
- **500 Internal Server Error:**
  - Opis: Błąd serwera.
  - Obsługa: Alert "Wystąpił błąd serwera. Spróbuj ponownie później." z przyciskiem "Odśwież".

### 10.2 Błędy mutacji (PATCH/POST requests)

- **400 Bad Request:**
  - Opis: Walidacja failed (np. niepoprawny format danych).
  - Obsługa: Toast z komunikatem z pola `message` w ProblemDetail, rollback optimistic update.
  
- **401 Unauthorized:**
  - Opis: Utrata sesji podczas wysyłania żądania.
  - Obsługa: Redirect na `/signin?returnUrl=/settings/alerts`.
  
- **409 Conflict:**
  - Opis: Konflikt (np. próba aktualizacji przestarzałych danych).
  - Obsługa: Toast "Konfiguracja została zmieniona. Odśwież stronę i spróbuj ponownie.", rollback.
  
- **429 Too Many Requests:**
  - Opis: Przekroczenie limitu.
  - Obsługa: Toast "Przekroczono limit żądań. Spróbuj ponownie za chwilę.", rollback.
  
- **500 Internal Server Error:**
  - Opis: Błąd serwera.
  - Obsługa: Toast "Nie udało się zaktualizować ustawień. Spróbuj ponownie później.", rollback.

### 10.3 Offline handling

- Jeśli użytkownik jest offline podczas zmiany konfiguracji:
  - TanStack Query automatycznie wstrzymuje żądania.
  - Toast "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
  - Stan przełącznika wraca do poprzedniego (rollback).

### 10.4 Brak danych telemetrycznych

- Jeśli API zwróci puste dane (`totalFormSubmissions: 0` lub `dailyData: []`):
  - Wyświetlenie komunikatu "Brak danych telemetrycznych. Dane pojawią się po pierwszych raportach kierowców."
  - Brak wykresu, karty metryk pokazują "—" lub "0".

---

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów

1. Dodaj nowe typy DTO do `src/types.ts`:
   - `AlertsConfigDTO`
   - `UpdateAlertsConfigCommand`
   - `TelemetryAggregatesDTO`
   - `TelemetryDataPoint`
2. Upewnij się, że `EmailLogDTO` i `EmailLogsListResponseDTO` są już zdefiniowane (sprawdź w `types.ts`).

### Krok 2: Implementacja endpointów API (jeśli jeszcze nie istnieją)

1. Utwórz `src/pages/api/settings/alerts.ts`:
   - `GET` – pobiera konfigurację alertów (z metadata company lub dedykowanej tabeli).
   - `PATCH` – aktualizuje `alertsEnabled`.
2. Opcjonalnie: Rozszerz istniejący `GET /api/telemetry` o agregację i buckets (jeśli jeszcze nie zaimplementowane).
3. Upewnij się, że `GET /api/email-logs` jest zaimplementowany zgodnie z API plan.

### Krok 3: Utworzenie custom hooków

1. Utwórz `src/lib/settings/queries.ts` (jeśli nie istnieje) lub rozszerz istniejący.
2. Dodaj hooki:
   - `useAlertsConfig`
   - `useTelemetryAggregates`
   - `useEmailLogs`
3. Utwórz `src/lib/settings/mutations.ts`:
   - `useUpdateAlertsConfig`
   - `useGenerateReportLinks` (opcjonalny)

### Krok 4: Implementacja komponentów UI

1. **InfoBanner** (`src/components/settings/InfoBanner.tsx`):
   - Prosty komponent z `Alert` (shadcn/ui).
   
2. **AlertToggleCard** (`src/components/settings/AlertToggleCard.tsx`):
   - Karta z przełącznikiem `Switch`.
   - Używa hooka `useUpdateAlertsConfig`.
   - Obsługuje optimistic update i toast.
   
3. **ManualTriggerSection** (`src/components/settings/ManualTriggerSection.tsx`) – opcjonalny:
   - Przycisk do ręcznego generowania linków.
   - Używa hooka `useGenerateReportLinks`.
   
4. **AlertsConfigSection** (`src/components/settings/AlertsConfigSection.tsx`):
   - Kompozycja `AlertToggleCard` + `InfoBanner` + `ManualTriggerSection`.
   
5. **EmailLogItem** (`src/components/settings/EmailLogItem.tsx`):
   - Wiersz/karta z pojedynczym logiem e-mail.
   
6. **EmailLogsList** (`src/components/settings/EmailLogsList.tsx`):
   - Lista logów z mapowaniem `EmailLogItem`.
   
7. **EmailLogsSection** (`src/components/settings/EmailLogsSection.tsx`):
   - Karta z listą logów.
   - Używa hooka `useEmailLogs`.
   
8. **TelemetryMetricCard** (`src/components/settings/TelemetryMetricCard.tsx`):
   - Karta z pojedynczą metryką.
   
9. **TelemetryChart** (`src/components/settings/TelemetryChart.tsx`) – opcjonalny:
   - Mini wykres z recharts.
   
10. **TelemetrySection** (`src/components/settings/TelemetrySection.tsx`):
    - Karta z metrykami i wykresem.
    - Używa hooka `useTelemetryAggregates`.

11. **AlertsAndTelemetryView** (`src/components/settings/AlertsAndTelemetryView.tsx`):
    - Główny widok z kompozycją sekcji.
    - Obsługuje loading states i error handling.

12. **AlertsAndTelemetryViewWithProvider** (`src/components/settings/AlertsAndTelemetryViewWithProvider.tsx`):
    - Wrapper z `QueryClientProvider`.

### Krok 5: Utworzenie strony Astro

1. Utwórz `src/pages/settings/alerts.astro`:
   - Sprawdź sesję (Supabase JWT).
   - Pobierz initial data server-side:
     - `GET /api/settings/alerts` (konfiguracja alertów).
     - `GET /api/telemetry` (metryki telemetryczne).
     - `GET /api/email-logs` (ostatnie logi) – opcjonalnie.
   - Przekaż initial data do `AlertsAndTelemetryViewWithProvider` jako propsy.
   - Dodaj nawigację zakładkową (Profil | Alerty | Konto) zgodną z `profile.astro`.

### Krok 6: Stylowanie i responsywność

1. Upewnij się, że wszystkie komponenty wykorzystują klasy Tailwind zgodnie z design system.
2. Sprawdź responsywność:
   - Desktop: karty w grid (2 kolumny lub single column).
   - Mobile: karty w single column, przełącznik duży hit area.
3. Przetestuj dark mode (jeśli włączony).

### Krok 7: Testy jednostkowe

1. Napisz testy dla komponentów:
   - `AlertToggleCard.test.tsx` – sprawdź toggle i optimistic update.
   - `TelemetryMetricCard.test.tsx` – sprawdź renderowanie wartości.
   - `EmailLogsList.test.tsx` – sprawdź mapowanie logów.
2. Testy hooków:
   - `useAlertsConfig.test.ts` – mock fetch, sprawdź query.
   - `useUpdateAlertsConfig.test.ts` – mock mutacji, sprawdź optimistic update i rollback.

### Krok 8: Integracja i testowanie E2E (opcjonalne)

1. Napisz test E2E:
   - Login jako spedytor.
   - Przejdź na `/settings/alerts`.
   - Przełącz alertsEnabled (sprawdź toast i zmianę stanu).
   - Sprawdź, czy konfiguracja została zapisana (reload strony).
2. Przetestuj scenariusze błędów:
   - Utrata sesji (401) → redirect na signin.
   - Rate limiting (429) → toast z komunikatem.

### Krok 9: Dokumentacja i refaktoryzacja

1. Dodaj JSDoc do wszystkich komponentów i hooków.
2. Upewnij się, że kod jest zgodny z ESLint i Prettier.
3. Zaktualizuj `src/components/settings/index.ts` (re-export nowych komponentów).

### Krok 10: Deployment i monitoring

1. Merge PR z implementacją widoku.
2. Deploy na staging, przetestuj manual.
3. Monitoruj logi API dla endpointów `/api/settings/alerts` i `/api/telemetry`.
4. Zbierz feedback od użytkowników pilotowych (US-014, US-017).

---

## Podsumowanie

Plan implementacji widoku **Ustawienia – Alerty i Telemetria** obejmuje:

- **3 główne sekcje:** Konfiguracja alertów, Historia e-mail (opcjonalna), Telemetria UX.
- **Nowe typy DTO:** `AlertsConfigDTO`, `TelemetryAggregatesDTO`, `TelemetryDataPoint`.
- **Custom hooki TanStack Query:** `useAlertsConfig`, `useTelemetryAggregates`, `useEmailLogs`, `useUpdateAlertsConfig`.
- **Komponenty UI:** `AlertToggleCard`, `InfoBanner`, `TelemetryMetricCard`, `TelemetryChart`, `EmailLogsList`.
- **Integracja API:** 2-3 nowe endpointy (GET/PATCH /api/settings/alerts, GET /api/telemetry, GET /api/email-logs).
- **Obsługa błędów:** Rollback optimistic updates, toasty z komunikatami, redirect przy 401.

Widok jest zgodny z PRD (US-014, US-017), UI plan oraz stack technologiczny (Astro 5, React 19, TanStack Query, Shadcn/ui, Tailwind 4).


