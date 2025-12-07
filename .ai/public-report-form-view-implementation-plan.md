# Plan implementacji widoku Publicznego Formularza Raportu

## 1. Przegląd

Publiczny formularz raportu to kluczowy element systemu RouteLog, umożliwiający kierowcom szybkie wypełnienie raportu dziennego poprzez jednorazowy link otrzymany e-mailem. Widok składa się z trzech głównych stanów:

1. **Formularz raportu** - główny interfejs do zgłaszania statusu trasy
2. **Potwierdzenie sukcesu** - ekran z możliwością edycji przez 10 minut
3. **Błąd tokenu** - obsługa wygasłych, zużytych lub nieprawidłowych linków

Główne cele widoku:

- Maksymalizacja konwersji link → raport (cel: ≥70% w 24h)
- Minimalizacja czasu wypełnienia (cel: <90s mediana)
- Mobile-first UX z obsługą offline
- Zbieranie telemetrii dla optymalizacji procesu

## 2. Routing widoku

Widok dostępny na następujących ścieżkach:

- **Formularz główny**: `/public/report-links/[token]`
- **Potwierdzenie**: `/public/report-links/[token]/success` lub inline w tym samym widoku
- **Błąd**: `/public/report-links/[token]/error` lub inline w tym samym widoku

Wszystkie ścieżki są **publiczne** (nie wymagają uwierzytelnienia) i nie używają `AuthenticatedLayout`.

## 3. Struktura komponentów

```
src/pages/public/report-links/
├── [token].astro                    # Główna strona formularza
│   └── PublicReportForm.tsx         # Główny komponent React (island)
│       ├── TokenGuard               # Walidacja tokenu i guard
│       ├── FormLoadingState         # Skeleton podczas ładowania
│       ├── FormHeader               # Nagłówek z danymi kierowcy
│       ├── OfflineBanner            # Banner offline/online
│       ├── StatusSwitch             # Przełącznik OK/Problem
│       ├── HappyPathSection         # Sekcja "Wszystko OK"
│       ├── ProblemPathSection       # Dynamiczne sekcje problemów
│       │   ├── RouteStatusField
│       │   ├── DelayFields
│       │   ├── DamageFields
│       │   └── BlockersField
│       ├── SubmitButton             # Przycisk wysyłki z loadingiem
│       └── FormFooter               # Info o edycji i prywatności
│
├── success/
│   └── [token].astro                # Strona potwierdzenia (opcjonalnie)
│       └── SuccessView.tsx
│           ├── SuccessCard          # Komunikat sukcesu
│           ├── CountdownTimer       # Licznik do edycji
│           ├── EditButton           # Przycisk do edycji
│           └── StatusBanner         # Info o AI processing
│
└── error/
    └── [token].astro                # Strona błędu (opcjonalnie)
        └── ErrorView.tsx
            ├── ErrorIllustration    # Ikona/ilustracja błędu
            ├── ErrorMessage         # Komunikat z opisem
            ├── ActionButtons        # CTA (odśwież, kontakt)
            └── ContactCard          # Informacje kontaktowe
```

## 4. Szczegóły komponentów

### 4.1 PublicReportForm (główny komponent)

**Opis**: Główny komponent zarządzający całym przepływem formularza raportu. Obsługuje walidację tokenu, stan formularza, przełączanie między happy path a problem path oraz wysyłkę danych.

**Główne elementy**:

```tsx
<form onSubmit={handleSubmit}>
  <TokenGuard token={token} />
  <FormHeader driverName={...} vehicleRegistration={...} />
  <OfflineBanner isOnline={isOnline} />
  <StatusSwitch value={isProblem} onChange={setIsProblem} />

  {!isProblem ? (
    <HappyPathSection />
  ) : (
    <ProblemPathSection register={register} errors={errors} />
  )}

  <SubmitButton isSubmitting={isSubmitting} isProblem={isProblem} />
  <FormFooter expiresAt={...} editableUntil={...} />
</form>
```

**Obsługiwane interakcje**:

- Walidacja tokenu przy montowaniu komponentu (GET `/api/public/report-links/{token}`)
- Przełączanie między "Wszystko OK" a "Problem"
- Walidacja formularza inline
- Wysyłka raportu (POST `/api/public/report-links/{token}/reports`)
- Monitoring czasu wypełnienia (telemetria)
- Obsługa offline (kolejkowanie w IndexedDB)

**Obsługiwana walidacja**:

- Token musi być valid (200) - w przeciwnym razie redirect do error
- Jeśli `isProblem = false`: wszystkie pola problemów są `null` lub puste
- Jeśli `isProblem = true`:
  - `routeStatus` wymagany (enum)
  - `delayMinutes >= 0`
  - Jeśli `delayMinutes > 0`, `delayReason` wymagany (min 3 znaki)
  - Jeśli `routeStatus = PARTIALLY_COMPLETED`, komentarz wymagany w `delayReason` lub `nextDayBlockers`
  - `timezone` wymagany (domyślnie z walidacji tokenu lub browser)

**Typy**:

- `PublicReportLinkValidationDTO` (z API)
- `PublicReportSubmitCommand` (wysyłka)
- `PublicReportSubmitResponseDTO` (odpowiedź)
- `ReportFormViewModel` (lokalny stan, szczegóły w sekcji 5)

**Propsy**:

```tsx
interface PublicReportFormProps {
  token: string;
  onSuccess?: (data: PublicReportSubmitResponseDTO) => void;
  onError?: (error: ProblemDetail) => void;
}
```

### 4.2 TokenGuard

**Opis**: Komponent sprawdzający poprawność tokenu przy pierwszym renderze. Wyświetla loading state podczas walidacji, przekierowuje do error state przy błędzie.

**Główne elementy**:

```tsx
{
  isValidating && <FormLoadingState />;
}
{
  error && <Navigate to="error" />;
}
{
  validationData && children;
}
```

**Obsługiwane interakcje**:

- Mount: GET `/api/public/report-links/{token}`
- Zapisanie tokenu w SessionStorage (klucz: `routelog:token:${token}`)
- Redirect do error przy 404/409/410

**Obsługiwana walidacja**:

- Sprawdzenie czy token nie został już użyty w tej sesji
- Walidacja `valid: true` w odpowiedzi
- Sprawdzenie czy `expiresAt` nie minęło

**Typy**:

- `PublicReportLinkValidationDTO`

**Propsy**:

```tsx
interface TokenGuardProps {
  token: string;
  children: React.ReactNode;
  onValidated: (data: PublicReportLinkValidationDTO) => void;
}
```

### 4.3 StatusSwitch

**Opis**: Duży, wizualny przełącznik między happy path ("Wszystko OK") a problem path ("Mam problem do zgłoszenia").

**Główne elementy**:

```tsx
<div className="status-switch-container">
  <button type="button" className={isHappyPath ? "active" : ""} onClick={() => onChange(false)}>
    <CircleCheckBig /> Wszystko OK
  </button>

  <button type="button" className={!isHappyPath ? "active" : ""} onClick={() => onChange(true)}>
    <TriangleAlert /> Mam problem
  </button>
</div>
```

**Obsługiwane interakcje**:

- Kliknięcie przycisku "Wszystko OK" → resetuje wszystkie pola problemów
- Kliknięcie przycisku "Mam problem" → pokazuje dynamiczne sekcje

**Obsługiwana walidacja**: Brak walidacji, tylko przełącznik stanu.

**Typy**:

```tsx
interface StatusSwitchProps {
  value: boolean; // true = problem, false = ok
  onChange: (isProblem: boolean) => void;
}
```

### 4.4 HappyPathSection

**Opis**: Minimalistyczna sekcja wyświetlana gdy kierowca wybierze "Wszystko OK". Pokazuje potwierdzenie i informację o jednym kliknięciu do wysłania.

**Główne elementy**:

```tsx
<div className="happy-path-section">
  <div className="success-icon">
    <CircleCheckBig size={48} />
  </div>
  <p className="text-lg">Trasa przebiegła bez problemów? Wyślij raport jednym kliknięciem.</p>
  <p className="text-sm text-muted-foreground">Przez 10 minut będziesz mógł edytować ten raport.</p>
</div>
```

**Obsługiwane interakcje**: Brak, komponent informacyjny.

**Obsługiwana walidacja**: Brak pól do walidacji.

**Typy**: Brak propsów (statyczny).

### 4.5 ProblemPathSection

**Opis**: Dynamiczna sekcja z polami formularza dla zgłoszenia problemów. Zawiera wszystkie pola wymagane przez `PublicReportSubmitCommand`.

**Główne elementy**:

```tsx
<div className="problem-path-section space-y-6">
  <RouteStatusField register={register} error={errors.routeStatus} />

  <DelayFields register={register} errors={errors} watchDelayMinutes={watchDelayMinutes} />

  <DamageFields register={register} errors={errors} />

  <BlockersField register={register} error={errors.nextDayBlockers} />
</div>
```

**Obsługiwane interakcje**:

- Wybór statusu trasy (radio buttons lub select)
- Wprowadzenie opóźnienia (number input)
- Wprowadzenie powodu opóźnienia (textarea, warunkowe)
- Wprowadzenie szkód ładunku (textarea, opcjonalne)
- Wprowadzenie usterek pojazdu (textarea, opcjonalne)
- Wprowadzenie blockerów na jutro (textarea, opcjonalne)

**Obsługiwana walidacja**:

- `routeStatus`: wymagany, jeden z enum
- `delayMinutes`: wymagany, >= 0
- `delayReason`: wymagany gdy `delayMinutes > 0`, min 3 znaki
- `routeStatus = PARTIALLY_COMPLETED` wymaga komentarza w `delayReason` lub `nextDayBlockers`
- Wszystkie textarea: max 1000 znaków

**Typy**:

```tsx
interface ProblemPathSectionProps {
  register: UseFormRegister<ReportFormViewModel>;
  errors: FieldErrors<ReportFormViewModel>;
  watch: UseFormWatch<ReportFormViewModel>;
}
```

### 4.6 RouteStatusField

**Opis**: Pole wyboru statusu trasy z trzema opcjami.

**Główne elementy**:

```tsx
<div className="route-status-field">
  <Label htmlFor="routeStatus">Status trasy *</Label>
  <RadioGroup {...register("routeStatus")}>
    <RadioGroupItem value="COMPLETED" id="completed">
      Ukończono
    </RadioGroupItem>
    <RadioGroupItem value="PARTIALLY_COMPLETED" id="partial">
      Częściowo wykonano
    </RadioGroupItem>
    <RadioGroupItem value="CANCELLED" id="cancelled">
      Odwołano
    </RadioGroupItem>
  </RadioGroup>
  {error && <FormMessage>{error.message}</FormMessage>}
</div>
```

**Obsługiwane interakcje**: Wybór jednej z opcji.

**Obsługiwana walidacja**:

- Wymagany wybór jednej opcji
- Wartość musi być z enum `ReportRouteStatus`

**Typy**:

```tsx
interface RouteStatusFieldProps {
  register: UseFormRegister<ReportFormViewModel>;
  error?: FieldError;
  value?: ReportRouteStatus;
}
```

### 4.7 DelayFields

**Opis**: Grupa pól dla opóźnienia: liczba minut + powód (textarea warunkowy).

**Główne elementy**:

```tsx
<div className="delay-fields space-y-4">
  <div>
    <Label htmlFor="delayMinutes">Opóźnienie (minuty) *</Label>
    <Input type="number" min={0} {...register("delayMinutes", { valueAsNumber: true })} />
    {errors.delayMinutes && <FormMessage>{errors.delayMinutes.message}</FormMessage>}
  </div>

  {watchDelayMinutes > 0 && (
    <div>
      <Label htmlFor="delayReason">Powód opóźnienia *</Label>
      <Textarea {...register("delayReason")} placeholder="Opisz przyczynę opóźnienia..." />
      {errors.delayReason && <FormMessage>{errors.delayReason.message}</FormMessage>}
    </div>
  )}
</div>
```

**Obsługiwane interakcje**:

- Wpisanie liczby minut
- Automatyczne pokazanie/ukrycie pola powodu w zależności od wartości

**Obsługiwana walidacja**:

- `delayMinutes`: wymagany, >= 0, liczba całkowita
- `delayReason`: wymagany gdy `delayMinutes > 0`, min 3 znaki, max 1000 znaków

**Typy**:

```tsx
interface DelayFieldsProps {
  register: UseFormRegister<ReportFormViewModel>;
  errors: FieldErrors<ReportFormViewModel>;
  watchDelayMinutes: number;
}
```

### 4.8 DamageFields

**Opis**: Dwa opcjonalne pola textarea dla szkód ładunku i usterek pojazdu.

**Główne elementy**:

```tsx
<div className="damage-fields space-y-4">
  <div>
    <Label htmlFor="cargoDamageDescription">Uszkodzenia ładunku (opcjonalnie)</Label>
    <Textarea {...register("cargoDamageDescription")} placeholder="Opisz ewentualne uszkodzenia ładunku..." />
  </div>

  <div>
    <Label htmlFor="vehicleDamageDescription">Usterki pojazdu (opcjonalnie)</Label>
    <Textarea {...register("vehicleDamageDescription")} placeholder="Opisz ewentualne usterki pojazdu..." />
  </div>
</div>
```

**Obsługiwane interakcje**: Wpisanie tekstu (opcjonalne).

**Obsługiwana walidacja**:

- Oba pola opcjonalne
- Max 1000 znaków każde

**Typy**:

```tsx
interface DamageFieldsProps {
  register: UseFormRegister<ReportFormViewModel>;
  errors?: FieldErrors<ReportFormViewModel>;
}
```

### 4.9 BlockersField

**Opis**: Pole textarea dla blockerów na następny dzień.

**Główne elementy**:

```tsx
<div>
  <Label htmlFor="nextDayBlockers">Problemy na jutro (opcjonalnie)</Label>
  <Textarea {...register("nextDayBlockers")} placeholder="Czy coś może zablokować jutrzejszą trasę?" />
  {error && <FormMessage>{error.message}</FormMessage>}
</div>
```

**Obsługiwane interakcje**: Wpisanie tekstu (opcjonalne).

**Obsługiwana walidacja**:

- Opcjonalne
- Max 1000 znaków
- Wymagane gdy `routeStatus = PARTIALLY_COMPLETED` i brak `delayReason`

**Typy**:

```tsx
interface BlockersFieldProps {
  register: UseFormRegister<ReportFormViewModel>;
  error?: FieldError;
}
```

### 4.10 SubmitButton

**Opis**: Główny przycisk wysyłki z obsługą stanu loading i tekstu dostosowanego do trybu.

**Główne elementy**:

```tsx
<Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !isOnline}>
  {isSubmitting ? (
    <>
      <LoaderCircle className="animate-spin" />
      Wysyłam...
    </>
  ) : isProblem ? (
    "Wyślij zgłoszenie problemu"
  ) : (
    "Wyślij raport - Wszystko OK"
  )}
</Button>
```

**Obsługiwane interakcje**:

- Kliknięcie wywołuje `onSubmit` formularza
- Disabled gdy trwa wysyłka lub brak sieci

**Obsługiwana walidacja**: Walidacja całego formularza (React Hook Form).

**Typy**:

```tsx
interface SubmitButtonProps {
  isSubmitting: boolean;
  isProblem: boolean;
  isOnline: boolean;
}
```

### 4.11 OfflineBanner

**Opis**: Banner informujący o braku połączenia i kolejkowaniu offline.

**Główne elementy**:

```tsx
{
  !isOnline && (
    <Alert variant="warning">
      <Info />
      <AlertTitle>Brak połączenia</AlertTitle>
      <AlertDescription>Raport zostanie wysłany automatycznie po przywróceniu połączenia.</AlertDescription>
    </Alert>
  );
}
```

**Obsługiwane interakcje**:

- Automatyczne pokazanie/ukrycie w zależności od `navigator.onLine`
- Hook `useNetworkStatus()` do monitorowania

**Obsługiwana walidacja**: Brak.

**Typy**:

```tsx
interface OfflineBannerProps {
  isOnline: boolean;
}
```

### 4.12 FormHeader

**Opis**: Nagłówek formularza z powitaniem kierowcy i danymi o pojeździe.

**Główne elementy**:

```tsx
<div className="form-header">
  <h1 className="text-2xl font-bold">Cześć, {driverName}!</h1>
  <p className="text-muted-foreground">Pojazd: {vehicleRegistration || "Brak przypisania"}</p>
  <p className="text-sm text-muted-foreground">Link wygasa: {formatDateTime(expiresAt)}</p>
</div>
```

**Obsługiwane interakcje**: Brak (komponent prezentacyjny).

**Obsługiwana walidacja**: Brak.

**Typy**:

```tsx
interface FormHeaderProps {
  driverName: string;
  vehicleRegistration: string | null;
  expiresAt: IsoDateString;
}
```

### 4.13 FormFooter

**Opis**: Stopka z informacjami o możliwości edycji i polityce prywatności.

**Główne elementy**:

```tsx
<div className="form-footer text-sm text-muted-foreground">
  <p>Będziesz mógł edytować ten raport przez 10 minut od wysłania.</p>
  <p>Edycja dostępna do: {formatDateTime(editableUntil)}</p>
  <p className="text-xs mt-4">Przesłane dane są chronione i dostępne tylko dla Twojej firmy.</p>
</div>
```

**Obsługiwane interakcje**: Brak.

**Obsługiwana walidacja**: Brak.

**Typy**:

```tsx
interface FormFooterProps {
  editableUntil: IsoDateString;
}
```

### 4.14 SuccessView (komponent strony potwierdzenia)

**Opis**: Komponent wyświetlany po udanej wysyłce raportu. Pokazuje potwierdzenie i umożliwia edycję.

**Główne elementy**:

```tsx
<div className="success-view">
  <SuccessCard reportUuid={reportUuid} />
  <CountdownTimer targetTime={editableUntil} onExpire={() => setCanEdit(false)} />
  {canEdit && <EditButton onClick={() => navigate(`/public/report-links/${token}`)} />}
  <StatusBanner>AI przetwarza Twój raport. Wyniki będą dostępne dla spedytora w ciągu 30 sekund.</StatusBanner>
</div>
```

**Obsługiwane interakcje**:

- Przycisk "Edytuj raport" (dostępny przez 10 min)
- Automatyczne ukrycie przycisku po upływie czasu

**Obsługiwana walidacja**:

- Sprawdzenie `now() <= editableUntil`

**Typy**:

```tsx
interface SuccessViewProps {
  reportUuid: Uuid;
  editableUntil: IsoDateString;
  token: string;
}
```

### 4.15 CountdownTimer

**Opis**: Licznik odmierzający czas do końca możliwości edycji.

**Główne elementy**:

```tsx
<div className="countdown-timer" aria-live="polite">
  <Clock />
  <span>Możesz edytować raport przez: {formatDuration(timeLeft)}</span>
</div>
```

**Obsługiwane interakcje**:

- Odliczanie co sekundę
- Wywołanie callback `onExpire` gdy czas minie

**Obsługiwana walidacja**: Brak.

**Typy**:

```tsx
interface CountdownTimerProps {
  targetTime: IsoDateString;
  onExpire: () => void;
}
```

### 4.16 ErrorView (komponent strony błędu)

**Opis**: Komponent wyświetlany przy błędach tokenu (404/409/410).

**Główne elementy**:

```tsx
<div className="error-view">
  <ErrorIllustration type={errorType} />
  <ErrorMessage title={getErrorTitle(errorType)} description={getErrorDescription(errorType)} />
  <ActionButtons>
    <Button onClick={() => window.location.reload()}>Spróbuj ponownie</Button>
  </ActionButtons>
  <ContactCard>Jeśli problem się powtarza, skontaktuj się z dyspozytorem.</ContactCard>
</div>
```

**Obsługiwane interakcje**:

- Przycisk "Spróbuj ponownie" (odświeżenie)
- Link/tekst z kontaktem

**Obsługiwana walidacja**: Brak.

**Typy**:

```tsx
type ErrorType = "404" | "409" | "410" | "500";

interface ErrorViewProps {
  errorType: ErrorType;
  message?: string;
}
```

## 5. Typy

### 5.1 Typy z API (już zdefiniowane w types.ts)

**PublicReportLinkValidationDTO**:

```typescript
type PublicReportLinkValidationDTO = {
  valid: true;
  driverName: string;
  vehicleRegistration: string | null;
  expiresAt: IsoDateString;
  editableUntil: IsoDateString;
};
```

**PublicReportSubmitCommand**:

```typescript
type PublicReportSubmitCommand = {
  routeStatus: ReportRouteStatus; // 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'CANCELLED'
  delayMinutes: number;
  delayReason: string | null;
  cargoDamageDescription: string | null;
  vehicleDamageDescription: string | null;
  nextDayBlockers: string | null;
  timezone: string; // IANA timezone, np. "Europe/Warsaw"
};
```

**PublicReportSubmitResponseDTO**:

```typescript
interface PublicReportSubmitResponseDTO {
  reportUuid: Uuid;
  editableUntil: IsoDateString;
}
```

**PublicReportUpdateCommand**:

```typescript
type PublicReportUpdateCommand = Partial<PublicReportSubmitCommand>;
```

### 5.2 ViewModels (nowe typy dla formularza)

**ReportFormViewModel**:

```typescript
interface ReportFormViewModel {
  // Stan przełącznika
  isProblem: boolean;

  // Pola problemu
  routeStatus: ReportRouteStatus;
  delayMinutes: number;
  delayReason: string;
  cargoDamageDescription: string;
  vehicleDamageDescription: string;
  nextDayBlockers: string;

  // Metadane
  timezone: string;
}
```

**TokenValidationState**:

```typescript
interface TokenValidationState {
  isValidating: boolean;
  isValid: boolean;
  validationData: PublicReportLinkValidationDTO | null;
  error: ProblemDetail | null;
}
```

**FormSubmissionState**:

```typescript
interface FormSubmissionState {
  isSubmitting: boolean;
  isSuccess: boolean;
  error: ProblemDetail | null;
  responseData: PublicReportSubmitResponseDTO | null;
}
```

**TelemetryFormState** (dla telemetrii):

```typescript
interface TelemetryFormState {
  startTime: number; // timestamp
  endTime: number | null;
  interactions: number; // liczba interakcji z polami
  switchedToProblems: boolean;
}
```

**FormViewState** (union type dla stanów widoku):

```typescript
type FormViewState =
  | { type: "loading" }
  | { type: "form"; data: PublicReportLinkValidationDTO }
  | { type: "success"; data: PublicReportSubmitResponseDTO }
  | { type: "error"; errorType: "404" | "409" | "410" | "500"; message?: string };
```

## 6. Zarządzanie stanem

### 6.1 Stan formularza (React Hook Form)

Formularz używa **React Hook Form** z walidacją **Zod**. Stan zarządzany przez hook `useForm`:

```typescript
const form = useForm<ReportFormViewModel>({
  resolver: zodResolver(reportFormSchema),
  defaultValues: {
    isProblem: false,
    routeStatus: "COMPLETED",
    delayMinutes: 0,
    delayReason: "",
    cargoDamageDescription: "",
    vehicleDamageDescription: "",
    nextDayBlockers: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  mode: "onBlur", // walidacja po opuszczeniu pola
});
```

### 6.2 Stan walidacji tokenu

Zarządzany przez custom hook `useTokenValidation`:

```typescript
function useTokenValidation(token: string) {
  const [state, setState] = useState<TokenValidationState>({
    isValidating: true,
    isValid: false,
    validationData: null,
    error: null,
  });

  useEffect(() => {
    validateToken(token)
      .then((data) =>
        setState({
          isValidating: false,
          isValid: true,
          validationData: data,
          error: null,
        })
      )
      .catch((error) =>
        setState({
          isValidating: false,
          isValid: false,
          validationData: null,
          error,
        })
      );
  }, [token]);

  return state;
}
```

### 6.3 Stan wysyłki formularza

Zarządzany przez TanStack Query (React Query):

```typescript
const submitMutation = useMutation({
  mutationFn: (data: PublicReportSubmitCommand) =>
    submitReport(token, data),
  onSuccess: (data) => {
    // Zapisz token i reportUuid w SessionStorage
    sessionStorage.setItem(`routelog:report:${data.reportUuid}`, token);
    // Przełącz na widok sukcesu
    setViewState({ type: 'success', data });
    // Wyślij telemetrię
    sendTelemetry({ ... });
  },
  onError: (error: ProblemDetail) => {
    // Pokaż toast z błędem
    toast.error(error.message);
    // Zaloguj błąd
    console.error('Report submission failed:', error);
  },
});
```

### 6.4 Stan offline/online

Zarządzany przez custom hook `useNetworkStatus`:

```typescript
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
```

### 6.5 Stan telemetrii

Zarządzany przez custom hook `useTelemetry`:

```typescript
function useTelemetry(token: string, reportUuid?: Uuid) {
  const [telemetryState, setTelemetryState] = useState<TelemetryFormState>({
    startTime: Date.now(),
    endTime: null,
    interactions: 0,
    switchedToProblems: false,
  });

  const recordInteraction = useCallback(() => {
    setTelemetryState((prev) => ({
      ...prev,
      interactions: prev.interactions + 1,
    }));
  }, []);

  const recordProblemSwitch = useCallback(() => {
    setTelemetryState((prev) => ({
      ...prev,
      switchedToProblems: true,
    }));
  }, []);

  const sendTelemetry = useCallback(async () => {
    const endTime = Date.now();
    const duration = (endTime - telemetryState.startTime) / 1000; // sekundy

    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "FORM_SUBMIT",
        occurredAt: new Date().toISOString(),
        metadata: {
          duration,
          interactions: telemetryState.interactions,
          switchedToProblems: telemetryState.switchedToProblems,
        },
        linkUuid: token, // teoretycznie może być UUID linku
        reportUuid,
      }),
    });
  }, [telemetryState, token, reportUuid]);

  return { recordInteraction, recordProblemSwitch, sendTelemetry };
}
```

### 6.6 Stan widoku (główny state machine)

Zarządzany przez `useState` w głównym komponencie:

```typescript
const [viewState, setViewState] = useState<FormViewState>({
  type: "loading",
});

// Przejścia stanu:
// loading -> form (po walidacji tokenu)
// loading -> error (przy błędzie tokenu)
// form -> success (po wysyłce)
// form -> error (przy błędzie wysyłki)
```

### 6.7 Offline Queue

Dla obsługi offline używamy IndexedDB (via `idb` library):

```typescript
// Struktura offline queue
interface OfflineQueueItem {
  id: string;
  token: string;
  data: PublicReportSubmitCommand;
  createdAt: IsoDateString;
  retries: number;
}

// Hook do zarządzania kolejką
function useOfflineQueue() {
  const { isOnline } = useNetworkStatus();

  const addToQueue = async (token: string, data: PublicReportSubmitCommand) => {
    const db = await openDB("routelog-offline", 1);
    await db.add("queue", {
      id: crypto.randomUUID(),
      token,
      data,
      createdAt: new Date().toISOString(),
      retries: 0,
    });
  };

  const processQueue = async () => {
    if (!isOnline) return;

    const db = await openDB("routelog-offline", 1);
    const items = await db.getAll("queue");

    for (const item of items) {
      try {
        await submitReport(item.token, item.data);
        await db.delete("queue", item.id);
        toast.success("Raport wysłany po przywróceniu połączenia");
      } catch (error) {
        if (item.retries < 3) {
          await db.put("queue", { ...item, retries: item.retries + 1 });
        } else {
          await db.delete("queue", item.id);
          toast.error("Nie udało się wysłać raportu. Skontaktuj się z dyspozytorem.");
        }
      }
    }
  };

  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline]);

  return { addToQueue };
}
```

## 7. Integracja API

### 7.1 Walidacja tokenu (GET)

**Endpoint**: `GET /api/public/report-links/{token}`

**Kiedy**: Przy pierwszym załadowaniu formularza (w `TokenGuard`).

**Request**: Brak body, token w URL.

**Response** (200 OK):

```typescript
{
  valid: true,
  driverName: "Jan Kowalski",
  vehicleRegistration: "WA12345",
  expiresAt: "2025-01-01T22:00:00Z",
  editableUntil: "2025-01-01T21:10:00Z"
}
```

**Error responses**:

- **404**: Token nie istnieje
- **409**: Token już użyty
- **410**: Token wygasł

**Implementacja**:

```typescript
async function validateToken(token: string): Promise<PublicReportLinkValidationDTO> {
  const response = await fetch(`/api/public/report-links/${token}`);

  if (!response.ok) {
    const error = (await response.json()) as ProblemDetail;
    throw error;
  }

  return response.json();
}
```

### 7.2 Wysyłka raportu (POST)

**Endpoint**: `POST /api/public/report-links/{token}/reports`

**Kiedy**: Po kliknięciu przycisku "Wyślij raport".

**Request** (typ: `PublicReportSubmitCommand`):

```typescript
{
  routeStatus: "COMPLETED",
  delayMinutes: 0,
  delayReason: null,
  cargoDamageDescription: null,
  vehicleDamageDescription: null,
  nextDayBlockers: null,
  timezone: "Europe/Warsaw"
}
```

**Response** (201 Created, typ: `PublicReportSubmitResponseDTO`):

```typescript
{
  reportUuid: "uuid-here",
  editableUntil: "2025-01-01T21:10:00Z"
}
```

**Error responses**:

- **400**: Błąd walidacji (np. brak `delayReason` gdy `delayMinutes > 0`)
- **404/409/410**: Problemy z tokenem (jak w GET)

**Implementacja**:

```typescript
async function submitReport(token: string, data: PublicReportSubmitCommand): Promise<PublicReportSubmitResponseDTO> {
  const response = await fetch(`/api/public/report-links/${token}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = (await response.json()) as ProblemDetail;
    throw error;
  }

  return response.json();
}
```

### 7.3 Edycja raportu (PATCH)

**Endpoint**: `PATCH /api/public/reports/{uuid}`

**Kiedy**: W widoku sukcesu, gdy kierowca kliknie "Edytuj raport" (przed upływem 10 min).

**Request** (typ: `PublicReportUpdateCommand`):

```typescript
{
  delayMinutes: 30,
  delayReason: "Zaktualizowany powód opóźnienia"
}
```

**Headers**:

```
Authorization: Bearer {token}
```

Token musi być taki sam jak użyty przy POST (przechowywany w SessionStorage).

**Response** (200 OK): Brak body lub status potwierdzenia.

**Error responses**:

- **403**: Token nieprawidłowy lub brak uprawnień
- **409**: Okno edycji minęło (`now() > editableUntil`)

**Implementacja**:

```typescript
async function updateReport(reportUuid: Uuid, token: string, data: PublicReportUpdateCommand): Promise<void> {
  const response = await fetch(`/api/public/reports/${reportUuid}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = (await response.json()) as ProblemDetail;
    throw error;
  }
}
```

### 7.4 Wysyłka telemetrii (POST)

**Endpoint**: `POST /api/telemetry`

**Kiedy**: Po udanym wysłaniu formularza lub przy błędach tokenu.

**Request** (typ: `TelemetryEventCommand`):

```typescript
{
  eventType: "FORM_SUBMIT",
  occurredAt: "2025-01-01T21:05:00Z",
  metadata: {
    duration: 45.2,
    interactions: 8,
    switchedToProblems: true
  },
  linkUuid: "link-uuid-here",
  reportUuid: "report-uuid-here"
}
```

**Response** (202 Accepted): Brak body.

**Implementacja**:

```typescript
async function sendTelemetry(data: TelemetryEventCommand): Promise<void> {
  await fetch("/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  // Fire-and-forget, nie blokujemy UI na odpowiedź
}
```

## 8. Interakcje użytkownika

### 8.1 Scenariusz Happy Path (US-007)

1. **Kierowca klika link z e-maila**
   - Otwiera się `/public/report-links/{token}`
   - Loading state podczas walidacji tokenu

2. **Formularz się ładuje**
   - Wyświetla się nagłówek z imieniem kierowcy
   - Domyślnie zaznaczony "Wszystko OK"
   - Przycisk "Wyślij raport - Wszystko OK" jest aktywny

3. **Kierowca klika "Wyślij"**
   - Przycisk zmienia się na "Wysyłam..." z spinnerem
   - POST do `/api/public/report-links/{token}/reports` z:
     ```json
     {
       "routeStatus": "COMPLETED",
       "delayMinutes": 0,
       "delayReason": null,
       "cargoDamageDescription": null,
       "vehicleDamageDescription": null,
       "nextDayBlockers": null,
       "timezone": "Europe/Warsaw"
     }
     ```

4. **Po sukcesie (201)**
   - Widok zmienia się na sukces (inline lub redirect)
   - Toast: "Raport wysłany pomyślnie"
   - Wyświetla się licznik: "Możesz edytować przez: 9 min 58 s"
   - Przycisk "Edytuj raport" jest aktywny
   - Wysyła się telemetria z czasem wypełnienia

### 8.2 Scenariusz Problem Path (US-008, US-020)

1. **Kierowca klika link z e-maila**
   - Loading → Formularz się ładuje

2. **Kierowca klika "Mam problem"**
   - Przełącznik aktywuje się
   - Pojawiają się dynamiczne sekcje:
     - Status trasy (radio)
     - Opóźnienie (number input)
     - Szkody (textarea x2)
     - Blokery (textarea)
   - Telemetria: `recordProblemSwitch()`

3. **Kierowca wypełnia pola**
   - Wybiera "Częściowo wykonano"
   - Wpisuje opóźnienie: 60 minut
   - Automatycznie pojawia się pole "Powód opóźnienia" (required)
   - Wpisuje powód: "Awaria pojazdu na autostradzie"
   - Opcjonalnie wypełnia szkody/blokery
   - Każde pole: `recordInteraction()`

4. **Kierowca klika "Wyślij zgłoszenie problemu"**
   - Walidacja inline:
     - ✓ routeStatus wybrany
     - ✓ delayMinutes > 0
     - ✓ delayReason wypełniony (>= 3 znaki)
   - POST z danymi

5. **Po sukcesie**
   - Jak w happy path
   - Dodatkowo banner: "AI analizuje Twój raport..."

### 8.3 Scenariusz edycji (US-009)

1. **Po wysłaniu raportu**
   - Widok sukcesu z licznikiem
   - Przycisk "Edytuj raport" aktywny

2. **Kierowca klika "Edytuj"**
   - Powrót do formularza (ten sam URL lub navigate back)
   - Pola są pre-wypełnione ostatnimi danymi (z SessionStorage lub state)
   - Banner: "Edytujesz raport. Pozostały czas: 8 min"

3. **Kierowca zmienia dane**
   - Np. aktualizuje opóźnienie z 60 na 90 minut
   - Zmienia powód

4. **Kierowca klika "Zaktualizuj raport"**
   - PATCH do `/api/public/reports/{uuid}` z:
     ```json
     {
       "delayMinutes": 90,
       "delayReason": "Aktualizacja: Awaria + opóźnienie na stacji"
     }
     ```
   - Token w header `Authorization: Bearer {token}`

5. **Po sukcesie (200)**
   - Toast: "Raport zaktualizowany"
   - Powrót do widoku sukcesu
   - Banner: "AI ponownie analizuje raport..."
   - Licznik dalej odlicza od `editableUntil` (bez resetu)

6. **Po upływie 10 minut**
   - Przycisk "Edytuj" staje się disabled
   - Zamiast przycisku: "Okno edycji minęło"

### 8.4 Scenariusz błędu tokenu (US-010)

1. **Kierowca klika link z e-maila (wygasły/używany)**
   - Loading → GET do `/api/public/report-links/{token}`
   - Odpowiedź: 410 (wygasł) lub 409 (już użyty)

2. **Formularz przekierowuje na error state**
   - Wyświetla się `ErrorView`
   - **Dla 410 (wygasły)**:
     - Ikona zegara
     - Tytuł: "Link wygasł"
     - Opis: "Ten link był ważny 24 godziny. Skontaktuj się z dyspozytorem, aby otrzymać nowy link."
   - **Dla 409 (już użyty)**:
     - Ikona checkmark
     - Tytuł: "Raport już wysłany"
     - Opis: "Ten link został już wykorzystany. Jeśli chcesz edytować raport, skorzystaj z linku z potwierdzenia."
   - Przyciski:
     - "Spróbuj ponownie" (reload)
     - Link: "Kontakt z dyspozytorem"

3. **Telemetria**
   - POST do `/api/telemetry` z:
     ```json
     {
       "eventType": "TOKEN_INVALID",
       "occurredAt": "...",
       "metadata": { "errorCode": "410" },
       "linkUuid": "{token}"
     }
     ```

### 8.5 Scenariusz offline (US-007 + offline)

1. **Kierowca otwiera formularz**
   - Formularz ładuje się (GET tokenu mógł się udać wcześniej w cache)

2. **Kierowca traci połączenie**
   - Hook `useNetworkStatus()` wykrywa offline
   - Wyświetla się `OfflineBanner`:
     - "Brak połączenia. Raport zostanie wysłany automatycznie po przywróceniu połączenia."
   - Przycisk "Wyślij" zmienia tekst na "Wyślę gdy będzie sieć"

3. **Kierowca wypełnia i klika "Wyślij"**
   - Dane zapisują się w IndexedDB (`addToQueue`)
   - Toast: "Raport zapisany offline. Wyślemy go automatycznie."
   - Przycisk zmienia się na "Zapisano offline" (disabled)

4. **Kierowca odzyskuje połączenie**
   - Hook wykrywa online
   - `processQueue()` automatycznie wysyła z kolejki
   - POST do API
   - Po sukcesie:
     - Toast: "Raport wysłany po przywróceniu połączenia"
     - Usunięcie z kolejki
     - Przejście do widoku sukcesu

5. **Jeśli POST się nie uda (3 retry)**
   - Toast: "Nie udało się wysłać raportu. Skontaktuj się z dyspozytorem."
   - Dane usuwane z kolejki

### 8.6 Scenariusz walidacji inline

1. **Kierowca wybiera "Mam problem"**
   - Pola się pojawiają

2. **Kierowca wpisuje opóźnienie: 30 min**
   - Pojawia się pole "Powód opóźnienia" (required)

3. **Kierowca klika "Wyślij" bez wypełnienia powodu**
   - Walidacja Zod blokuje submit
   - Pole "Powód opóźnienia" podświetla się na czerwono
   - Pod polem komunikat: "Powód opóźnienia jest wymagany gdy opóźnienie > 0 minut"
   - Focus przenosi się na błędne pole

4. **Kierowca wpisuje powód: "XY" (2 znaki)**
   - Po `onBlur` walidacja
   - Błąd: "Powód musi mieć minimum 3 znaki"

5. **Kierowca wpisuje: "Korek" (5 znaków)**
   - Błąd znika
   - Przycisk "Wyślij" aktywny

6. **Kierowca wybiera "Częściowo wykonano"**
   - Walidacja sprawdza czy `delayReason` lub `nextDayBlockers` wypełnione
   - Jeśli nie: błąd "Przy częściowym wykonaniu wymagany jest komentarz"

## 9. Warunki i walidacja

### 9.1 Walidacja tokenu (przed pokazaniem formularza)

**Komponent**: `TokenGuard`

**Warunki**:

- Token musi istnieć w URL
- Token nie może być używany w aktualnej sesji (check SessionStorage)
- GET `/api/public/report-links/{token}` musi zwrócić 200

**Walidacja**:

```typescript
if (!token) {
  return <ErrorView errorType="404" message="Brak tokenu w linku" />;
}

const usedToken = sessionStorage.getItem(`routelog:token:${token}`);
if (usedToken) {
  return <ErrorView errorType="409" message="Token już użyty" />;
}

// Async validation
const validation = await validateToken(token);
if (!validation.valid) {
  return <ErrorView errorType="404" />;
}
```

**Wpływ na UI**:

- **Loading**: Pokazuje `FormLoadingState` (skeleton)
- **Error**: Przekierowanie do `ErrorView` z odpowiednim kodem
- **Success**: Pokazuje formularz z danymi z `validationData`

### 9.2 Walidacja formularza (Zod schema)

**Komponent**: `PublicReportForm` (React Hook Form)

**Schema**:

```typescript
const reportFormSchema = z
  .object({
    isProblem: z.boolean(),
    routeStatus: z.enum(["COMPLETED", "PARTIALLY_COMPLETED", "CANCELLED"]),
    delayMinutes: z.number().int().min(0, "Opóźnienie nie może być ujemne"),
    delayReason: z.string().max(1000, "Maksymalnie 1000 znaków"),
    cargoDamageDescription: z.string().max(1000).nullable(),
    vehicleDamageDescription: z.string().max(1000).nullable(),
    nextDayBlockers: z.string().max(1000).nullable(),
    timezone: z.string(),
  })
  .refine(
    (data) => {
      // Jeśli happy path, ignoruj walidacje problemów
      if (!data.isProblem) return true;

      // Jeśli opóźnienie > 0, powód wymagany
      if (data.delayMinutes > 0 && !data.delayReason) {
        return false;
      }

      // Jeśli powód podany, min 3 znaki
      if (data.delayReason && data.delayReason.length < 3) {
        return false;
      }

      // Jeśli częściowe wykonanie, komentarz wymagany
      if (data.routeStatus === "PARTIALLY_COMPLETED") {
        if (!data.delayReason && !data.nextDayBlockers) {
          return false;
        }
      }

      return true;
    },
    {
      message: "Nieprawidłowe dane formularza",
      path: ["delayReason"], // pokazujemy błąd przy tym polu
    }
  );
```

**Wpływ na UI**:

- Błędy wyświetlane inline pod polami
- `aria-invalid` na błędnych polach
- Focus na pierwszym błędnym polu po submit
- Przycisk submit disabled podczas walidacji

### 9.3 Walidacja Happy Path vs Problem Path

**Komponent**: `PublicReportForm`, `StatusSwitch`

**Warunek**: `isProblem: boolean`

**Happy Path (isProblem = false)**:

- Wszystkie pola problemów ustawiane na `null` lub default
- Wysyłane dane:
  ```json
  {
    "routeStatus": "COMPLETED",
    "delayMinutes": 0,
    "delayReason": null,
    "cargoDamageDescription": null,
    "vehicleDamageDescription": null,
    "nextDayBlockers": null,
    "timezone": "Europe/Warsaw"
  }
  ```

**Problem Path (isProblem = true)**:

- Walidacja pól zgodnie z schema
- Wszystkie pola opcjonalne poza `routeStatus`, `delayMinutes`, `timezone`

**Wpływ na UI**:

- **Happy**: Tylko przycisk "Wyślij raport - Wszystko OK", brak pól
- **Problem**: Wszystkie sekcje problemów widoczne, przycisk "Wyślij zgłoszenie problemu"

### 9.4 Walidacja opóźnienia i powodu

**Komponent**: `DelayFields`

**Warunki**:

- `delayMinutes` >= 0
- Jeśli `delayMinutes > 0`, pole `delayReason` staje się widoczne i required
- `delayReason`: min 3 znaki, max 1000 znaków

**Implementacja**:

```typescript
const watchDelayMinutes = watch('delayMinutes');

// W JSX:
{watchDelayMinutes > 0 && (
  <div>
    <Label htmlFor="delayReason">Powód opóźnienia *</Label>
    <Textarea {...register('delayReason')} />
  </div>
)}

// W schema:
.refine((data) => {
  if (data.delayMinutes > 0 && !data.delayReason) {
    return false;
  }
  if (data.delayReason && data.delayReason.length < 3) {
    return false;
  }
  return true;
})
```

**Wpływ na UI**:

- Pole powodu pojawia się/znika dynamicznie
- Walidacja działa `onBlur` i przed submit
- Błędy inline pod polem

### 9.5 Walidacja częściowego wykonania

**Komponent**: `RouteStatusField`, walidacja w schema

**Warunek**: `routeStatus === 'PARTIALLY_COMPLETED'`

**Walidacja**:

- Wymagany komentarz w `delayReason` LUB `nextDayBlockers`

**Implementacja**:

```typescript
.refine((data) => {
  if (data.routeStatus === 'PARTIALLY_COMPLETED') {
    if (!data.delayReason && !data.nextDayBlockers) {
      return false;
    }
  }
  return true;
}, {
  message: 'Przy częściowym wykonaniu wymagany jest komentarz w powodzie opóźnienia lub blokery',
  path: ['nextDayBlockers'],
})
```

**Wpływ na UI**:

- Jeśli użytkownik wybierze "Częściowo wykonano" i nie wypełni ani powodu, ani blockerów, błąd pojawi się pod polem `nextDayBlockers`
- Toast z ogólnym komunikatem po submit

### 9.6 Walidacja okna edycji

**Komponent**: `SuccessView`, `EditButton`

**Warunek**: `now() <= editableUntil`

**Implementacja**:

```typescript
const [canEdit, setCanEdit] = useState(true);

useEffect(() => {
  const editableUntil = new Date(props.editableUntil);
  const now = new Date();

  if (now > editableUntil) {
    setCanEdit(false);
    return;
  }

  const timeLeft = editableUntil.getTime() - now.getTime();
  const timer = setTimeout(() => setCanEdit(false), timeLeft);

  return () => clearTimeout(timer);
}, [props.editableUntil]);
```

**Wpływ na UI**:

- Przycisk "Edytuj raport" disabled po upływie czasu
- Tekst zmienia się na "Okno edycji minęło"
- Licznik pokazuje "0:00" i przestaje odliczać

### 9.7 Walidacja sieci (offline/online)

**Komponent**: `OfflineBanner`, `SubmitButton`

**Warunek**: `navigator.onLine`

**Hook**:

```typescript
const { isOnline } = useNetworkStatus();
```

**Wpływ na UI**:

- **Offline**:
  - Banner widoczny: "Brak połączenia..."
  - Przycisk submit zmienia tekst: "Wyślę gdy będzie sieć"
  - Przy submit: dane idą do offline queue
- **Online**:
  - Banner ukryty
  - Przycisk submit normalny tekst
  - Offline queue automatycznie się przetwarza

## 10. Obsługa błędów

### 10.1 Błędy walidacji tokenu (GET /api/public/report-links/{token})

**Kody błędów**:

- **404 Not Found**: Token nie istnieje
- **409 Conflict**: Token już wykorzystany
- **410 Gone**: Token wygasł

**Obsługa**:

```typescript
try {
  const validation = await validateToken(token);
  setValidationData(validation);
} catch (error) {
  const problemDetail = error as ProblemDetail;

  let errorType: ErrorType;
  if (response.status === 404) errorType = "404";
  else if (response.status === 409) errorType = "409";
  else if (response.status === 410) errorType = "410";
  else errorType = "500";

  setViewState({
    type: "error",
    errorType,
    message: problemDetail.message,
  });

  // Telemetria
  sendTelemetry({
    eventType: "TOKEN_INVALID",
    occurredAt: new Date().toISOString(),
    metadata: { errorCode: response.status.toString() },
    linkUuid: token,
  });
}
```

**UI**:

- Przekierowanie do `ErrorView` z odpowiednim komunikatem i ilustracją
- Przyciski: "Spróbuj ponownie", "Kontakt"

### 10.2 Błędy walidacji formularza (client-side)

**Typy błędów**:

- Pole wymagane puste
- Wartość poza zakresem (np. `delayMinutes < 0`)
- Tekst za krótki/długi
- Niespełnione warunki biznesowe (np. brak powodu przy opóźnieniu)

**Obsługa**:

```typescript
// React Hook Form automatycznie obsługuje błędy z Zod schema
const { formState: { errors } } = form;

// W JSX:
{errors.delayReason && (
  <FormMessage>{errors.delayReason.message}</FormMessage>
)}
```

**UI**:

- Błędy inline pod polami
- Czerwona obwódka na błędnym polu
- `aria-invalid="true"` na polu
- `aria-describedby` wskazujący na komunikat błędu
- Focus na pierwszym błędnym polu po submit

### 10.3 Błędy wysyłki raportu (POST /api/public/report-links/{token}/reports)

**Kody błędów**:

- **400 Bad Request**: Błąd walidacji server-side
- **404/409/410**: Problemy z tokenem (jak w GET)
- **500**: Błąd serwera

**Obsługa**:

```typescript
const submitMutation = useMutation({
  mutationFn: (data: PublicReportSubmitCommand) => submitReport(token, data),
  onError: (error: ProblemDetail) => {
    if (error.code === "VALIDATION_ERROR") {
      // Błąd walidacji - pokazujemy szczegóły pod polami
      if (error.details) {
        Object.entries(error.details).forEach(([field, message]) => {
          form.setError(field as keyof ReportFormViewModel, {
            type: "server",
            message: message as string,
          });
        });
      }
      toast.error("Sprawdź poprawność wypełnionych pól");
    } else if (["404", "409", "410"].includes(error.code)) {
      // Problemy z tokenem - przekieruj na error
      setViewState({
        type: "error",
        errorType: error.code as ErrorType,
        message: error.message,
      });
    } else {
      // Błąd serwera - toast i możliwość retry
      toast.error("Nie udało się wysłać raportu. Spróbuj ponownie.");
    }
  },
});
```

**UI**:

- **400**: Błędy pod konkretnymi polami + toast ogólny
- **404/409/410**: Przekierowanie na `ErrorView`
- **500**: Toast z opcją retry, przycisk submit aktywny ponownie

### 10.4 Błędy edycji raportu (PATCH /api/public/reports/{uuid})

**Kody błędów**:

- **403 Forbidden**: Token nieprawidłowy lub brak w SessionStorage
- **409 Conflict**: Okno edycji minęło

**Obsługa**:

```typescript
const updateMutation = useMutation({
  mutationFn: (data: PublicReportUpdateCommand) => updateReport(reportUuid, token, data),
  onError: (error: ProblemDetail) => {
    if (error.code === "403") {
      toast.error("Nie masz uprawnień do edycji tego raportu");
      setCanEdit(false);
    } else if (error.code === "409") {
      toast.error("Okno edycji minęło (10 minut od wysłania)");
      setCanEdit(false);
    } else {
      toast.error("Nie udało się zaktualizować raportu");
    }
  },
});
```

**UI**:

- Toast z błędem
- Dezaktywacja przycisku "Edytuj"
- Banner: "Okno edycji minęło"

### 10.5 Błędy offline queue

**Scenariusz**: Raport zapisany offline, ale nie może być wysłany po 3 próbach.

**Obsługa**:

```typescript
async function processQueue() {
  const items = await getQueueItems();

  for (const item of items) {
    try {
      await submitReport(item.token, item.data);
      await removeFromQueue(item.id);
      toast.success("Raport wysłany po przywróceniu połączenia");
    } catch (error) {
      if (item.retries >= 3) {
        await removeFromQueue(item.id);
        toast.error("Nie udało się wysłać raportu po 3 próbach. Skontaktuj się z dyspozytorem.", { duration: 10000 });
      } else {
        await updateQueueItem(item.id, { retries: item.retries + 1 });
      }
    }
  }
}
```

**UI**:

- Toast z długim timeout (10s)
- Link/przycisk: "Kontakt z pomocą"

### 10.6 Błędy telemetrii (non-blocking)

**Obsługa**: Telemetria jest fire-and-forget, błędy nie blokują UI.

```typescript
async function sendTelemetry(data: TelemetryEventCommand) {
  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    // Logujemy, ale nie pokazujemy użytkownikowi
    console.warn("Telemetry failed:", error);
  }
}
```

### 10.7 Błędy renderowania (ErrorBoundary)

**Obsługa**: React ErrorBoundary na poziomie głównego komponentu.

```typescript
class PublicFormErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Form render error:', error, errorInfo);

    sendTelemetry({
      eventType: 'APP_ERROR',
      occurredAt: new Date().toISOString(),
      metadata: {
        error: error.message,
        stack: error.stack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorView
          errorType="500"
          message="Coś poszło nie tak. Odśwież stronę lub skontaktuj się z pomocą."
        />
      );
    }

    return this.props.children;
  }
}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1. Utwórz strukturę katalogów:

   ```
   src/pages/public/report-links/
   ├── [token].astro
   ├── success/
   │   └── [token].astro
   └── error/
       └── [token].astro
   ```

2. Utwórz katalog komponentów:

   ```
   src/components/public-report/
   ├── PublicReportForm.tsx
   ├── TokenGuard.tsx
   ├── StatusSwitch.tsx
   ├── HappyPathSection.tsx
   ├── ProblemPathSection.tsx
   ├── FormHeader.tsx
   ├── FormFooter.tsx
   ├── OfflineBanner.tsx
   ├── SubmitButton.tsx
   ├── SuccessView.tsx
   ├── CountdownTimer.tsx
   ├── ErrorView.tsx
   └── fields/
       ├── RouteStatusField.tsx
       ├── DelayFields.tsx
       ├── DamageFields.tsx
       └── BlockersField.tsx
   ```

3. Utwórz katalog dla logiki biznesowej:
   ```
   src/lib/public-report/
   ├── api.ts              # funkcje API
   ├── validation.ts       # Zod schemas
   ├── hooks/
   │   ├── useTokenValidation.ts
   │   ├── useNetworkStatus.ts
   │   ├── useTelemetry.ts
   │   └── useOfflineQueue.ts
   └── utils/
       ├── formatters.ts
       └── storage.ts
   ```

### Krok 2: Implementacja typów i walidacji

1. Sprawdź że wszystkie typy z sekcji 5 są już w `src/types.ts`
2. Utwórz plik `src/lib/public-report/validation.ts`:

   ```typescript
   import { z } from "zod";

   export const reportFormSchema = z
     .object({
       isProblem: z.boolean(),
       routeStatus: z.enum(["COMPLETED", "PARTIALLY_COMPLETED", "CANCELLED"]),
       // ... reszta zgodnie z sekcją 9.2
     })
     .refine(/* walidacje biznesowe */);

   export type ReportFormViewModel = z.infer<typeof reportFormSchema>;
   ```

### Krok 3: Implementacja funkcji API

1. Utwórz `src/lib/public-report/api.ts`:

   ```typescript
   export async function validateToken(token: string): Promise<PublicReportLinkValidationDTO> {
     // implementacja z sekcji 7.1
   }

   export async function submitReport(
     token: string,
     data: PublicReportSubmitCommand
   ): Promise<PublicReportSubmitResponseDTO> {
     // implementacja z sekcji 7.2
   }

   export async function updateReport(reportUuid: Uuid, token: string, data: PublicReportUpdateCommand): Promise<void> {
     // implementacja z sekcji 7.3
   }

   export async function sendTelemetry(data: TelemetryEventCommand): Promise<void> {
     // implementacja z sekcji 7.4
   }
   ```

### Krok 4: Implementacja custom hooks

1. `useTokenValidation.ts` - zgodnie z sekcją 6.2
2. `useNetworkStatus.ts` - zgodnie z sekcją 6.4
3. `useTelemetry.ts` - zgodnie z sekcją 6.5
4. `useOfflineQueue.ts` - zgodnie z sekcją 6.7

### Krok 5: Implementacja komponentów atomowych (pola formularza)

Zaimplementuj w kolejności (najprostsze pierwsze):

1. `RouteStatusField.tsx` - radio group (sekcja 4.6)
2. `BlockersField.tsx` - pojedyncze textarea (sekcja 4.9)
3. `DamageFields.tsx` - dwa textarea (sekcja 4.8)
4. `DelayFields.tsx` - number input + warunkowe textarea (sekcja 4.7)

**Testowanie**: Każdy komponent testuj w izolacji ze Storybook lub prostym wrapperem.

### Krok 6: Implementacja komponentów kompozytowych

1. `StatusSwitch.tsx` - przełącznik OK/Problem (sekcja 4.3)
2. `HappyPathSection.tsx` - statyczny komunikat (sekcja 4.4)
3. `ProblemPathSection.tsx` - kompozycja pól z kroku 5 (sekcja 4.5)
4. `FormHeader.tsx` - nagłówek (sekcja 4.12)
5. `FormFooter.tsx` - stopka (sekcja 4.13)
6. `SubmitButton.tsx` - przycisk z loadingiem (sekcja 4.10)
7. `OfflineBanner.tsx` - alert offline (sekcja 4.11)

### Krok 7: Implementacja TokenGuard

1. Implementuj `TokenGuard.tsx` zgodnie z sekcją 4.2
2. Integruj z `useTokenValidation`
3. Obsłuż stany: loading, success, error
4. Testuj z różnymi tokenami (valid, invalid, expired)

### Krok 8: Implementacja głównego komponentu formularza

1. Utwórz `PublicReportForm.tsx` (sekcja 4.1):
   - Setup React Hook Form z Zod
   - Setup mutation (TanStack Query)
   - Setup telemetrii
   - Setup offline queue
2. Złóż wszystkie komponenty z kroków 5-7
3. Implementuj logikę przełączania Happy/Problem path
4. Implementuj obsługę submit
5. Dodaj ErrorBoundary wrapper

**Testowanie**:

- Test happy path submit
- Test problem path submit z walidacją
- Test przełączania między trybami
- Test błędów API

### Krok 9: Implementacja widoku sukcesu

1. `CountdownTimer.tsx` - licznik (sekcja 4.15)
2. `SuccessView.tsx` - widok potwierdzenia (sekcja 4.14)
3. Logika edycji - powrót do formularza z pre-fill
4. Obsługa PATCH request

### Krok 10: Implementacja widoku błędu

1. `ErrorView.tsx` - widok błędów (sekcja 4.16)
2. Komponenty pomocnicze: `ErrorIllustration`, `ErrorMessage`, `ActionButtons`, `ContactCard`
3. Mapowanie kodów błędów na komunikaty
4. Telemetria błędów

### Krok 11: Integracja ze stronami Astro

1. Utwórz `src/pages/public/report-links/[token].astro`:

   ```astro
   ---
   import Layout from "../../../layouts/Layout.astro";
   import PublicReportForm from "../../../components/public-report/PublicReportForm";

   const { token } = Astro.params;
   ---

   <Layout title="Raport dzienny">
     <PublicReportForm client:only="react" token={token} />
   </Layout>
   ```

2. Analogicznie dla `success/[token].astro` i `error/[token].astro`

### Krok 12: Stylowanie i responsywność

1. Dodaj style Tailwind dla wszystkich komponentów
2. Przetestuj responsywność (mobile-first):
   - 320px (iPhone SE)
   - 375px (iPhone standard)
   - 768px (tablet)
   - 1024px (desktop)
3. Zapewnij duże obszary klikalności na mobile (min 44x44px)
4. Przetestuj w trybie landscape

### Krok 13: Dostępność (A11y)

1. Dodaj `aria-label`, `aria-describedby` do wszystkich pól
2. Dodaj `aria-live="polite"` do:
   - `OfflineBanner`
   - `CountdownTimer`
   - Komunikatów błędów
3. Przetestuj nawigację klawiaturą:
   - Tab order
   - Focus visible
   - Enter/Space na przyciskach
4. Przetestuj z czytnikiem ekranu (VoiceOver/NVDA)

### Krok 14: Implementacja offline support

1. Skonfiguruj IndexedDB schema
2. Implementuj queue manager
3. Dodaj service worker (opcjonalnie) dla cache API responses
4. Przetestuj:
   - Wysłanie offline → online → auto-send
   - Multiple items w queue
   - Retry logic

### Krok 15: Integracja z telemetrią

1. Dodaj telemetry events we wszystkich kluczowych momentach:
   - Token validation
   - Form start
   - Problem switch
   - Field interactions
   - Submit success/error
   - Edit action
2. Przetestuj czy events są wysyłane

### Krok 16: Testowanie end-to-end

Scenariusze do przetestowania:

1. **Happy path complete flow**:
   - Otwórz link → Wyślij "Wszystko OK" → Zobacz sukces → Edytuj → Zaktualizuj

2. **Problem path complete flow**:
   - Otwórz link → Przełącz na "Problem" → Wypełnij pola → Wyślij → Zobacz sukces

3. **Walidacja inline**:
   - Wypróbuj wszystkie przypadki walidacji z sekcji 9

4. **Błędy tokenu**:
   - Test 404, 409, 410 responses

5. **Offline flow**:
   - Wyłącz sieć → Wypełnij → Wyślij → Włącz sieć → Sprawdź auto-send

6. **Edycja**:
   - Wyślij raport → Edytuj w ciągu 10 min → Poczekaj 10 min → Sprawdź że edycja disabled

7. **Cross-browser**:
   - Chrome, Safari, Firefox (mobile i desktop)
   - Przetestuj starsze wersje (zgodnie z PRD: 2 ostatnie wersje)

### Krok 17: Optymalizacja wydajności

1. Code splitting:
   - Lazy load widoków success/error
   - Dynamic import dla offline queue (tylko gdy potrzebne)

2. Bundle size:
   - Sprawdź czy bundle < 200KB (target dla mobile)
   - Użyj Astro island architecture do ładowania tylko potrzebnych komponentów

3. Performance metrics:
   - Time to Interactive < 2s (4G)
   - First Contentful Paint < 1s

### Krok 18: Dokumentacja

1. Dodaj README w `src/components/public-report/` z:
   - Opisem architektury
   - Flow diagramem
   - Przykładami użycia komponentów

2. Dodaj komentarze JSDoc do wszystkich publicznych funkcji i komponentów

### Krok 19: Code review i refactoring

1. Przejrzyj kod pod kątem:
   - DRY (Don't Repeat Yourself)
   - Separacji odpowiedzialności
   - Czytelności
2. Extract duplicated logic do utilities
3. Sprawdź czy wszystkie edge cases są obsłużone

### Krok 20: Deployment i monitoring

1. Deploy na staging
2. Przetestuj na prawdziwych urządzeniach mobilnych
3. Skonfiguruj monitoring błędów (np. Sentry)
4. Skonfiguruj analytics dla telemetrii
5. Przygotuj runbook dla common issues

---

## Podsumowanie

Ten plan implementacji obejmuje wszystkie aspekty widoku publicznego formularza raportu, od struktury komponentów, przez walidację i zarządzanie stanem, po integrację API i obsługę błędów. Kluczowe punkty:

- **Mobile-first** design z dużymi obszarami klikalności
- **Offline support** z queue w IndexedDB
- **Walidacja** na wielu poziomach (client, server)
- **Telemetria** dla optymalizacji UX
- **Dostępność** (WCAG 2.1 AA)
- **Obsługa błędów** dla wszystkich scenariuszy

Implementacja powinna zająć około **3-5 dni** dla doświadczonego frontend developera, włączając testy i optymalizację.
