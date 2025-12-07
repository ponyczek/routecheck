# Plan implementacji widoku modalnego eksportu CSV

## 1. Przegląd

Modal eksportu CSV to komponent umożliwiający spedytorom eksport raportów dziennych do pliku CSV za wybrany okres. Modal pojawia się w kontekście widoku `/reports` i pozwala na:
- Wybór zakresu dat (obowiązkowy, maksymalnie 31 dni)
- Opcjonalne uwzględnienie wyników AI
- Opcjonalne uwzględnienie tagów ryzyka
- Pobranie wygenerowanego pliku CSV z odpowiednią nazwą zawierającą firmę i datę eksportu

Widok wspiera walidację zakresu dat, informuje o postępie przygotowania pliku i obsługuje błędy związane z przekroczeniem limitów.

## 2. Routing widoku

Modal nie ma własnej ścieżki routingu – jest wywoływany jako overlay w kontekście strony `/reports`. Dostęp do funkcjonalności eksportu powinien być dostępny przez:
- Przycisk "Eksportuj CSV" w pasku filtrów widoku `/reports`
- Skrót klawiaturowy (opcjonalnie)

## 3. Struktura komponentów

```
ExportCsvModal (Shadcn Dialog/Sheet)
├── ExportCsvModalHeader
│   ├── Dialog.Title
│   └── Dialog.Close
├── ExportCsvModalContent
│   ├── DateRangeSelector
│   │   ├── DateRangePicker (Shadcn Popover + Calendar)
│   │   │   ├── Button (trigger)
│   │   │   └── Popover
│   │   │       └── Calendar (dwa kalendarze: from/to)
│   │   └── ValidationMessage
│   ├── ExportOptionsCheckboxes
│   │   ├── Checkbox – "Uwzględnij wyniki AI"
│   │   └── Checkbox – "Uwzględnij tagi ryzyka"
│   └── ExportInfoBanner
│       └── Alert (informacja o limicie 31 dni i czasie generowania)
├── ExportProgressSection (conditional)
│   ├── ProgressBar
│   └── StatusMessage
└── ExportCsvModalFooter
    ├── Button – "Anuluj"
    └── Button – "Pobierz CSV" (primary, disabled jeśli walidacja niepoprawna)
```

## 4. Szczegóły komponentów

### ExportCsvModal

**Opis komponentu:**
Główny komponent modalny oparty na Shadcn Dialog (desktop) lub Sheet (mobile). Zarządza stanem formularza eksportu, walidacją i wywołaniem API do pobrania pliku CSV. Odpowiada za focus trap, zarządzanie cyklem życia modalu oraz obsługę sukcesu/błędów eksportu.

**Główne elementy:**
- Dialog/Sheet z Shadcn/ui jako wrapper
- Trzy sekcje: header, content, footer
- Warunkowa sekcja progress (widoczna podczas generowania pliku)

**Obsługiwane interakcje:**
- Otwieranie/zamykanie modalu (kontrolowane przez props `open` i `onOpenChange`)
- Wybór zakresu dat przez DateRangePicker
- Toggle checkboxów opcji eksportu
- Kliknięcie przycisku "Pobierz CSV" – inicjuje wywołanie API
- Kliknięcie przycisku "Anuluj" – zamyka modal bez akcji
- Obsługa ESC i kliknięcia poza modalem (zamyka modal)

**Obsługiwana walidacja:**
- Zakres dat jest wymagany (zarówno `from` jak i `to`)
- Data `from` musi być wcześniejsza lub równa `to`
- Zakres nie może przekraczać 31 dni
- Daty nie mogą być w przyszłości
- Przycisk "Pobierz CSV" jest disabled dopóki walidacja nie przejdzie

**Typy:**
- `ExportCsvModalProps` (interface)
- `ExportCsvFormData` (ViewModel)
- `ExportCsvValidationErrors` (ViewModel)

**Propsy:**
```typescript
interface ExportCsvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string; // do wygenerowania nazwy pliku
}
```

### ExportCsvModalHeader

**Opis komponentu:**
Nagłówek modalu zawierający tytuł i przycisk zamknięcia.

**Główne elementy:**
- `Dialog.Title` z tekstem "Eksportuj raporty do CSV"
- `Dialog.Close` (ikona X w prawym górnym rogu)

**Obsługiwane interakcje:**
- Kliknięcie ikony X zamyka modal

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Standardowe typy z Shadcn Dialog

**Propsy:**
- Brak dodatkowych propsów (dziedziczy z Dialog context)

### DateRangeSelector

**Opis komponentu:**
Komponent wyboru zakresu dat składający się z DateRangePicker (Shadcn) i komunikatu walidacji. Umożliwia wybór dat "od" i "do" z walidacją w czasie rzeczywistym.

**Główne elementy:**
- Label "Zakres dat *" (gwiazdka oznacza pole wymagane)
- Button trigger pokazujący wybrany zakres lub placeholder
- Popover z dwoma kalendarzami (from/to)
- ValidationMessage (pod selektorem, widoczny tylko gdy błąd)

**Obsługiwane interakcje:**
- Kliknięcie przycisku otwiera popover z kalendarzami
- Wybór daty "od" w pierwszym kalendarzu
- Wybór daty "do" w drugim kalendarzu
- Walidacja natychmiastowa po każdej zmianie
- Podświetlenie zakresu w kalendarzach

**Obsługiwana walidacja:**
- Obie daty są wymagane
- Data "od" <= data "do"
- Różnica między datami <= 31 dni
- Daty nie mogą być w przyszłości
- Komunikaty błędów:
  - "Zakres dat jest wymagany"
  - "Data początkowa musi być wcześniejsza niż końcowa"
  - "Zakres nie może przekraczać 31 dni"
  - "Nie możesz wybrać dat w przyszłości"

**Typy:**
- `DateRange` z react-day-picker: `{ from: Date | undefined; to: Date | undefined }`
- `DateRangeSelectorProps`

**Propsy:**
```typescript
interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  error?: string;
}
```

### ExportOptionsCheckboxes

**Opis komponentu:**
Grupa checkboxów do wyboru opcji eksportu (AI, tagi). Domyślnie oba checkboxy są zaznaczone.

**Główne elementy:**
- Label grupy: "Opcje eksportu"
- Checkbox "Uwzględnij wyniki AI" z pomocniczym opisem
- Checkbox "Uwzględnij tagi ryzyka" z pomocniczym opisem

**Obsługiwane interakcje:**
- Toggle checkboxów

**Obsługiwana walidacja:**
- Brak (opcje są opcjonalne)

**Typy:**
- `ExportOptionsCheckboxesProps`

**Propsy:**
```typescript
interface ExportOptionsCheckboxesProps {
  includeAi: boolean;
  includeTags: boolean;
  onIncludeAiChange: (checked: boolean) => void;
  onIncludeTagsChange: (checked: boolean) => void;
}
```

### ExportInfoBanner

**Opis komponentu:**
Banner informacyjny (Shadcn Alert) wyświetlający ważne informacje o limitach eksportu i czasie generowania pliku.

**Główne elementy:**
- Alert (wariant "info")
- Ikona informacyjna
- Tekst: "Eksport może objąć maksymalnie 31 dni. Generowanie pliku może potrwać kilka sekund w zależności od liczby raportów."
- Dodatkowa informacja o wrażliwości danych (opcjonalnie)

**Obsługiwane interakcje:**
- Brak (tylko prezentacja informacji)

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Standardowe typy Shadcn Alert

**Propsy:**
- Brak

### ExportProgressSection

**Opis komponentu:**
Sekcja widoczna warunkowo podczas generowania pliku CSV. Pokazuje progress bar i status przygotowania.

**Główne elementy:**
- ProgressBar (może być nieokreślony – indeterminate)
- StatusMessage: "Przygotowuję eksport..."

**Obsługiwane interakcje:**
- Brak (tylko wizualna informacja o postępie)

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `ExportProgressSectionProps`

**Propsy:**
```typescript
interface ExportProgressSectionProps {
  isExporting: boolean;
}
```

### ExportCsvModalFooter

**Opis komponentu:**
Stopka modalu zawierająca przyciski akcji.

**Główne elementy:**
- Button "Anuluj" (wariant secondary)
- Button "Pobierz CSV" (wariant primary, ikona download)

**Obsługiwane interakcje:**
- Kliknięcie "Anuluj" → wywołanie `onOpenChange(false)`
- Kliknięcie "Pobierz CSV" → wywołanie funkcji eksportu

**Obsługiwana walidacja:**
- Przycisk "Pobierz CSV" jest disabled gdy:
  - Trwa eksport (`isExporting === true`)
  - Formularz ma błędy walidacji
  - Zakres dat nie jest kompletny

**Typy:**
- `ExportCsvModalFooterProps`

**Propsy:**
```typescript
interface ExportCsvModalFooterProps {
  onCancel: () => void;
  onExport: () => void;
  isExporting: boolean;
  isDisabled: boolean;
}
```

## 5. Typy

### DTO (z types.ts – istniejące)

Endpoint `/api/reports/export` zwraca bezpośrednio plik CSV (Content-Type: `text/csv`), więc nie ma dedykowanego DTO JSON. Endpoint wykorzystuje query params:

```typescript
// Query params dla GET /api/reports/export
interface ExportCsvQueryParams {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  includeAi?: boolean; // domyślnie false
  includeTags?: boolean; // domyślnie false
}
```

### ViewModels (nowe typy dla komponentu)

```typescript
// Stan formularza eksportu CSV
interface ExportCsvFormData {
  dateRange: DateRange;
  includeAi: boolean;
  includeTags: boolean;
}

// DateRange z react-day-picker
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Błędy walidacji
interface ExportCsvValidationErrors {
  dateRange?: string;
}

// Stan procesu eksportu
interface ExportCsvState {
  formData: ExportCsvFormData;
  validationErrors: ExportCsvValidationErrors;
  isExporting: boolean;
  error: string | null;
}

// Props głównego komponentu modalu
interface ExportCsvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string;
}
```

### Utility Types

```typescript
// Format daty dla API (ISO date-only string YYYY-MM-DD)
type IsoDateOnlyString = string; // już zdefiniowane w types.ts

// Funkcja pomocnicza do formatowania Date → YYYY-MM-DD
function formatDateToIsoDateOnly(date: Date): IsoDateOnlyString;

// Funkcja pomocnicza do walidacji zakresu dat
function validateDateRange(range: DateRange): string | undefined;

// Funkcja pomocnicza do obliczania różnicy dni
function getDaysDifference(from: Date, to: Date): number;
```

## 6. Zarządzanie stanem

### Stan lokalny w komponencie ExportCsvModal

Stan będzie zarządzany przez `useState` w głównym komponencie `ExportCsvModal`:

```typescript
const [formData, setFormData] = useState<ExportCsvFormData>({
  dateRange: { from: undefined, to: undefined },
  includeAi: true, // domyślnie zaznaczone
  includeTags: true, // domyślnie zaznaczone
});

const [validationErrors, setValidationErrors] = useState<ExportCsvValidationErrors>({});
const [isExporting, setIsExporting] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Custom Hook: useExportCsv

Opcjonalnie można wyodrębnić logikę eksportu do custom hooka:

```typescript
function useExportCsv() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportCsv = async (params: ExportCsvQueryParams, companyName?: string) => {
    setIsExporting(true);
    setError(null);

    try {
      // Wywołanie API
      const response = await fetch(
        `/api/reports/export?from=${params.from}&to=${params.to}&includeAi=${params.includeAi}&includeTags=${params.includeTags}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'text/csv',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Nieprawidłowy zakres dat');
        } else if (response.status === 413) {
          throw new Error('Zakres dat jest zbyt duży. Maksymalny zakres to 31 dni.');
        } else {
          throw new Error('Wystąpił błąd podczas eksportu');
        }
      }

      // Pobranie pliku
      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') 
        || `reports_${companyName || 'export'}_${formatDateToIsoDateOnly(new Date())}.csv`;

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Toast sukcesu
      toast.success('Plik CSV został pobrany pomyślnie');
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportCsv, isExporting, error };
}
```

### Walidacja

Walidacja powinna być wykonywana:
- **Natychmiastowo** przy zmianie zakresu dat (onChange)
- **Przed wysłaniem** przy kliknięciu "Pobierz CSV"

```typescript
function validateDateRange(range: DateRange): string | undefined {
  const { from, to } = range;

  // Sprawdź czy obie daty są wypełnione
  if (!from || !to) {
    return 'Zakres dat jest wymagany';
  }

  // Sprawdź czy data początkowa nie jest późniejsza niż końcowa
  if (from > to) {
    return 'Data początkowa musi być wcześniejsza lub równa dacie końcowej';
  }

  // Sprawdź czy zakres nie przekracza 31 dni
  const daysDiff = getDaysDifference(from, to);
  if (daysDiff > 31) {
    return 'Zakres nie może przekraczać 31 dni';
  }

  // Sprawdź czy daty nie są w przyszłości
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (from > today || to > today) {
    return 'Nie możesz wybrać dat w przyszłości';
  }

  return undefined;
}
```

## 7. Integracja API

### Endpoint

```
GET /api/reports/export
```

### Query Parameters (Request)

```typescript
interface ExportCsvQueryParams {
  from: string; // YYYY-MM-DD (required)
  to: string; // YYYY-MM-DD (required)
  includeAi?: boolean; // optional, default false
  includeTags?: boolean; // optional, default false
}
```

Przykład URL:
```
/api/reports/export?from=2025-01-01&to=2025-01-31&includeAi=true&includeTags=true
```

### Response

**Success (200):**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="reports_CompanyName_20250123.csv"`
- Body: Zawartość pliku CSV

**Errors:**
- **400 Bad Request**: Brak wymaganych parametrów lub nieprawidłowy format daty
  ```json
  {
    "code": "INVALID_DATE_RANGE",
    "message": "Zakres dat jest nieprawidłowy lub niekompletny"
  }
  ```

- **413 Payload Too Large**: Zakres dat przekracza limit (>31 dni)
  ```json
  {
    "code": "DATE_RANGE_TOO_LARGE",
    "message": "Zakres dat przekracza maksymalny limit 31 dni"
  }
  ```

- **401 Unauthorized**: Brak autoryzacji
- **500 Internal Server Error**: Błąd serwera

### Wywołanie API w komponencie

```typescript
const handleExport = async () => {
  // Walidacja
  const validationError = validateDateRange(formData.dateRange);
  if (validationError) {
    setValidationErrors({ dateRange: validationError });
    return;
  }

  // Przygotowanie parametrów
  const params: ExportCsvQueryParams = {
    from: formatDateToIsoDateOnly(formData.dateRange.from!),
    to: formatDateToIsoDateOnly(formData.dateRange.to!),
    includeAi: formData.includeAi,
    includeTags: formData.includeTags,
  };

  // Wywołanie hooka eksportu
  const success = await exportCsv(params, companyName);
  
  if (success) {
    // Zamknij modal po sukcesie
    onOpenChange(false);
  }
};
```

## 8. Interakcje użytkownika

### 1. Otwarcie modalu
**Akcja użytkownika:** Kliknięcie przycisku "Eksportuj CSV" w widoku `/reports`  
**Reakcja systemu:**
- Modal otwiera się z animacją fade-in
- Focus przenosi się na pierwszy interaktywny element (DateRangePicker)
- Pola formularza są w stanie początkowym (puste daty, checkboxy zaznaczone)

### 2. Wybór zakresu dat
**Akcja użytkownika:** Kliknięcie na pole zakresu dat  
**Reakcja systemu:**
- Otwiera się popover z dwoma kalendarzami
- Bieżący miesiąc jest domyślnie widoczny

**Akcja użytkownika:** Wybór daty początkowej (from)  
**Reakcja systemu:**
- Data zostaje zaznaczona
- Drugi kalendarz pozostaje otwarty do wyboru daty końcowej
- Walidacja nie jest jeszcze wykonywana (brak obu dat)

**Akcja użytkownika:** Wybór daty końcowej (to)  
**Reakcja systemu:**
- Data zostaje zaznaczona
- Zakres jest podświetlony w kalendarzach
- Popover zamyka się automatycznie
- Wykonuje się walidacja zakresu
- Jeśli błąd walidacji → komunikat pojawia się pod selektorem
- Jeśli OK → przycisk "Pobierz CSV" staje się aktywny

### 3. Zmiana opcji eksportu
**Akcja użytkownika:** Toggle checkboxa "Uwzględnij wyniki AI"  
**Reakcja systemu:**
- Stan checkboxa się zmienia
- Brak dodatkowej walidacji

**Akcja użytkownika:** Toggle checkboxa "Uwzględnij tagi ryzyka"  
**Reakcja systemu:**
- Stan checkboxa się zmienia
- Brak dodatkowej walidacji

### 4. Inicjacja eksportu
**Akcja użytkownika:** Kliknięcie przycisku "Pobierz CSV"  
**Reakcja systemu:**
- Ponowna walidacja formularza
- Jeśli błąd → toast error + komunikat walidacji
- Jeśli OK:
  - Przycisk zmienia stan na loading (spinner)
  - Pojawia się `ExportProgressSection` z progress barem
  - Wykonywane jest wywołanie API GET /api/reports/export
  - Po otrzymaniu odpowiedzi:
    - **Sukces (200)**: Plik CSV jest automatycznie pobierany, toast sukcesu, modal zamyka się
    - **Błąd (400)**: Toast error "Nieprawidłowy zakres dat"
    - **Błąd (413)**: Toast error "Zakres dat jest zbyt duży. Maksymalny zakres to 31 dni."
    - **Błąd (401)**: Redirect do /signin
    - **Błąd (500)**: Toast error "Wystąpił błąd podczas eksportu. Spróbuj ponownie."

### 5. Anulowanie eksportu
**Akcja użytkownika:** Kliknięcie przycisku "Anuluj" lub ESC lub kliknięcie poza modalem  
**Reakcja systemu:**
- Modal zamyka się z animacją fade-out
- Stan formularza jest resetowany (dla następnego otwarcia)
- Jeśli trwa eksport → nie można zamknąć (przycisk Anuluj disabled)

### 6. Obsługa klawiatury
- **Tab**: Nawigacja między elementami formularza
- **Shift+Tab**: Nawigacja wsteczna
- **Enter**: Na przycisku "Pobierz CSV" → inicjacja eksportu
- **ESC**: Zamknięcie modalu (jeśli nie trwa eksport)
- **Space**: Toggle checkboxów

## 9. Warunki i walidacja

### Warunki walidacji formularza

#### Zakres dat (DateRangeSelector)

**Warunek 1: Obie daty są wymagane**
- Komponent: `DateRangeSelector`
- Weryfikacja: `!dateRange.from || !dateRange.to`
- Wpływ: Przycisk "Pobierz CSV" disabled, komunikat błędu "Zakres dat jest wymagany"

**Warunek 2: Data początkowa <= data końcowa**
- Komponent: `DateRangeSelector`
- Weryfikacja: `dateRange.from > dateRange.to`
- Wpływ: Przycisk "Pobierz CSV" disabled, komunikat błędu "Data początkowa musi być wcześniejsza lub równa dacie końcowej"

**Warunek 3: Zakres <= 31 dni**
- Komponent: `DateRangeSelector`
- Weryfikacja: `getDaysDifference(dateRange.from, dateRange.to) > 31`
- Wpływ: Przycisk "Pobierz CSV" disabled, komunikat błędu "Zakres nie może przekraczać 31 dni"

**Warunek 4: Daty nie w przyszłości**
- Komponent: `DateRangeSelector`
- Weryfikacja: `dateRange.from > new Date() || dateRange.to > new Date()`
- Wpływ: Przycisk "Pobierz CSV" disabled, komunikat błędu "Nie możesz wybrać dat w przyszłości"

### Warunki stanu UI

**Warunek: Trwa eksport**
- Stan: `isExporting === true`
- Wpływ na UI:
  - Przycisk "Pobierz CSV" pokazuje spinner i tekst "Eksportuję..."
  - Przycisk "Pobierz CSV" jest disabled
  - Przycisk "Anuluj" jest disabled
  - Pojawia się `ExportProgressSection`
  - Wszystkie pola formularza są disabled

**Warunek: Błąd eksportu**
- Stan: `error !== null`
- Wpływ na UI:
  - Toast error z komunikatem błędu
  - Modal pozostaje otwarty
  - Użytkownik może poprawić dane i spróbować ponownie

**Warunek: Sukces eksportu**
- Stan: API zwróciło 200 i plik został pobrany
- Wpływ na UI:
  - Toast success "Plik CSV został pobrany pomyślnie"
  - Modal zamyka się automatycznie
  - Stan formularza jest resetowany

### Implementacja walidacji w kodzie

```typescript
// Funkcja walidująca cały formularz
function validateForm(formData: ExportCsvFormData): ExportCsvValidationErrors {
  const errors: ExportCsvValidationErrors = {};
  
  const dateRangeError = validateDateRange(formData.dateRange);
  if (dateRangeError) {
    errors.dateRange = dateRangeError;
  }
  
  return errors;
}

// W komponencie
const isFormValid = Object.keys(validationErrors).length === 0 && 
                     formData.dateRange.from && 
                     formData.dateRange.to;

const isSubmitDisabled = !isFormValid || isExporting;
```

## 10. Obsługa błędów

### Błędy walidacji (po stronie klienta)

**Scenariusz:** Użytkownik nie wypełnił obu dat  
**Obsługa:**
- Komunikat walidacji pod polem: "Zakres dat jest wymagany"
- Przycisk "Pobierz CSV" disabled
- Fokus na polu z błędem (aria-invalid)

**Scenariusz:** Zakres dat przekracza 31 dni  
**Obsługa:**
- Komunikat walidacji pod polem: "Zakres nie może przekraczać 31 dni"
- Przycisk "Pobierz CSV" disabled
- ExportInfoBanner podkreśla limit

**Scenariusz:** Data początkowa późniejsza niż końcowa  
**Obsługa:**
- Komunikat walidacji pod polem: "Data początkowa musi być wcześniejsza lub równa dacie końcowej"
- Przycisk "Pobierz CSV" disabled

### Błędy API

**Scenariusz:** 400 Bad Request (nieprawidłowe parametry)  
**Obsługa:**
- Toast error: "Nieprawidłowy zakres dat"
- Modal pozostaje otwarty
- Użytkownik może poprawić dane

**Scenariusz:** 401 Unauthorized (brak autoryzacji)  
**Obsługa:**
- Automatyczny redirect do `/signin`
- Toast info: "Twoja sesja wygasła. Zaloguj się ponownie."

**Scenariusz:** 413 Payload Too Large (zakres zbyt duży)  
**Obsługa:**
- Toast error: "Zakres dat jest zbyt duży. Maksymalny zakres to 31 dni."
- Modal pozostaje otwarty
- Komunikat walidacji pod polem zakres dat

**Scenariusz:** 429 Too Many Requests (rate limit)  
**Obsługa:**
- Toast error: "Przekroczono limit żądań. Spróbuj ponownie za chwilę."
- Modal pozostaje otwarty
- Przycisk "Pobierz CSV" aktywny po 5 sekundach

**Scenariusz:** 500 Internal Server Error  
**Obsługa:**
- Toast error: "Wystąpił błąd podczas eksportu. Spróbuj ponownie."
- Modal pozostaje otwarty
- Użytkownik może spróbować ponownie

### Błędy sieciowe

**Scenariusz:** Brak połączenia internetowego  
**Obsługa:**
- Toast error: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- Modal pozostaje otwarty
- Wskaźnik offline w layoutcie

**Scenariusz:** Timeout żądania  
**Obsługa:**
- Toast error: "Przekroczono czas oczekiwania. Spróbuj ponownie."
- Modal pozostaje otwarty
- Opcja retry

### Scenariusze brzegowe

**Scenariusz:** Użytkownik zamyka modal podczas eksportu  
**Obsługa:**
- Modal nie może być zamknięty (ESC i kliknięcie poza są disabled)
- Przyciski "Anuluj" i X są disabled
- Komunikat: "Proszę czekać, eksport w toku..."

**Scenariusz:** Plik CSV jest pusty (brak raportów w zakresie)  
**Obsługa:**
- Plik zostaje pobrany (może zawierać tylko nagłówki)
- Toast info: "Plik CSV został pobrany. Brak raportów w wybranym zakresie."
- Modal zamyka się

**Scenariusz:** Nazwa firmy niedostępna  
**Obsługa:**
- Nazwa pliku używa fallbacku: `reports_export_20250123.csv`
- Eksport działa normalnie

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury komponentów

1.1. Utwórz folder `src/components/reports/export/`

1.2. Utwórz pliki komponentów:
- `ExportCsvModal.tsx` (główny komponent)
- `DateRangeSelector.tsx`
- `ExportOptionsCheckboxes.tsx`
- `ExportInfoBanner.tsx`
- `ExportProgressSection.tsx`
- `index.ts` (export publiczny)

1.3. Utwórz folder `src/lib/reports/export/`

1.4. Utwórz pliki pomocnicze:
- `types.ts` (ViewModels i typy pomocnicze)
- `validation.ts` (funkcje walidacji)
- `useExportCsv.ts` (custom hook)
- `utils.ts` (funkcje pomocnicze formatowania dat)

### Krok 2: Implementacja typów

2.1. W `src/lib/reports/export/types.ts` zdefiniuj:
```typescript
export interface ExportCsvFormData {
  dateRange: DateRange;
  includeAi: boolean;
  includeTags: boolean;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface ExportCsvValidationErrors {
  dateRange?: string;
}

export interface ExportCsvModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string;
}

export interface ExportCsvQueryParams {
  from: string;
  to: string;
  includeAi?: boolean;
  includeTags?: boolean;
}
```

### Krok 3: Implementacja funkcji pomocniczych

3.1. W `src/lib/reports/export/utils.ts`:
```typescript
export function formatDateToIsoDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getDaysDifference(from: Date, to: Date): number {
  const diffTime = Math.abs(to.getTime() - from.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function generateCsvFilename(companyName: string | undefined): string {
  const today = formatDateToIsoDateOnly(new Date()).replace(/-/g, '');
  const company = companyName || 'export';
  return `reports_${company}_${today}.csv`;
}
```

3.2. W `src/lib/reports/export/validation.ts`:
```typescript
export function validateDateRange(range: DateRange): string | undefined {
  // Implementacja walidacji zgodnie z sekcją 9
}
```

### Krok 4: Implementacja custom hooka useExportCsv

4.1. W `src/lib/reports/export/useExportCsv.ts`:
```typescript
export function useExportCsv() {
  // Implementacja zgodnie z sekcją 6
}
```

### Krok 5: Implementacja komponentów potomnych

5.1. Zaimplementuj `ExportInfoBanner.tsx`:
```typescript
export function ExportInfoBanner() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Eksport może objąć maksymalnie 31 dni. Generowanie pliku może potrwać 
        kilka sekund w zależności od liczby raportów.
      </AlertDescription>
    </Alert>
  );
}
```

5.2. Zaimplementuj `ExportProgressSection.tsx`:
```typescript
export function ExportProgressSection({ isExporting }: ExportProgressSectionProps) {
  if (!isExporting) return null;
  
  return (
    <div className="space-y-2">
      <Progress value={undefined} /> {/* indeterminate */}
      <p className="text-sm text-muted-foreground">Przygotowuję eksport...</p>
    </div>
  );
}
```

5.3. Zaimplementuj `ExportOptionsCheckboxes.tsx`:
```typescript
export function ExportOptionsCheckboxes({
  includeAi,
  includeTags,
  onIncludeAiChange,
  onIncludeTagsChange,
}: ExportOptionsCheckboxesProps) {
  return (
    <div className="space-y-3">
      <Label>Opcje eksportu</Label>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="include-ai" 
            checked={includeAi}
            onCheckedChange={onIncludeAiChange}
          />
          <Label htmlFor="include-ai">Uwzględnij wyniki AI</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="include-tags" 
            checked={includeTags}
            onCheckedChange={onIncludeTagsChange}
          />
          <Label htmlFor="include-tags">Uwzględnij tagi ryzyka</Label>
        </div>
      </div>
    </div>
  );
}
```

5.4. Zaimplementuj `DateRangeSelector.tsx`:
```typescript
export function DateRangeSelector({ value, onChange, error }: DateRangeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="date-range">
        Zakres dat <span className="text-destructive">*</span>
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value.from && !value.to && "text-muted-foreground",
              error && "border-destructive"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.from ? (
              value.to ? (
                <>
                  {format(value.from, "dd.MM.yyyy")} - {format(value.to, "dd.MM.yyyy")}
                </>
              ) : (
                format(value.from, "dd.MM.yyyy")
              )
            ) : (
              "Wybierz zakres dat"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Krok 6: Implementacja głównego komponentu ExportCsvModal

6.1. W `ExportCsvModal.tsx` zaimplementuj strukturę:
```typescript
export function ExportCsvModal({ 
  open, 
  onOpenChange, 
  companyName 
}: ExportCsvModalProps) {
  // Stan formularza
  const [formData, setFormData] = useState<ExportCsvFormData>({...});
  const [validationErrors, setValidationErrors] = useState<ExportCsvValidationErrors>({});
  
  // Hook eksportu
  const { exportCsv, isExporting, error } = useExportCsv();
  
  // Walidacja onChange
  useEffect(() => {
    if (formData.dateRange.from && formData.dateRange.to) {
      const error = validateDateRange(formData.dateRange);
      setValidationErrors({ dateRange: error });
    }
  }, [formData.dateRange]);
  
  // Handler eksportu
  const handleExport = async () => {
    // Implementacja zgodnie z sekcją 7
  };
  
  // Handler anulowania
  const handleCancel = () => {
    onOpenChange(false);
  };
  
  // Warunek disabled
  const isSubmitDisabled = !isFormValid || isExporting;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eksportuj raporty do CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <DateRangeSelector
            value={formData.dateRange}
            onChange={(range) => setFormData(prev => ({ ...prev, dateRange: range }))}
            error={validationErrors.dateRange}
          />
          
          <ExportOptionsCheckboxes
            includeAi={formData.includeAi}
            includeTags={formData.includeTags}
            onIncludeAiChange={(checked) => setFormData(prev => ({ ...prev, includeAi: checked }))}
            onIncludeTagsChange={(checked) => setFormData(prev => ({ ...prev, includeTags: checked }))}
          />
          
          <ExportInfoBanner />
          
          <ExportProgressSection isExporting={isExporting} />
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isExporting}
          >
            Anuluj
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isSubmitDisabled}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eksportuję...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Pobierz CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Krok 7: Integracja z widokiem /reports

7.1. W komponencie listy raportów (`src/pages/reports.astro` lub odpowiednim komponencie React) dodaj:
```typescript
const [isExportModalOpen, setIsExportModalOpen] = useState(false);

// W pasku filtrów lub akcji
<Button onClick={() => setIsExportModalOpen(true)}>
  <Download className="mr-2 h-4 w-4" />
  Eksportuj CSV
</Button>

<ExportCsvModal
  open={isExportModalOpen}
  onOpenChange={setIsExportModalOpen}
  companyName={companyData?.name}
/>
```

### Krok 8: Styling i responsywność

8.1. Upewnij się, że modal używa Shadcn Dialog na desktop i Sheet na mobile:
```typescript
const isMobile = useMediaQuery('(max-width: 768px)');

return isMobile ? (
  <Sheet open={open} onOpenChange={onOpenChange}>
    {/* Sheet content */}
  </Sheet>
) : (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {/* Dialog content */}
  </Dialog>
);
```

8.2. Dostosuj szerokość modalu:
```typescript
<DialogContent className="sm:max-w-[500px]">
```

### Krok 9: Accessibility

9.1. Dodaj ARIA attributes:
- `aria-invalid` na polach z błędami
- `aria-describedby` łączący pola z komunikatami błędów
- `role="alert"` na komunikatach błędów
- `aria-live="polite"` na progress section

9.2. Zapewnij focus trap w modalu (Shadcn Dialog robi to automatycznie)

9.3. Upewnij się, że wszystkie interaktywne elementy są dostępne przez klawiaturę

### Krok 10: Testing

10.1. Testy jednostkowe:
- Walidacja zakresu dat (wszystkie scenariusze)
- Funkcje formatowania dat
- Obliczanie różnicy dni

10.2. Testy integracyjne:
- Otwieranie/zamykanie modalu
- Wybór dat i walidacja
- Toggle checkboxów
- Wywołanie eksportu (mock API)
- Obsługa błędów API

10.3. Testy E2E:
- Pełny flow eksportu (happy path)
- Scenariusze błędów (400, 413)
- Walidacja formularza
- Pobieranie pliku

### Krok 11: Dokumentacja

11.1. Dodaj komentarze JSDoc do publicznych funkcji i komponentów

11.2. Zaktualizuj README jeśli potrzebne

11.3. Dodaj przykłady użycia w Storybook (opcjonalnie)

### Krok 12: Review i refaktoryzacja

12.1. Code review zespołu

12.2. Sprawdź zgodność z PRD (US-016)

12.3. Weryfikacja spełnienia kryteriów akceptacji:
- ✅ Zakres dat jest obowiązkowy
- ✅ Plik zawiera wszystkie pola formularza i wyniki AI
- ✅ Nazwa pliku zawiera firmę i datę eksportu

12.4. Optymalizacja wydajności (jeśli potrzebne)

12.5. Finalne testy manualne na różnych urządzeniach i przeglądarkach



