# Plan Testowania End-to-End - Widok Raportów

## 1. Przegląd

Ten dokument opisuje plan testowania E2E dla widoku Raportów (`/reports`). Testy mają na celu weryfikację pełnego przepływu użytkownika od początku do końca, włączając interakcje z UI, API i walidację danych.

## 2. Wymagania wstępne

### Backend

- ✅ API endpoints zaimplementowane zgodnie z `/api-plan.md`
- ✅ Testowa baza danych z przykładowymi danymi
- ✅ Uwierzytelnianie użytkownika działające

### Frontend

- ✅ Widok Raportów zaimplementowany
- ✅ Wszystkie komponenty zainstalowane
- ✅ QueryClient skonfigurowany

### Narzędzia

- **Playwright** lub **Cypress** do testów E2E
- **Testing Library** do testów jednostkowych
- **MSW (Mock Service Worker)** do mockowania API w testach

## 3. Scenariusze testowe E2E

### 3.1 Podstawowe Pobieranie i Wyświetlanie

#### TC-001: Wyświetlanie listy raportów

**Cel:** Sprawdzenie poprawnego wyświetlania listy raportów

**Kroki:**

1. Zaloguj się jako dyspoz ytor
2. Przejdź do `/reports`
3. Poczekaj na załadowanie danych

**Oczekiwany rezultat:**

- ✅ Wyświetla się tabela (desktop) lub karty (mobile)
- ✅ Widoczne są wszystkie kolumny: data, kierowca, status, ryzyko, opóźnienie, podsumowanie AI
- ✅ Brak błędów w konsoli

---

#### TC-002: Skeleton loading state

**Cel:** Weryfikacja stanu ładowania

**Kroki:**

1. Przejdź do `/reports` z wolnym połączeniem (network throttling)
2. Obserwuj stan ładowania

**Oczekiwany rezultat:**

- ✅ Wyświetlają się szkielety ładowania
- ✅ Po załadowaniu szkielety są zastąpione prawdziwymi danymi

---

### 3.2 Filtrowanie i Wyszukiwanie

#### TC-003: Filtrowanie po dacie

**Cel:** Sprawdzenie filtrowania po zakresie dat

**Kroki:**

1. Otwórz date range picker
2. Wybierz zakres dat (np. ostatnie 7 dni)
3. Potwierdź wybór

**Oczekiwany rezultat:**

- ✅ URL aktualizuje się z parametrami `from` i `to`
- ✅ Lista raportów odświeża się
- ✅ Wyświetlane są tylko raporty z wybranego zakresu

---

#### TC-004: Wyszukiwanie tekstowe

**Cel:** Sprawdzenie wyszukiwania z debounce

**Kroki:**

1. Wpisz nazwę kierowcy w pole wyszukiwania
2. Poczekaj 500ms (debounce)
3. Obserwuj wyniki

**Oczekiwany rezultat:**

- ✅ Wyszukiwanie nie uruchamia się natychmiast (debounce działa)
- ✅ Po 500ms URL aktualizuje się z parametrem `q`
- ✅ Lista filtruje się według wpisanego tekstu

---

#### TC-005: Filtrowanie po kierowcy

**Cel:** Sprawdzenie multi-select kierowców

**Kroki:**

1. Otwórz dropdown kierowców
2. Wybierz 2-3 kierowców
3. Zamknij dropdown

**Oczekiwany rezultat:**

- ✅ Wybrani kierowcy pojawiają się jako chipy
- ✅ URL aktualizuje się z wieloma parametrami `driverUuid`
- ✅ Lista pokazuje tylko raporty wybranych kierowców

---

#### TC-006: Usuwanie filtrów

**Cel:** Sprawdzenie usuwania pojedynczych filtrów i resetu

**Kroki:**

1. Zastosuj kilka filtrów (data, kierowca, ryzyko)
2. Kliknij "X" na jednym chipie
3. Kliknij "Wyczyść wszystkie"

**Oczekiwany rezultat:**

- ✅ Pojedynczy filtr jest usuwany z URL i listy
- ✅ "Wyczyść wszystkie" usuwa wszystkie filtry
- ✅ Lista wraca do domyślnego widoku

---

### 3.3 Infinite Scroll

#### TC-007: Ładowanie kolejnych stron

**Cel:** Sprawdzenie infinite scroll

**Kroki:**

1. Przewiń listę do końca
2. Kliknij "Załaduj więcej"
3. Obserwuj ładowanie

**Oczekiwany rezultat:**

- ✅ Przycisk zmienia się na "Ładowanie..."
- ✅ Nowe raporty dodają się na końcu listy
- ✅ Nie ma duplikatów
- ✅ Przycisk znika, gdy brak więcej danych

---

### 3.4 Szczegóły Raportu

#### TC-008: Otwieranie szczegółów

**Cel:** Sprawdzenie panelu bocznego

**Kroki:**

1. Kliknij na wiersz/kartę raportu
2. Poczekaj na załadowanie szczegółów

**Oczekiwany rezultat:**

- ✅ Panel boczny otwiera się od prawej
- ✅ Wyświetlają się wszystkie dane: nagłówek, AI, metadane
- ✅ Przycisk "Edytuj" jest widoczny

---

#### TC-009: Zamykanie szczegółów

**Cel:** Sprawdzenie zamykania panelu

**Kroki:**

1. Otwórz szczegóły raportu
2. Kliknij "X" lub kliknij poza panelem

**Oczekiwany rezultat:**

- ✅ Panel zamyka się z animacją
- ✅ Dane są czyszczone po animacji

---

### 3.5 Tworzenie Raportu

#### TC-010: Poprawne utworzenie raportu

**Cel:** Sprawdzenie tworzenia nowego raportu

**Kroki:**

1. Kliknij "Dodaj raport"
2. Wypełnij wszystkie wymagane pola:
   - Wybierz kierowcę
   - Wybierz datę (dzisiaj)
   - Wybierz status: "COMPLETED"
   - Ustaw opóźnienie: 0
3. Kliknij "Utwórz raport"

**Oczekiwany rezultat:**

- ✅ Toast sukcesu: "Raport utworzony"
- ✅ Dialog zamyka się
- ✅ Lista raportów odświeża się
- ✅ Nowy raport pojawia się na liście

---

#### TC-011: Walidacja - opóźnienie bez przyczyny

**Cel:** Sprawdzenie walidacji delay reason

**Kroki:**

1. Kliknij "Dodaj raport"
2. Wypełnij pola
3. Ustaw opóźnienie: 30 minut
4. Nie wypełniaj przyczyny opóźnienia
5. Kliknij "Utwórz raport"

**Oczekiwany rezultat:**

- ✅ Formularz nie przechodzi walidacji
- ✅ Błąd pod polem "Przyczyna opóźnienia": "delayReason is required when delayMinutes is greater than 0"
- ✅ Dialog pozostaje otwarty

---

#### TC-012: Walidacja - PARTIALLY_COMPLETED bez opisu

**Cel:** Sprawdzenie walidacji dla statusu częściowo ukończonego

**Kroki:**

1. Kliknij "Dodaj raport"
2. Wybierz status: "PARTIALLY_COMPLETED"
3. Nie wypełniaj żadnych pól opisowych
4. Kliknij "Utwórz raport"

**Oczekiwany rezultat:**

- ✅ Błąd walidacji: "For PARTIALLY_COMPLETED status, at least one descriptive field must be provided"
- ✅ Dialog pozostaje otwarty

---

#### TC-013: Walidacja - data z przyszłości

**Cel:** Sprawdzenie walidacji daty

**Kroki:**

1. Kliknij "Dodaj raport"
2. Wybierz datę jutrzejszą
3. Wypełnij resztę pól
4. Kliknij "Utwórz raport"

**Oczekiwany rezultat:**

- ✅ Błąd walidacji: "reportDate cannot be in the future"
- ✅ Dialog pozostaje otwarty

---

#### TC-014: Duplikat raportu (409)

**Cel:** Sprawdzenie obsługi duplikatu

**Kroki:**

1. Utwórz raport dla kierowcy X na dzień Y
2. Spróbuj utworzyć drugi raport dla tego samego kierowcy i dnia

**Oczekiwany rezultat:**

- ✅ Toast błędu: "Raport dla tego kierowcy i daty już istnieje"
- ✅ Dialog pozostaje otwarty

---

### 3.6 Edycja Raportu

#### TC-015: Edycja raportu

**Cel:** Sprawdzenie edycji istniejącego raportu

**Kroki:**

1. Otwórz szczegóły raportu
2. Kliknij "Edytuj"
3. Zmień opóźnienie z 0 na 15 minut
4. Wpisz przyczynę opóźnienia
5. Kliknij "Zapisz zmiany"

**Oczekiwany rezultat:**

- ✅ Toast sukcesu: "Raport zaktualizowany"
- ✅ Dialog zamyka się
- ✅ Panel szczegółów odświeża dane
- ✅ Lista raportów odświeża się

---

### 3.7 Eksport CSV

#### TC-016: Poprawny eksport

**Cel:** Sprawdzenie eksportu do CSV

**Kroki:**

1. Kliknij "Eksportuj"
2. Wybierz zakres dat (ostatnie 30 dni)
3. Zaznacz "Dołącz analizę AI"
4. Zaznacz "Dołącz tagi ryzyka"
5. Kliknij "Eksportuj CSV"

**Oczekiwany rezultat:**

- ✅ Przycisk zmienia się na "Eksportowanie..."
- ✅ Plik CSV pobiera się automatycznie
- ✅ Toast sukcesu: "Eksport zakończony"
- ✅ Dialog zamyka się

---

#### TC-017: Eksport - brak zakresu dat

**Cel:** Sprawdzenie walidacji eksportu

**Kroki:**

1. Kliknij "Eksportuj"
2. Nie wybieraj zakresu dat
3. Kliknij "Eksportuj CSV"

**Oczekiwany rezultat:**

- ✅ Błąd walidacji: "Data początkowa jest wymagana"
- ✅ Dialog pozostaje otwarty

---

### 3.8 Error Handling

#### TC-018: Błąd 401 (Unauthorized)

**Cel:** Sprawdzenie obsługi wygaśniętej sesji

**Kroki:**

1. Wyloguj się w innej karcie (lub usuń token)
2. W karcie z raportami kliknij "Odśwież"

**Oczekiwany rezultat:**

- ✅ Toast błędu: "Sesja wygasła. Zaloguj się ponownie."
- ✅ Przekierowanie do `/signin`

---

#### TC-019: Błąd 500 (Server Error)

**Cel:** Sprawdzenie obsługi błędu serwera

**Kroki:**

1. Symuluj błąd 500 (np. przez dev tools)
2. Spróbuj załadować raporty

**Oczekiwany rezultat:**

- ✅ Komponent ErrorState z komunikatem
- ✅ Przycisk "Spróbuj ponownie"
- ✅ Kliknięcie przycisku ponawia zapytanie

---

#### TC-020: Brak połączenia (Offline)

**Cel:** Sprawdzenie obsługi braku połączenia

**Kroki:**

1. Wyłącz internet (dev tools: offline mode)
2. Spróbuj załadować raporty

**Oczekiwany rezultat:**

- ✅ Toast błędu: "Nie można połączyć się z serwerem"
- ✅ Przycisk "Spróbuj ponownie" jest dostępny

---

### 3.9 Responsywność

#### TC-021: Desktop view

**Cel:** Sprawdzenie widoku desktop

**Kroki:**

1. Otwórz `/reports` na ekranie ≥1024px
2. Sprawdź layout

**Oczekiwany rezultat:**

- ✅ Widoczna tabela z wszystkimi kolumnami
- ✅ Filtry w jednym wierszu (5 kolumn)
- ✅ Panel boczny otwiera się po prawej

---

#### TC-022: Mobile view

**Cel:** Sprawdzenie widoku mobile

**Kroki:**

1. Otwórz `/reports` na ekranie ≤640px
2. Sprawdź layout

**Oczekiwany rezultat:**

- ✅ Widoczne karty zamiast tabeli
- ✅ Filtry ułożone wertykalnie
- ✅ Panel boczny zajmuje cały ekran

---

## 4. Narzędzia testowe

### Playwright (Rekomendowane)

```bash
npm install -D @playwright/test
npx playwright install
```

**Przykładowy test:**

```typescript
// e2e/reports.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Reports View", () => {
  test("TC-001: Display reports list", async ({ page }) => {
    await page.goto("/signin");
    // Login
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "password");
    await page.click('[type="submit"]');

    // Navigate to reports
    await page.goto("/reports");

    // Wait for data to load
    await page.waitForSelector('[data-testid="reports-table"]', { timeout: 5000 });

    // Check if table is visible
    const table = await page.locator('[data-testid="reports-table"]');
    await expect(table).toBeVisible();

    // Check if at least one report is displayed
    const rows = await page.locator('[data-testid="report-row"]').count();
    expect(rows).toBeGreaterThan(0);
  });

  test("TC-004: Search with debounce", async ({ page }) => {
    await page.goto("/reports");

    // Type in search
    await page.fill('[placeholder="Szukaj kierowcy, opisu..."]', "Kowalski");

    // Wait for debounce
    await page.waitForTimeout(600);

    // Check URL
    await expect(page).toHaveURL(/\?.*q=Kowalski/);

    // Check filtered results
    const results = await page.locator('[data-testid="report-row"]');
    await expect(results).toContainText("Kowalski");
  });
});
```

---

## 5. Checklist przed wdrożeniem

### Funkcjonalność

- [ ] Wszystkie testy E2E przechodzą (TC-001 do TC-022)
- [ ] Formularz waliduje poprawnie wszystkie pola
- [ ] Filtry synchronizują się z URL
- [ ] Infinite scroll działa bez duplikatów
- [ ] Export CSV generuje poprawny plik

### Wydajność

- [ ] Lista 100+ raportów ładuje się <2s
- [ ] Infinite scroll nie powoduje lagów
- [ ] Debounce search działa (brak zbędnych requestów)
- [ ] Cache TanStack Query działa (brak duplikatów zapytań)

### UX/UI

- [ ] Skeleton loading jest widoczny
- [ ] Error states są czytelne
- [ ] Toast notifications działają
- [ ] Responsive na mobile/tablet/desktop
- [ ] Dark mode działa poprawnie

### Dostępność (A11y)

- [ ] Keyboard navigation działa (Tab, Enter, Space)
- [ ] ARIA labels są poprawne
- [ ] Fokus jest widoczny
- [ ] Screen reader friendly

### Security

- [ ] Token authorization działa
- [ ] 401/403 są obsługiwane
- [ ] XSS protection (escape user input)
- [ ] CSRF protection (jeśli wymagane)

---

## 6. Continuous Integration

Dodaj do CI/CD pipeline:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 7. Następne kroki

1. **Priorytet 1:** Implementuj testy TC-001 do TC-010 (core functionality)
2. **Priorytet 2:** Dodaj testy walidacji TC-011 do TC-014
3. **Priorytet 3:** Testy edge cases TC-018 do TC-020
4. **Priorytet 4:** Testy responsywności TC-021 do TC-022

---

**Ostatnia aktualizacja:** 2025-11-23
