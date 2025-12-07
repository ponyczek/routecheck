# 🧪 Jak przetestować publiczne raporty

Przewodnik krok po kroku do testowania funkcjonalności publicznych raportów w RouteCheck.

## 📋 Spis treści

1. [Przygotowanie środowiska](#przygotowanie-środowiska)
2. [Generowanie tokenu testowego](#generowanie-tokenu-testowego)
3. [Testowanie w przeglądarce](#testowanie-w-przeglądarce)
4. [Testy API (curl/Postman)](#testy-api)
5. [Scenariusze testowe](#scenariusze-testowe)
6. [Troubleshooting](#troubleshooting)

---

## 1. Przygotowanie środowiska

### Wymagania wstępne

```bash
# Upewnij się, że masz zainstalowane zależności
npm install

# Sprawdź czy masz wszystkie zmienne środowiskowe
# Potrzebne: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REPORT_LINK_TOKEN_PEPPER
cat .env
```

### Uruchomienie serwera deweloperskiego

```bash
# Terminal 1: Uruchom serwer
npm run dev

# Powinien być dostępny pod:
# http://localhost:4321
```

---

## 2. Generowanie tokenu testowego

### Metoda 1: Użyj skryptu pomocniczego (ZALECANE)

```bash
# Wygeneruj token dla pierwszego dostępnego kierowcy
npx tsx scripts/generate-test-token.ts

# Lub dla konkretnego kierowcy (po emailu)
npx tsx scripts/generate-test-token.ts jan.kowalski@example.com
```

Skrypt wyświetli:
- URL do testowania w przeglądarce
- Przykładowe żądania curl
- Szczegóły kierowcy i tokenu

### Metoda 2: Ręcznie przez bazę danych

```sql
-- 1. Znajdź UUID kierowcy
SELECT uuid, first_name, last_name, email, company_uuid 
FROM drivers 
WHERE is_active = true 
LIMIT 1;

-- 2. Wygeneruj token (przykładowy)
-- W rzeczywistości użyj crypto.randomBytes(32).toString('hex')
INSERT INTO report_links (
  driver_uuid,
  company_uuid,
  hashed_token,
  expires_at
) VALUES (
  'UUID-KIEROWCY',
  'UUID-FIRMY',
  'HASH-TOKENU',  -- sha256(token + pepper)
  now() + interval '24 hours'
) RETURNING uuid;

-- 3. Użyj oryginalnego (niezahashowanego) tokenu w URL
```

---

## 3. Testowanie w przeglądarce

### Test 1: Token Validation - Happy Path ✅

**Cel:** Sprawdzić czy formularz ładuje się poprawnie z ważnym tokenem

**Kroki:**
1. Otwórz URL wygenerowany przez skrypt: `http://localhost:4321/public/report-links/[TOKEN]`
2. Poczekaj na załadowanie

**Oczekiwany rezultat:**
- ✅ Wyświetla się formularz
- ✅ Widoczne imię i nazwisko kierowcy
- ✅ Widoczny numer rejestracyjny pojazdu (jeśli przypisany)
- ✅ Przełącznik "Wszystko OK" / "Mam problem" jest widoczny
- ✅ Domyślnie zaznaczone "Wszystko OK"
- ✅ Przycisk "Wyślij raport - Wszystko OK"

### Test 2: Happy Path Submission 🎉

**Cel:** Wysłać raport bez problemów

**Kroki:**
1. Otwórz formularz (Test 1)
2. Zostaw zaznaczone "Wszystko OK"
3. Kliknij "Wyślij raport - Wszystko OK"
4. Poczekaj

**Oczekiwany rezultat:**
- ✅ Przycisk zmienia się na "Wysyłam..." ze spinnerem
- ✅ Po chwili pojawia się widok sukcesu
- ✅ Zielona ikonka check
- ✅ Tekst "Raport wysłany pomyślnie"
- ✅ Licznik odlicza 10:00 (okno edycji)
- ✅ Przycisk "Edytuj raport" jest aktywny
- ✅ Toast notification: "Raport wysłany pomyślnie"

### Test 3: Problem Path Submission ⚠️

**Cel:** Wysłać raport z problemami

**Kroki:**
1. Otwórz nowy token (wygeneruj nowy!)
2. Kliknij przełącznik "Mam problem"
3. Wybierz status trasy: "Częściowo wykonano"
4. Wpisz opóźnienie: `60` minut
5. Wpisz powód: `Korek na autostradzie A1`
6. (Opcjonalnie) Dodaj opis uszkodzenia ładunku
7. (Opcjonalnie) Dodaj opis uszkodzenia pojazdu
8. Wpisz blokery: `Pojazd wymaga drobnej naprawy`
9. Kliknij "Wyślij raport - Mam problem"

**Oczekiwany rezultat:**
- ✅ Wszystkie pola problemu pojawiają się z animacją
- ✅ Pole "Powód opóźnienia" pojawia się gdy opóźnienie > 0
- ✅ Walidacja działa (nie można wysłać bez powodu przy opóźnieniu)
- ✅ Raport wysyła się pomyślnie
- ✅ Widok sukcesu + informacja o przetwarzaniu AI

### Test 4: Validation 🛡️

**Cel:** Sprawdzić czy walidacja działa poprawnie

**Kroki:**
1. Otwórz nowy token
2. Kliknij "Mam problem"
3. Wpisz opóźnienie: `30` minut
4. NIE wpisuj powodu opóźnienia
5. Spróbuj wysłać

**Oczekiwany rezultat:**
- ✅ Formularz nie wysyła się
- ✅ Pod polem "Powód opóźnienia" pojawia się czerwony komunikat
- ✅ Tekst błędu: "Powód opóźnienia jest wymagany gdy wystąpiło opóźnienie"
- ✅ Pole ma czerwoną ramkę
- ✅ Focus przenosi się na pole z błędem

### Test 5: Offline Mode 📴

**Cel:** Sprawdzić czy offline queue działa

**Kroki:**
1. Otwórz nowy token
2. Otwórz DevTools (F12) → Network tab
3. Zmień throttling na "Offline"
4. Wypełnij formularz (happy path)
5. Wyślij

**Oczekiwany rezultat:**
- ✅ Pomarańczowy banner "Brak połączenia z internetem"
- ✅ Przycisk zmienia tekst: "Wyślę gdy będzie sieć"
- ✅ Po kliknięciu: Toast "Raport zapisany offline"
- ✅ Widok sukcesu z informacją o offline

**Kroki cd:**
6. Zmień throttling z powrotem na "Online"
7. Poczekaj

**Oczekiwany rezultat:**
- ✅ Toast: "Raport wysłany po przywróceniu połączenia"
- ✅ Widok sukcesu aktualizuje się z UUID raportu
- ✅ Sprawdź Application → IndexedDB → routelog-offline-queue (powinno być puste)

### Test 6: Edit Functionality ✏️

**Cel:** Sprawdzić czy edycja raportu działa

**Kroki:**
1. Wyślij raport (Test 2)
2. Na widoku sukcesu kliknij "Edytuj raport"
3. Zmień "Wszystko OK" na "Mam problem"
4. Dodaj opóźnienie: `15` minut
5. Dodaj powód: `Dodatkowe dokumenty na granicy`
6. Wyślij ponownie

**Oczekiwany rezultat:**
- ✅ Formularz ponownie się otwiera
- ✅ Toast: "Możesz teraz edytować raport"
- ✅ Zmiany zapisują się
- ✅ Request to PATCH (nie POST!)
- ✅ Widok sukcesu wraca
- ✅ Countdown NIE resetuje się (kontynuuje odliczanie)

### Test 7: Edit Window Expiration ⏰

**Cel:** Sprawdzić czy przycisk edycji wyłącza się po 10 minutach

**Opcja A: Czekaj 10 minut (wolne)**
1. Wyślij raport
2. Poczekaj aż licznik dojdzie do 0:00

**Opcja B: Zmień czas w konsoli (szybkie)**
```javascript
// W konsoli przeglądarki:
sessionStorage.setItem('routelog:report:REPORT_UUID', JSON.stringify({
  token: 'your-token',
  editableUntil: new Date(Date.now() - 1000).toISOString() // 1 sekunda temu
}));
// Odśwież stronę
location.reload();
```

**Oczekiwany rezultat:**
- ✅ Przycisk "Edytuj raport" jest wyłączony (disabled)
- ✅ Tekst zmienia się na "Okno edycji minęło"
- ✅ Licznik pokazuje "0:00"
- ✅ Kliknięcie powoduje toast z ostrzeżeniem

### Test 8: Error States ❌

#### 8.1 Invalid Token (404)

```bash
# Otwórz w przeglądarce
http://localhost:4321/public/report-links/invalid-token-12345
```

**Oczekiwany rezultat:**
- ✅ Widok błędu z ikoną
- ✅ Tytuł: "Link nie został znaleziony"
- ✅ Przycisk "Spróbuj ponownie"
- ✅ Informacja kontaktowa

#### 8.2 Already Used Token (409)

**Kroki:**
1. Użyj tokenu który już wykorzystałeś w Test 2
2. Otwórz ten sam URL ponownie

**Oczekiwany rezultat:**
- ✅ Widok błędu z checkmark
- ✅ Tytuł: "Raport już wysłany"
- ✅ Informacja o możliwości edycji
- ✅ Brak przycisku retry

#### 8.3 Expired Token (410)

**Kroki:**
1. Wygeneruj token z wygasłym czasem (modyfikacja w bazie)
```sql
UPDATE report_links 
SET expires_at = now() - interval '1 hour' 
WHERE uuid = 'UUID_LINKU';
```
2. Otwórz URL

**Oczekiwany rezultat:**
- ✅ Widok błędu z ikoną zegara
- ✅ Tytuł: "Link wygasł"
- ✅ Informacja o 24-godzinnej ważności
- ✅ Brak przycisku retry

### Test 9: Mobile Responsiveness 📱

**Kroki:**
1. Otwórz formularz
2. Włącz DevTools → Toggle device toolbar (Ctrl+Shift+M)
3. Przetestuj różne rozdzielczości:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - Pixel 5 (393x851)
   - iPad (768x1024)

**Oczekiwany rezultat:**
- ✅ Formularz nie wychodzi poza ekran
- ✅ Przyciski są wystarczająco duże (min 44x44px)
- ✅ Tekst jest czytelny bez zoom
- ✅ Brak poziomego scrollowania
- ✅ Wszystkie elementy widoczne i klikalne

### Test 10: Accessibility ♿

**Keyboard Navigation:**
1. Użyj tylko klawiatury (Tab, Shift+Tab, Enter, Space)
2. Przejdź przez cały formularz
3. Wyślij używając Enter

**Oczekiwany rezultat:**
- ✅ Wszystkie elementy są fokusowalne
- ✅ Widoczny wskaźnik focusa
- ✅ Logiczna kolejność tabulacji
- ✅ Można wysłać formularz z klawiatury

**Screen Reader (opcjonalnie):**
- Włącz VoiceOver (Mac) lub NVDA (Windows)
- Sprawdź czy etykiety są odczytywane
- Sprawdź czy błędy są ogłaszane

---

## 4. Testy API

### Test API: GET /api/public/report-links/{token}

```bash
# Walidacja tokenu
curl -v http://localhost:4321/api/public/report-links/YOUR_TOKEN_HERE

# Oczekiwana odpowiedź 200:
{
  "valid": true,
  "driverName": "Jan Kowalski",
  "vehicleRegistration": "WA12345",
  "expiresAt": "2025-11-28T20:00:00Z",
  "editableUntil": null
}

# Test z nieprawidłowym tokenem
curl -v http://localhost:4321/api/public/report-links/invalid-token

# Oczekiwana odpowiedź 404:
{
  "error": "not_found",
  "message": "Report link not found"
}
```

### Test API: POST /api/public/report-links/{token}/reports

```bash
# Happy path
curl -X POST http://localhost:4321/api/public/report-links/YOUR_TOKEN_HERE/reports \
  -H "Content-Type: application/json" \
  -d '{
    "routeStatus": "COMPLETED",
    "delayMinutes": 0,
    "delayReason": null,
    "cargoDamageDescription": null,
    "vehicleDamageDescription": null,
    "nextDayBlockers": null,
    "timezone": "Europe/Warsaw"
  }'

# Oczekiwana odpowiedź 201:
{
  "reportUuid": "uuid-here",
  "editableUntil": "2025-11-27T20:10:00Z"
}

# Problem path
curl -X POST http://localhost:4321/api/public/report-links/YOUR_TOKEN_HERE/reports \
  -H "Content-Type: application/json" \
  -d '{
    "routeStatus": "PARTIALLY_COMPLETED",
    "delayMinutes": 60,
    "delayReason": "Awaria pojazdu",
    "cargoDamageDescription": "Lekkie uszkodzenie opakowania",
    "vehicleDamageDescription": null,
    "nextDayBlockers": "Wymaga naprawy",
    "timezone": "Europe/Warsaw"
  }'

# Test validation error (brak powodu przy opóźnieniu)
curl -X POST http://localhost:4321/api/public/report-links/YOUR_TOKEN_HERE/reports \
  -H "Content-Type: application/json" \
  -d '{
    "routeStatus": "COMPLETED",
    "delayMinutes": 30,
    "delayReason": null,
    "timezone": "Europe/Warsaw"
  }'

# Oczekiwana odpowiedź 400:
{
  "error": "validation_error",
  "message": "Validation failed",
  "details": {
    "delayReason": "Delay reason is required when delay > 0"
  }
}
```

### Test API: PATCH /api/public/reports/{uuid}

```bash
# Edycja raportu (w ciągu 10 minut)
curl -X PATCH http://localhost:4321/api/public/reports/REPORT_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "routeStatus": "PARTIALLY_COMPLETED",
    "delayMinutes": 15,
    "delayReason": "Dodatkowe dokumenty",
    "timezone": "Europe/Warsaw"
  }'

# Oczekiwana odpowiedź 200:
{
  "reportUuid": "uuid-here",
  "editableUntil": "2025-11-27T20:10:00Z"
}

# Test po upływie okna edycji (>10 min)
# Oczekiwana odpowiedź 409:
{
  "error": "conflict",
  "message": "Edit window has expired"
}
```

---

## 5. Scenariusze testowe - Checklist

### Podstawowe flow
- [ ] **Test 1:** Walidacja tokenu - happy path
- [ ] **Test 2:** Wysłanie raportu - happy path
- [ ] **Test 3:** Wysłanie raportu - problem path
- [ ] **Test 4:** Walidacja formularza
- [ ] **Test 5:** Offline mode + auto-retry
- [ ] **Test 6:** Edycja raportu
- [ ] **Test 7:** Wygaśnięcie okna edycji

### Obsługa błędów
- [ ] **Test 8.1:** Nieprawidłowy token (404)
- [ ] **Test 8.2:** Użyty token (409)
- [ ] **Test 8.3:** Wygasły token (410)

### UI/UX
- [ ] **Test 9:** Responsywność mobile
- [ ] **Test 10:** Dostępność (a11y)

### API
- [ ] Test GET endpoint
- [ ] Test POST endpoint (happy)
- [ ] Test POST endpoint (problem)
- [ ] Test POST validation errors
- [ ] Test PATCH endpoint
- [ ] Test PATCH po upływie czasu

---

## 6. Troubleshooting

### Problem: "Nie można znaleźć kierowcy"

**Rozwiązanie:**
```sql
-- Sprawdź czy są aktywni kierowcy
SELECT * FROM drivers WHERE is_active = true;

-- Jeśli nie ma, utwórz testowego
INSERT INTO drivers (company_uuid, first_name, last_name, email, phone, is_active)
VALUES ('YOUR_COMPANY_UUID', 'Jan', 'Testowy', 'jan.test@example.com', '+48123456789', true);
```

### Problem: "Token validation failed"

**Możliwe przyczyny:**
1. **Nieprawidłowy pepper:** Sprawdź `REPORT_LINK_TOKEN_PEPPER` w `.env`
2. **Token już użyty:** Sprawdź `used_at` w bazie danych
3. **Token wygasł:** Sprawdź `expires_at` vs. aktualny czas

**Debug:**
```sql
SELECT * FROM report_links WHERE hashed_token = 'HASH';
```

### Problem: "Formularz nie ładuje się"

**Kroki debug:**
1. Otwórz DevTools → Console
2. Sprawdź czy są błędy
3. Sprawdź Network tab - czy request się wykonuje
4. Sprawdź response

```bash
# Test bezpośrednio API
curl http://localhost:4321/api/public/report-links/YOUR_TOKEN
```

### Problem: "Offline queue nie działa"

**Przyczyny:**
1. **IndexedDB wyłączone:** Tryb incognito blokuje IndexedDB
2. **Brak pakietu idb:** `npm install idb`
3. **Błąd w ServiceWorker:** Sprawdź Application tab w DevTools

**Debug:**
```javascript
// W konsoli przeglądarki
indexedDB.databases().then(console.log);
```

### Problem: "Edit nie działa"

**Przyczyny:**
1. **Brak tokenu w SessionStorage**
2. **Upłynęło 10 minut**
3. **Token nie pasuje**

**Debug:**
```javascript
// W konsoli przeglądarki
Object.keys(sessionStorage)
  .filter(k => k.startsWith('routelog:report:'))
  .forEach(k => {
    console.log(k, JSON.parse(sessionStorage.getItem(k)));
  });
```

---

## 7. Monitoring i Telemetria

### Sprawdź czy telemetria działa

W Network tab powinieneś zobaczyć requesty do `/api/telemetry`:

```bash
# Po załadowaniu formularza
POST /api/telemetry
{
  "eventType": "FORM_OPEN",
  "linkUuid": "...",
  "metadata": { ... }
}

# Po wysłaniu
POST /api/telemetry
{
  "eventType": "FORM_SUBMIT",
  "reportUuid": "...",
  "duration": 45,
  "interactions": 3
}
```

### Sprawdź logi w bazie

```sql
-- Telemetria
SELECT * FROM telemetry_events 
WHERE event_type IN ('FORM_OPEN', 'FORM_SUBMIT', 'TOKEN_INVALID')
ORDER BY occurred_at DESC 
LIMIT 10;

-- Raporty
SELECT * FROM reports 
ORDER BY created_at DESC 
LIMIT 5;

-- Linki
SELECT * FROM report_links 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 8. Testy automatyczne (TODO)

### Unit tests (Vitest)

```bash
# Uruchom testy jednostkowe
npm run test

# Testy dla konkretnego pliku
npm run test -- src/lib/validation/public-report.schema.test.ts
```

### E2E tests (Playwright - do zaimplementowania)

```bash
# Uruchom testy E2E
npm run test:e2e

# Testy w trybie debug
npm run test:e2e -- --debug
```

---

## 9. Performance Testing

### Lighthouse Audit

1. Otwórz formularz w Chrome
2. DevTools → Lighthouse
3. Wybierz "Mobile" + wszystkie kategorie
4. Kliknij "Analyze page load"

**Cel:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 80

### Time to Interactive

```javascript
// W konsoli przeglądarki
performance.getEntriesByType('navigation')[0].domInteractive
// Cel: < 2000ms (2 sekundy)
```

---

## 10. Checklist przed wdrożeniem na produkcję

### Security
- [ ] Token pepper ustawiony w production env
- [ ] HTTPS włączony
- [ ] Rate limiting działa
- [ ] CORS poprawnie skonfigurowany
- [ ] Brak wrażliwych danych w logach

### Funkcjonalność
- [ ] Wszystkie testy manualne przeszły
- [ ] API endpointy działają
- [ ] Offline mode działa
- [ ] Edycja działa
- [ ] Email notifications działają (jeśli zaimplementowane)

### Performance
- [ ] Lighthouse score > 90
- [ ] Time to Interactive < 2s
- [ ] Bundle size < 200KB (gzipped)
- [ ] Brak memory leaks

### Monitoring
- [ ] Telemetria wysyła eventy
- [ ] Logi są zapisywane
- [ ] Error tracking skonfigurowany (Sentry?)
- [ ] Metryki dostępne

---

## 📞 Potrzebujesz pomocy?

- **Dokumentacja techniczna:** Zobacz `.ai/public-report-form-view-implementation-plan.md`
- **API Documentation:** Zobacz `.ai/api-plan.md`
- **Component Documentation:** Zobacz `src/components/public-report/README.md`

---

**Powodzenia w testowaniu! 🚀**


