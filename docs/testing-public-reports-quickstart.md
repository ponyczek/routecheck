# 🧪 Testowanie Publicznych Raportów - Szybki Start

## Najszybsza metoda (2 minuty)

### 1. Uruchom serwer

```bash
npm run dev
```

### 2. Wygeneruj token i przetestuj API

```bash
# Automatyczny test wszystkich endpointów
./scripts/test-public-reports.sh
```

### 3. Przetestuj w przeglądarce

```bash
# Wygeneruj nowy token (poprzedni jest już użyty)
npx tsx scripts/generate-test-token.ts

# Skopiuj URL z outputu i otwórz w przeglądarce
# Przykład: http://localhost:4321/public/report-links/abc123...
```

---

## Metody testowania

### 📋 Metoda 1: Automatyczne testy API (zalecane na początek)

```bash
# Uruchom wszystkie testy API
./scripts/test-public-reports.sh

# Z konkretnym kierowcą
TEST_DRIVER_EMAIL=jan@example.com ./scripts/test-public-reports.sh

# Na innym porcie
BASE_URL=http://localhost:3000 ./scripts/test-public-reports.sh
```

**Co testuje:**

- ✅ Generowanie tokenu
- ✅ Walidacja tokenu (GET)
- ✅ Wysłanie raportu (POST)
- ✅ Detekcja duplikatów (409)
- ✅ Obsługa nieprawidłowego tokenu (404)

---

### 🌐 Metoda 2: Manualne testy w przeglądarce

#### Krok 1: Wygeneruj token

```bash
npx tsx scripts/generate-test-token.ts
```

#### Krok 2: Otwórz URL

```
http://localhost:4321/public/report-links/[TOKEN_Z_OUTPUTU]
```

#### Krok 3: Przetestuj scenariusze

**Scenariusz A: Happy Path (30 sekund)**

1. Zostaw zaznaczone "Wszystko OK"
2. Kliknij "Wyślij raport"
3. ✅ Zobacz widok sukcesu z licznikiem 10:00

**Scenariusz B: Problem Path (1 minuta)**

1. Kliknij "Mam problem"
2. Wybierz status: "Częściowo wykonano"
3. Wpisz opóźnienie: 30 minut
4. Wpisz powód: "Korek na autostradzie"
5. Kliknij "Wyślij raport"
6. ✅ Zobacz widok sukcesu

**Scenariusz C: Walidacja**

1. Kliknij "Mam problem"
2. Wpisz opóźnienie: 60 minut
3. NIE wpisuj powodu
4. Spróbuj wysłać
5. ✅ Zobacz błąd walidacji

**Scenariusz D: Offline Mode**

1. Otwórz DevTools (F12) → Network
2. Zmień na "Offline"
3. Wypełnij i wyślij formularz
4. ✅ Zobacz "Zapisano offline"
5. Zmień na "Online"
6. ✅ Zobacz auto-wysłanie

**Scenariusz E: Edycja**

1. Wyślij raport
2. Kliknij "Edytuj raport"
3. Zmień dane
4. Wyślij ponownie
5. ✅ Zobacz zaktualizowany raport

---

### 🛠️ Metoda 3: Testy curl (dla deweloperów API)

#### Test 1: Walidacja tokenu

```bash
TOKEN="twoj-token-tutaj"
curl -v http://localhost:4321/api/public/report-links/$TOKEN
```

#### Test 2: Wysłanie raportu

```bash
curl -X POST http://localhost:4321/api/public/report-links/$TOKEN/reports \
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
```

#### Test 3: Problem report

```bash
curl -X POST http://localhost:4321/api/public/report-links/$TOKEN/reports \
  -H "Content-Type: application/json" \
  -d '{
    "routeStatus": "PARTIALLY_COMPLETED",
    "delayMinutes": 60,
    "delayReason": "Awaria pojazdu na autostradzie",
    "cargoDamageDescription": "Lekkie uszkodzenie opakowania",
    "vehicleDamageDescription": null,
    "nextDayBlockers": "Pojazd wymaga naprawy",
    "timezone": "Europe/Warsaw"
  }'
```

---

## 🔍 Troubleshooting

### Problem: "No active drivers found"

**Rozwiązanie:**

```sql
-- Stwórz testowego kierowcę
INSERT INTO drivers (company_uuid, first_name, last_name, email, phone, is_active)
SELECT uuid, 'Jan', 'Testowy', 'jan.test@example.com', '+48123456789', true
FROM companies
LIMIT 1;
```

### Problem: "Token validation failed"

**Sprawdź:**

1. Czy `PRIVATE_TOKEN_PEPPER` jest w `.env`?
2. Czy token nie jest użyty? (`used_at IS NULL` w bazie)
3. Czy token nie wygasł? (`expires_at > now()`)

**Debug:**

```sql
SELECT * FROM report_links
ORDER BY created_at DESC
LIMIT 5;
```

### Problem: "Port 4321 already in use"

**Rozwiązanie:**

```bash
# Zabij proces
lsof -ti:4321 | xargs kill -9

# Lub użyj innego portu
npm run dev -- --port 3000
```

---

## 📚 Dodatkowa dokumentacja

- **Pełny przewodnik testowania:** `docs/testing-public-reports.md`
- **Plan implementacji:** `.ai/public-report-form-view-implementation-plan.md`
- **Plan API:** `.ai/api-plan.md`
- **Dokumentacja komponentów:** `src/components/public-report/README.md`

---

## ✅ Quick Checklist

Przed uznaniem za działające, sprawdź:

- [ ] Token generuje się poprawnie
- [ ] GET endpoint zwraca dane kierowcy
- [ ] POST endpoint przyjmuje happy path
- [ ] POST endpoint przyjmuje problem path
- [ ] Walidacja działa (delay reason required)
- [ ] Duplikaty są odrzucane (409)
- [ ] Nieprawidłowe tokeny zwracają 404
- [ ] Formularz ładuje się w przeglądarce
- [ ] Widok sukcesu pokazuje się po wysłaniu
- [ ] Licznik 10 minut odlicza
- [ ] Offline mode działa (opcjonalne - wymaga IndexedDB)

---

## 🚀 Następne kroki

Po podstawowym testowaniu:

1. **Performance:** Sprawdź Lighthouse (cel: >90)
2. **Accessibility:** Test z klawiaturą i screen readerem
3. **Mobile:** Test na prawdziwym urządzeniu
4. **E2E:** Napisz testy Playwright (opcjonalne)
5. **Load testing:** Sprawdź rate limiting

---

**Pytania?** Zobacz `docs/testing-public-reports.md` dla szczegółów.

**Powodzenia! 🎉**
